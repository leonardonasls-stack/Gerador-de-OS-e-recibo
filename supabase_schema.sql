-- Schema Consolidado para o Gerador de OS (Supabase / PostgreSQL)
-- Atualizado após as Fases 1, 2, 3 e 4.

-- 1. Criação das Tabelas

CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    documento TEXT,
    contato TEXT,
    obs TEXT,
    cep TEXT,
    rua TEXT,
    numero_end TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    custo NUMERIC(10, 2) DEFAULT 0,
    margem NUMERIC(10, 2) DEFAULT 0,
    valor NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.equipamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    marca TEXT,
    n_serie TEXT,
    obs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os_counter (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    ultimo_numero INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.os (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    data DATE,
    status TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_snapshot JSONB,
    equipamento TEXT,
    servico TEXT,
    obs_interna TEXT,
    desconto NUMERIC(10, 2) DEFAULT 0,
    tecnico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    quantidade NUMERIC(10, 2) DEFAULT 1,
    valor NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- 2. Índices de Performance

CREATE INDEX idx_os_user_id ON public.os(user_id);
CREATE INDEX idx_os_numero ON public.os(user_id, numero DESC);
CREATE INDEX idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX idx_os_items_os_id ON public.os_items(os_id);
CREATE INDEX idx_equipamentos_user_id ON public.equipamentos(user_id);
CREATE INDEX idx_equipamentos_cliente_id ON public.equipamentos(cliente_id);


-- 3. Habilitando RLS (Row Level Security)

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_items ENABLE ROW LEVEL SECURITY;


-- 4. Políticas de Segurança (Policies)

-- Empresas
CREATE POLICY "Usuários gerenciam próprias empresas" ON public.empresas FOR ALL USING (auth.uid() = user_id);

-- Clientes
CREATE POLICY "Usuários gerenciam próprios clientes" ON public.clientes FOR ALL USING (auth.uid() = user_id);

-- Produtos
CREATE POLICY "Usuários gerenciam próprios produtos" ON public.produtos FOR ALL USING (auth.uid() = user_id);

-- Equipamentos
CREATE POLICY "Usuários gerenciam próprios equipamentos" ON public.equipamentos FOR ALL USING (auth.uid() = user_id);

-- OS Counter
CREATE POLICY "Permitir select do próprio counter" ON public.os_counter FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Permitir update do próprio counter" ON public.os_counter FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Permitir insert do próprio counter" ON public.os_counter FOR INSERT WITH CHECK (auth.uid() = user_id);

-- OS
CREATE POLICY "Usuários gerenciam próprias OS" ON public.os FOR ALL USING (auth.uid() = user_id);

-- OS Items
CREATE POLICY "Usuários gerenciam itens de suas OS" ON public.os_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.os WHERE os.id = os_items.os_id AND os.user_id = auth.uid())
);


-- 5. Funções (RPCs)

-- Obter próximo número de OS
CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE next_num INTEGER;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado: Tentativa de acesso a counter de outro usuario';
  END IF;

  INSERT INTO public.os_counter (user_id, ultimo_numero)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET ultimo_numero = os_counter.ultimo_numero + 1
  RETURNING ultimo_numero INTO next_num;
  
  RETURN next_num;
END;
$$;


-- Salvar OS e Itens de forma transacional
CREATE OR REPLACE FUNCTION save_os_transaction(
  p_user_id UUID,
  p_os_data JSONB,
  p_items_data JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  v_os_id UUID;
  v_item JSONB;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  IF p_os_data->>'id' IS NOT NULL THEN
    v_os_id := (p_os_data->>'id')::UUID;
    IF NOT EXISTS (SELECT 1 FROM public.os WHERE id = v_os_id AND user_id = p_user_id) THEN
       RAISE EXCEPTION 'OS não encontrada ou pertence a outro usuário';
    END IF;

    UPDATE public.os SET
      numero = (p_os_data->>'numero')::INTEGER,
      data = (p_os_data->>'data')::DATE,
      status = p_os_data->>'status',
      cliente_id = NULLIF(p_os_data->>'cliente_id', '')::UUID,
      cliente_snapshot = p_os_data->'cliente_snapshot',
      equipamento = p_os_data->>'equipamento',
      servico = p_os_data->>'servico',
      obs_interna = p_os_data->>'obsInterna',
      desconto = COALESCE((p_os_data->>'desconto')::NUMERIC, 0),
      tecnico = p_os_data->>'tecnico'
    WHERE id = v_os_id AND user_id = p_user_id;
  ELSE
    INSERT INTO public.os (
      user_id, numero, data, status, cliente_id, cliente_snapshot, 
      equipamento, servico, obs_interna, desconto, tecnico
    ) VALUES (
      p_user_id,
      (p_os_data->>'numero')::INTEGER,
      (p_os_data->>'data')::DATE,
      p_os_data->>'status',
      NULLIF(p_os_data->>'cliente_id', '')::UUID,
      p_os_data->'cliente_snapshot',
      p_os_data->>'equipamento',
      p_os_data->>'servico',
      p_os_data->>'obsInterna',
      COALESCE((p_os_data->>'desconto')::NUMERIC, 0),
      p_os_data->>'tecnico'
    ) RETURNING id INTO v_os_id;
  END IF;

  DELETE FROM public.os_items WHERE os_id = v_os_id;
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_data)
  LOOP
    INSERT INTO public.os_items (os_id, descricao, quantidade, valor)
    VALUES (
      v_os_id,
      v_item->>'descricao',
      COALESCE((v_item->>'quantidade')::NUMERIC, 1),
      COALESCE((v_item->>'valor')::NUMERIC, 0)
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'os_id', v_os_id);
END;
$$;


-- Métricas para o Dashboard (Atualizado com Fase 4 e correção de porcentagem)
CREATE OR REPLACE FUNCTION get_dashboard_metrics(p_user_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado: Tentativa de ler métricas de outro usuário';
  END IF;

  SELECT json_build_object(
    'abertas', COUNT(*) FILTER (WHERE status IN ('Aberta', 'Em Análise', 'Aguardando Orçamento', 'Aprovada', 'Aguardando Peça', 'Em Execução')),
    'concluidasHoje', COUNT(*) FILTER (WHERE status = 'Concluído' AND data = CURRENT_DATE),
    'faturamentoMes', COALESCE(SUM(total_itens - (total_itens * (desconto / 100))) FILTER (
       WHERE status = 'Concluído' AND date_trunc('month', data) = date_trunc('month', CURRENT_DATE)
    ), 0)
  ) INTO result 
  FROM (
    SELECT o.status, o.data, o.desconto, COALESCE(SUM(i.quantidade * i.valor), 0) as total_itens
    FROM public.os o
    LEFT JOIN public.os_items i ON o.id = i.os_id
    WHERE o.user_id = p_user_id
    GROUP BY o.id
  ) as metricas;
  
  RETURN result;
END;
$$;
