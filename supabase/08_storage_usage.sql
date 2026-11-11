-- POISE Fitness Studio Time Clock — storage usage reporting
-- Exposes total storage used per bucket so the admin Settings page can show it.
-- SECURITY DEFINER so it can read the storage.objects table; returns only sizes.

create or replace function public.storage_usage()
returns table(bucket_id text, file_count bigint, bytes bigint)
language sql
security definer
set search_path = public
as $$
  select o.bucket_id,
         count(*)::bigint,
         coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint
  from storage.objects o
  group by o.bucket_id;
$$;

revoke all on function public.storage_usage() from public;
grant execute on function public.storage_usage() to authenticated, service_role;
