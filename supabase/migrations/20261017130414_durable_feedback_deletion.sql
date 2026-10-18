create table if not exists public.feedback_deletion_jobs (
  message_id uuid primary key,
  screenshot_url text not null,
  created_at timestamptz not null default now(),
  last_attempt_at timestamptz
);
alter table public.feedback_deletion_jobs enable row level security;
revoke all on public.feedback_deletion_jobs from public,anon,authenticated;
grant select,update on public.feedback_deletion_jobs to service_role;

create or replace function public.delete_feedback_message(p_actor uuid,p_message uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare attachment text; job jsonb;
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor and
    (role='super_admin' or (role='admin' and 'feedback.delete'=any(coalesce(allowed_tabs,'{}'))))) then
    raise exception 'Forbidden: Feedback deletion permission required' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('feedback-delete:'||p_message::text,0));
  select screenshot_url into attachment from public.contacts_messages where id=p_message for update;
  if found then
    if nullif(attachment,'') is not null then
      insert into public.feedback_deletion_jobs(message_id,screenshot_url) values(p_message,attachment);
    end if;
    delete from public.contacts_messages where id=p_message;
    insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
      values(p_actor,'delete_feedback','contacts_messages',p_message::text,
        jsonb_build_object('attachment_cleanup_pending',nullif(attachment,'') is not null));
  end if;
  select to_jsonb(j) into job from public.feedback_deletion_jobs j where message_id=p_message;
  return job;
end $$;

create or replace function public.finish_feedback_deletion(p_actor uuid,p_message uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.admin_profiles where user_id=p_actor and
    (role='super_admin' or (role='admin' and 'feedback.delete'=any(coalesce(allowed_tabs,'{}'))))) then
    raise exception 'Forbidden: Feedback deletion permission required' using errcode='42501';
  end if;
  delete from public.feedback_deletion_jobs where message_id=p_message;
  if found then
    insert into public.audit_logs(admin_id,action,target_table,record_id,new_data)
      values(p_actor,'delete_feedback_attachment','contacts_messages',p_message::text,'{"cleanup_completed":true}');
  end if;
end $$;
revoke all on function public.delete_feedback_message(uuid,uuid),public.finish_feedback_deletion(uuid,uuid) from public,anon,authenticated;
grant execute on function public.delete_feedback_message(uuid,uuid),public.finish_feedback_deletion(uuid,uuid) to service_role;
