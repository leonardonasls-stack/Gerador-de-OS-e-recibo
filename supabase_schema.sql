-- Schema inicial para o Gerador de OS (Supabase / PostgreSQL)

-- 1. Criação das Tabelas

CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    cnpj TEXT,
    fone TEXT,
    email TEXT,
    "end" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- Cada usuário tem apenas 1 empresa
);

CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    doc TEXT,
    "end" TEXT,
    contato TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    custo NUMERIC(10, 2) DEFAULT 0,
    margem NUMERIC(10, 2) DEFAULT 0,
    val NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    data TEXT,
    status TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_snapshot JSONB, -- Salva uma cópia dos dados do cliente no momento da OS
    equipamento TEXT,
    servico TEXT,
    obsInterna TEXT,
    desconto NUMERIC(10, 2) DEFAULT 0,
    tecnico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
    "desc" TEXT NOT NULL,
    qtd NUMERIC(10, 2) DEFAULT 1,
    val NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitando RLS (Row Level Security)

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_items ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Policies)
-- Garante que cada usuário só pode Ler, Inserir, Atualizar e Deletar seus próprios dados

-- Empresas
CREATE POLICY "Usuários podem gerenciar suas próprias empresas" 
ON public.empresas FOR ALL USING (auth.uid() = user_id);

-- Clientes
CREATE POLICY "Usuários podem gerenciar seus próprios clientes" 
ON public.clientes FOR ALL USING (auth.uid() = user_id);

-- Produtos
CREATE POLICY "Usuários podem gerenciar seus próprios produtos" 
ON public.produtos FOR ALL USING (auth.uid() = user_id);

-- OS
CREATE POLICY "Usuários podem gerenciar suas próprias OS" 
ON public.os FOR ALL USING (auth.uid() = user_id);

-- OS Items (Depende da OS)
CREATE POLICY "Usuários podem gerenciar os itens de suas OS" 
ON public.os_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.os
        WHERE os.id = os_items.os_id AND os.user_id = auth.uid()
    )
);

-- 4. Função para obter o próximo número de OS para o usuário
CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
  FROM public.os
  WHERE user_id = p_user_id;
  
  RETURN next_num;
END;
$$;
