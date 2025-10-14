import { supabase } from '../../supabaseClient';

/**
 * Отримує історію підписок користувача з пагінацією.
 * @param {number} page - Номер поточної сторінки (за замовчуванням 1).
 * @param {number} limit - Кількість записів на сторінці (за замовчуванням 10).
 * @returns {Promise<{ subscriptions: Array, count: number }>} Масив підписок і загальна кількість.
 */
export async function fetchUserBillingHistory(page = 1, limit = 10) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Користувач не авторизований. Будь ласка, увійдіть.');
    }

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const { data: subscriptions, error: fetchError, count } = await supabase
      .from('user_subscriptions')
      .select('id, plan_name, status, starts_at, ends_at, payment_id, created_at, cancelled_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (fetchError) {
      throw fetchError;
    }

    return { subscriptions, count };
  } catch (error) {
    console.error("Помилка при завантаженні історії платежів:", error);
    throw new Error(error.message || 'Не вдалося завантажити історію платежів.');
  }
}

/**
 * Скасовує підписку користувача
 */
export async function cancelUserSubscription(subscriptionId) {
  try {
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (updateError) {
      console.error('Помилка оновлення підписки:', updateError);
      throw updateError;
    }
    
    // Оновлюємо поточний план користувача до "free" у таблиці профілів
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_plan: 'free' })
        .eq('id', user.id);

      if (profileError) {
        console.error('Помилка оновлення плану користувача:', profileError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Помилка при скасуванні підписки:", error);
    throw new Error(error.message || 'Не вдалося скасувати підписку.');
  }
}
