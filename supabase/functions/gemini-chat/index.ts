import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: latestSysLog } = await supabaseAdmin
      .from('ai_system_logs')
      .select('system_action')
      .eq('log_type', 'system')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestSysLog?.system_action === 'disabled_ai') {
      return new Response(JSON.stringify({ text: "Вибачте, адміністратор тимчасово вимкнув AI Assistant на сервері." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { message, context, history, language = 'uk' } = await req.json();
    const genAI = new GoogleGenerativeAI(geminiKey);

    const analyzeDistrictsTool = {
      name: "analyze_districts",
      description: "Пошук та аналіз районів у базі даних GeoAnalyzer за розширеними критеріями.",
      parameters: {
        type: "OBJECT",
        properties: {
          city: { type: "STRING", description: "Назва міста (обов'язково)" },
          max_rent: { type: "NUMBER", description: "Максимальна ціна оренди" },
          max_sale_sqm: { type: "NUMBER", description: "Максимальна ціна за м2 при купівлі" },
          min_safety: { type: "NUMBER", description: "Мінімальний рейтинг безпеки (0-10)" },
          min_transport: { type: "NUMBER", description: "Мінімальний рейтинг транспорту (0-10)" },
          min_ecology: { type: "NUMBER", description: "Мінімальний рейтинг екології/соціуму (0-10)" },
          needs_metro: { type: "BOOLEAN", description: "Чи потрібне метро" },
          needs_parks: { type: "BOOLEAN", description: "Чи потрібні парки" },
          limit: { type: "NUMBER", description: "Кількість результатів (за замовчуванням 5)" }
        },
        required: ["city"]
      }
    };

const systemInstruction = `
Ти — професійний AI-аналітик нерухомості платформи GeoAnalyzer. 

ТВОЯ МЕТА:
Допомагати користувачам підбирати найкращі райони для життя, оренди або інвестицій на основі їхніх побажань та об'єктивних даних.

ПРАВИЛА ТА ОБМЕЖЕННЯ (CRITICAL):
1. Тематика: Відповідай ТІЛЬКИ на питання, пов'язані з нерухомістю, районами, інфраструктурою, екологією та життям у місті. Якщо запит не по темі — ввічливо відмовся і нагадай свою роль.
2. Достовірність: НІКОЛИ не вигадуй ціни, статистику чи рейтинги районів. Якщо у тебе немає точних даних, використовуй наданий інструмент [analyze_districts]. 
3. Локалізація: ОБОВ'ЯЗКОВО адаптуй свою відповідь під мову користувача. Користувач використовує інтерфейс мовою: "${language}".
4. Зрозуміла мова: НІКОЛИ не виводь користувачу технічні назви полів з бази даних (наприклад, social_rating, average_rent_price тощо). Перекладай їх у звичайні, зрозумілі людям терміни (наприклад, "Рейтинг екології", "Середня ціна оренди").

ФОРМАТ ВІДПОВІДІ:
* Будь лаконічним, експертним та привітним.
* Структуруй інформацію: використовуй марковані списки для переліку районів або характеристик.
* Виділяй ключові цифри (ціни, рейтинги) та назви районів **жирним шрифтом**.
* Не пиши занадто довгих вступів. Одразу переходь до суті.

КОНТЕКСТ КОРИСТУВАЧА:
Поточні налаштування фільтрів користувача: ${JSON.stringify(context)}.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations: [analyzeDistrictsTool] }],
      systemInstruction: systemInstruction
    });

    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response;
    const functionCall = response.functionCalls()?.[0];
    
    let finalOutput = "";

    if (functionCall && functionCall.name === "analyze_districts") {
      const args = functionCall.args as any;
      let query = supabase
        .from('districts')
        .select(`
          name, 
          cities!inner(name), 
          district_filter_data!inner(
            average_rent_price, average_sale_price_sqm, 
            safety_rating, transport_rating, social_rating, education_rating,
            parks_count, metro_stations_count, crime_level, air_quality
          )
        `)
        .ilike('cities.name', `%${args.city}%`)
        .eq('is_available', true);

      if (args.max_rent) query = query.lte('district_filter_data.average_rent_price', args.max_rent).gt('district_filter_data.average_rent_price', 0);
      if (args.max_sale_sqm) query = query.lte('district_filter_data.average_sale_price_sqm', args.max_sale_sqm).gt('district_filter_data.average_sale_price_sqm', 0);
      if (args.min_safety) query = query.gte('district_filter_data.safety_rating', args.min_safety);
      if (args.min_transport) query = query.gte('district_filter_data.transport_rating', args.min_transport);
      if (args.min_ecology) query = query.gte('district_filter_data.social_rating', args.min_ecology);
      if (args.needs_metro) query = query.gt('district_filter_data.metro_stations_count', 0);
      if (args.needs_parks) query = query.gt('district_filter_data.parks_count', 0);
      
      const { data: dbData, error } = await query.limit(args.limit || 5);
      if (error) throw error;

      const toolResult = await chat.sendMessage([{
        functionResponse: {
          name: "analyze_districts",
          response: { districts: dbData?.length ? dbData : "Районів за такими критеріями не знайдено." }
        }
      }]);
      finalOutput = toolResult.response.text();
    } else {
      finalOutput = response.text();
    }

    await supabaseAdmin.from('ai_system_logs').insert({
      user_id: user.id,
      user_email: user.email,
      log_type: 'chat',
      prompt: message,
      response: finalOutput
    });

    return new Response(JSON.stringify({ text: finalOutput }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});