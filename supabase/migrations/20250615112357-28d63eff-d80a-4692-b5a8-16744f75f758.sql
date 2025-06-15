
-- GitHub Token Storage Table
create table public.user_github_tokens (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  access_token text not null,
  scope text,
  token_type text,
  expires_at timestamp with time zone,
  refresh_token text,
  connected boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Add a unique constraint per user (only 1 record per user)
create unique index user_github_tokens_user_id_idx on public.user_github_tokens(user_id);

-- Enable Row Level Security
alter table public.user_github_tokens enable row level security;

-- RLS: Only the user can read/write their token
create policy "Allow token owner read" on public.user_github_tokens for select using (auth.uid() = user_id);
create policy "Allow token owner insert" on public.user_github_tokens for insert with check (auth.uid() = user_id);
create policy "Allow token owner update" on public.user_github_tokens for update using (auth.uid() = user_id);
create policy "Allow token owner delete" on public.user_github_tokens for delete using (auth.uid() = user_id);

-- GitLab Token Storage Table
create table public.user_gitlab_tokens (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null,
  access_token text not null,
  scope text,
  token_type text,
  expires_at timestamp with time zone,
  refresh_token text,
  connected boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Add a unique constraint per user (only 1 record per user)
create unique index user_gitlab_tokens_user_id_idx on public.user_gitlab_tokens(user_id);

-- Enable Row Level Security
alter table public.user_gitlab_tokens enable row level security;

-- RLS: Only the user can read/write their token
create policy "Allow token owner read" on public.user_gitlab_tokens for select using (auth.uid() = user_id);
create policy "Allow token owner insert" on public.user_gitlab_tokens for insert with check (auth.uid() = user_id);
create policy "Allow token owner update" on public.user_gitlab_tokens for update using (auth.uid() = user_id);
create policy "Allow token owner delete" on public.user_gitlab_tokens for delete using (auth.uid() = user_id);
