-- BoaViagem — schema do Supabase (Parte 7)
-- Rode isso no SQL Editor do projeto Supabase real (Dashboard > SQL Editor).
-- Idempotente: pode rodar de novo sem duplicar nada.

-- =========================================================================
-- usuarios
-- Uma linha por usuário autenticado (auth.users), guarda nome/telefone de
-- exibição + o status da assinatura que o webhook do Stripe mantém em dia.
-- =========================================================================
create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  telefone text,
  plano text not null default 'trial' check (plano in ('trial', 'ativo', 'cancelado')),
  stripe_customer_id text,
  stripe_subscription_id text,
  -- Libera acesso (middleware) e testes de cancelamento independente do
  -- `plano`/cobrança — pra contas de teste, sem precisar assinar/cancelar de
  -- verdade. Marque manualmente: update usuarios set is_admin = true where ...
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.usuarios add column if not exists is_admin boolean not null default false;
alter table public.usuarios add column if not exists stripe_customer_id text;
alter table public.usuarios add column if not exists stripe_subscription_id text;
-- Colunas da Cakto, sem uso desde a migração pro Stripe.
alter table public.usuarios drop column if exists cakto_customer_id;
alter table public.usuarios drop column if exists cakto_subscription_id;

-- Cria a linha em usuarios automaticamente no primeiro login (telefone via OTP).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, telefone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.usuarios enable row level security;

drop policy if exists "usuarios: ver o próprio registro" on public.usuarios;
create policy "usuarios: ver o próprio registro"
  on public.usuarios for select
  using (auth.uid() = id);

drop policy if exists "usuarios: atualizar o próprio registro" on public.usuarios;
create policy "usuarios: atualizar o próprio registro"
  on public.usuarios for update
  using (auth.uid() = id);

-- Nenhuma policy de insert/delete pro client: a linha nasce via trigger, e
-- só a service_role (Edge Function do webhook) deve poder mudar `plano`.

-- =========================================================================
-- viagens
-- =========================================================================
create table if not exists public.viagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  origem text,
  destino text,
  distancia_km integer not null,
  tipo_caminhao text not null check (tipo_caminhao in ('toco', 'truck', 'carreta', 'bitrem')),
  valor_frete numeric(10, 2) not null,
  custo_diesel numeric(10, 2) not null default 0,
  custo_pedagio numeric(10, 2) not null default 0,
  custo_manutencao numeric(10, 2) not null default 0,
  custo_alimentacao numeric(10, 2) not null default 0,
  custo_total numeric(10, 2) not null default 0,
  lucro numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists viagens_user_id_created_at_idx
  on public.viagens (user_id, created_at desc);

alter table public.viagens enable row level security;

drop policy if exists "viagens: crud só do próprio usuário" on public.viagens;
create policy "viagens: crud só do próprio usuário"
  on public.viagens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =========================================================================
-- valores_medios
-- Uma linha por usuário com os valores médios usados pra pré-preencher os
-- custos padrão no calculador (diesel, pedágio, manutenção, alimentação).
-- =========================================================================
create table if not exists public.valores_medios (
  user_id uuid primary key references auth.users (id) on delete cascade,
  preco_diesel numeric(10, 2) not null default 6.1,
  pedagio_por_km_por_eixo numeric(10, 4) not null default 0.09,
  manutencao_por_km numeric(10, 4) not null default 0.35,
  alimentacao_por_dia numeric(10, 2) not null default 70,
  km_por_dia integer not null default 500,
  updated_at timestamptz not null default now()
);

alter table public.valores_medios enable row level security;

drop policy if exists "valores_medios: crud só do próprio usuário" on public.valores_medios;
create policy "valores_medios: crud só do próprio usuário"
  on public.valores_medios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
