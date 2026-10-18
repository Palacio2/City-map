import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.2';
import { feedbackObjectPath } from './feedbackStorage.ts';
export interface FeedbackDeletionJob { message_id: string; screenshot_url: string }

// Storage and Postgres cannot commit together. Preserve the durable job on
// every failure, including a lost acknowledgement after successful removal.
export async function cleanFeedbackAttachment(db: SupabaseClient, actor: string, job: FeedbackDeletionJob): Promise<boolean> {
  try {
    const { error: attemptError } = await db.from('feedback_deletion_jobs')
      .update({ last_attempt_at: new Date().toISOString() }).eq('message_id',job.message_id);
    if (attemptError) return false;
    const path=feedbackObjectPath(job.screenshot_url,Deno.env.get('SUPABASE_URL') ?? '');
    if (!path) return false;
    const { error } = await db.storage.from('feedback_images').remove([path]);
    if (error) return false;
    const { error: finishError } = await db.rpc('finish_feedback_deletion',{p_actor:actor,p_message:job.message_id});
    return !finishError;
  } catch { return false; }
}

export async function retryFeedbackAttachments(db: SupabaseClient, actor: string) {
  const { data, error } = await db.from('feedback_deletion_jobs').select('message_id,screenshot_url')
    .order('last_attempt_at',{ascending:true,nullsFirst:true}).order('created_at',{ascending:true}).limit(10);
  if (error) return;
  await Promise.all((data ?? []).map(job=>cleanFeedbackAttachment(db,actor,job)));
}
