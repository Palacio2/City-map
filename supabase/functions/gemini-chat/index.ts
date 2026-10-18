import { publishableKey } from '../_shared/keys.ts';
import { getDistrictDataClient, getFieldsConfig, getUserAccess } from '../_shared/security.ts';
import { districtToolFilters, districtToolData } from './districtTool.ts';
import { AI_LIMITS, parseAiRequest } from '../../../shared/aiContract.ts';
import { readJsonObject, RequestError } from '../_shared/request.ts';
import { createClient } from "npm:@supabase/supabase-js@2.112.2";
import { GoogleGenerativeAI, SchemaType, type FunctionDeclaration } from "npm:@google/generative-ai@0.21.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'private, no-store',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = publishableKey();
    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new RequestError('Unauthorized', 401);
    const access = await getUserAccess(req);
    if (!access.isRealtor) throw new RequestError('Realtor subscription required', 403);

    const supabaseAdmin = getDistrictDataClient();
    const { data: latestSysLog, error: settingsError } = await supabaseAdmin
      .from('ai_system_logs')
      .select('system_action')
      .eq('log_type', 'system')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (settingsError) throw new Error('AI settings unavailable');

    if (latestSysLog?.system_action === 'disabled_ai') {
      return new Response(JSON.stringify({ text: "Вибачте, адміністратор тимчасово вимкнув AI Assistant на сервері." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const raw = await readJsonObject(req, 96_000);
    let input;
    try { input = parseAiRequest(raw); } catch { throw new RequestError('Invalid AI request'); }
    const { message, context, history, language } = input;
    const { data: quota, error: quotaError } = await supabaseAdmin.rpc('claim_ai_request', {
      p_user_id: user.id, p_hourly_limit: AI_LIMITS.hourlyRequests, p_daily_limit: AI_LIMITS.dailyRequests,
    });
    if (quotaError) throw new Error('AI quota unavailable');
    if (quota !== true) throw new RequestError('AI request limit reached', 429);
    const genAI = new GoogleGenerativeAI(geminiKey);

    const analyzeDistrictsTool: FunctionDeclaration = {
      name: "analyze_districts",
      description: "Пошук та аналіз районів у базі даних Kvartal за розширеними критеріями.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          city: { type: SchemaType.STRING, description: "Назва міста (обов'язково)" },
          max_rent: { type: SchemaType.NUMBER, description: "Максимальна ціна оренди" },
          max_sale_sqm: { type: SchemaType.NUMBER, description: "Максимальна ціна за м2 при купівлі" },
          min_safety: { type: SchemaType.NUMBER, description: "Мінімальний рейтинг безпеки (0-10)" },
          min_transport: { type: SchemaType.NUMBER, description: "Мінімальний рейтинг транспорту (0-10)" },
          min_ecology: { type: SchemaType.NUMBER, description: "Мінімальний рейтинг екології/соціуму (0-10)" },
          needs_metro: { type: SchemaType.BOOLEAN, description: "Чи потрібне метро" },
          needs_parks: { type: SchemaType.BOOLEAN, description: "Чи потрібні парки" },
          limit: { type: SchemaType.NUMBER, description: "Кількість результатів (за замовчуванням 5)" }
        },
        required: ["city"]
      }
    };

const systemInstruction = `
Ти — професійний AI-аналітик нерухомості платформи Kvartal.

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
      generationConfig: { maxOutputTokens: AI_LIMITS.outputTokens },
      tools: [{ functionDeclarations: [analyzeDistrictsTool] }],
      systemInstruction: systemInstruction
    });

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response;
    const functionCall = response.functionCalls()?.[0];

    let finalOutput = "";

    if (functionCall && functionCall.name === "analyze_districts") {
      const args = functionCall.args as any;
      const fields = await getFieldsConfig();
      const criteria = districtToolFilters(args, fields, access);
      let query = supabaseAdmin
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
        .eq('cities.name', criteria.city)
        .eq('is_available', true);

      for (const filter of criteria.filters) {
        query = query[filter.operator]('district_filter_data.' + filter.column, filter.value);
        if (filter.operator === 'lte') query = query.gt('district_filter_data.' + filter.column, 0);
      }
      const { data: rawData, error } = await query.limit(criteria.limit);
      if (error) throw error;

      const dbData = districtToolData(rawData ?? [], fields, access);
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

    if (finalOutput.length > AI_LIMITS.responseChars) throw new Error('AI output too large');

    return new Response(JSON.stringify({ text: finalOutput }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof RequestError ? error.message : 'AI service unavailable' }), {
      status: error instanceof RequestError ? error.status : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
