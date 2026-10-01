-- 깡깡이 상식 · 아이디/비번 로그인 설정 (SQL Editor 에 전체 붙여넣고 Run, 여러 번 돌려도 안전)
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.ss_accounts (
  id         text primary key check (id ~ '^[a-z0-9._-]{3,20}$'),
  pw         text not null,
  data       text,
  t          bigint not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.ss_tokens (
  token      uuid primary key default gen_random_uuid(),
  id         text not null references public.ss_accounts(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- 표는 잠가 두고(정책 없음), 아래 함수로만 드나든다
alter table public.ss_accounts enable row level security;
alter table public.ss_tokens   enable row level security;
revoke all on public.ss_accounts, public.ss_tokens from anon, authenticated;

create or replace function public.ss_signup(p_id text, p_pw text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare tok uuid;
begin
  if p_id !~ '^[a-z0-9._-]{3,20}$' then raise exception 'bad_id'; end if;
  if char_length(p_pw) < 6 or char_length(p_pw) > 72 then raise exception 'bad_pw'; end if;
  if exists (select 1 from ss_accounts where id = p_id) then raise exception 'id_taken'; end if;
  insert into ss_accounts(id, pw) values (p_id, crypt(p_pw, gen_salt('bf')));
  insert into ss_tokens(id) values (p_id) returning token into tok;
  return tok;
end $$;

create or replace function public.ss_login(p_id text, p_pw text) returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare h text; tok uuid;
begin
  select pw into h from ss_accounts where id = p_id;
  if h is null or crypt(p_pw, h) <> h then perform pg_sleep(0.5); raise exception 'bad_login'; end if;
  insert into ss_tokens(id) values (p_id) returning token into tok;
  return tok;
end $$;

create or replace function public.ss_load(p_token uuid) returns json
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  select a.id, a.data, a.t into r from ss_tokens k join ss_accounts a on a.id = k.id where k.token = p_token;
  if r.id is null then raise exception 'bad_token'; end if;
  return json_build_object('id', r.id, 'data', r.data, 't', r.t);
end $$;

create or replace function public.ss_save(p_token uuid, p_data text, p_t bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare uid text;
begin
  select id into uid from ss_tokens where token = p_token;
  if uid is null then raise exception 'bad_token'; end if;
  if char_length(p_data) > 300000 then raise exception 'too_big'; end if;
  update ss_accounts set data = p_data, t = p_t where id = uid;
  return p_t;
end $$;

create or replace function public.ss_logout(p_token uuid) returns void
language sql security definer set search_path = public as $$ delete from ss_tokens where token = p_token $$;

revoke all on function public.ss_signup(text,text), public.ss_login(text,text), public.ss_load(uuid),
  public.ss_save(uuid,text,bigint), public.ss_logout(uuid) from public;
grant execute on function public.ss_signup(text,text), public.ss_login(text,text), public.ss_load(uuid),
  public.ss_save(uuid,text,bigint), public.ss_logout(uuid) to anon, authenticated;

-- 확인: 아래 표의 ok 가 전부 ✅ 면 끝
select 항목, ok from (values
  ('계정 표', (select case when count(*)=1 then '✅' else '❌' end from pg_tables where tablename='ss_accounts')),
  ('잠금(RLS)', (select case when bool_and(relrowsecurity) then '✅' else '❌' end from pg_class where relname in ('ss_accounts','ss_tokens'))),
  ('함수 5개', (select case when count(*)=5 then '✅' else '❌' end from pg_proc where proname in ('ss_signup','ss_login','ss_load','ss_save','ss_logout')))
) as v(항목, ok);
