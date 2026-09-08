import { supabase } from './supabase';

export const getNextOSNumber = async (userId) => {
  if (!userId) return "0001/2026";
  
  // Use Postgres function to get next number
  const { data, error } = await supabase
    .rpc('get_next_os_number', { p_user_id: userId });
    
  let next = 1;
  if (!error && data) {
    next = data;
  }
  
  const year = new Date().getFullYear();
  return `${String(next).padStart(4, '0')}/${year}`;
};

export const saveOS = async (userId, osData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const numeroInt = parseInt(String(osData.os.numero).split('/')[0], 10) || 1;
  const isEditing = !!osData.id; 
  
  // Prepara o payload principal da OS
  const osPayload = {
    ...(isEditing ? { id: osData.id } : {}),
    numero: numeroInt,
    data: osData.os.data,
    status: osData.os.status,
    cliente_id: osData.cliente?.id || null,
    cliente_snapshot: osData.cliente,
    equipamento: osData.equipamento,
    servico: osData.servico,
    obsInterna: osData.obsInterna,
    desconto: Number(osData.desconto) || 0,
    tecnico: osData.tecnico
  };

  // Prepara o payload de itens
  const itemsPayload = (osData.items || []).map(item => ({
    descricao: item.descricao,
    quantidade: Number(item.quantidade) || 1,
    valor: Number(item.valor) || 0
  }));

  // Executa tudo na transação atômica do Supabase
  const { data, error } = await supabase.rpc('save_os_transaction', {
    p_user_id: userId,
    p_os_data: osPayload,
    p_items_data: itemsPayload
  });

  if (error) throw error;
  
  return data.os_id;
};

export const getOSList = async (userId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  // Buscar OS com os itens aninhados
  const { data, error } = await supabase
    .from('os')
    .select(`
      *,
      items:os_items(*)
    `)
    .eq('user_id', userId)
    .order('numero', { ascending: false });
    
  if (error) throw error;
  
  // Reconstruir o objeto para a UI (compatibilidade retroativa)
  return (data || []).map(row => {
    const year = new Date(row.created_at).getFullYear();
    return {
      id: row.id,
      empresa: {}, // Não carregado aqui, App.jsx mantém o estado global
      os: {
        numero: `${String(row.numero).padStart(4, '0')}/${year}`,
        data: row.data,
        status: row.status
      },
      cliente: (() => {
        const snap = row.cliente_snapshot || {};
        return {
          nome: snap.nome || '',
          documento: snap.documento || snap.doc || '',
          contato: snap.contato || '',
          cep: snap.cep || '',
          rua: snap.rua || snap.end || '',
          numero_end: snap.numero_end || snap.numero || '',
          complemento: snap.complemento || '',
          bairro: snap.bairro || '',
          cidade: snap.cidade || ''
        };
      })(),
      equipamento: row.equipamento || '',
      servico: row.servico || '',
      obsInterna: row.obsInterna || '',
      desconto: row.desconto || 0,
      tecnico: row.tecnico || '',
      items: row.items && row.items.length > 0 ? row.items : [{ id: 1, descricao: '', quantidade: 1, valor: 0 }]
    };
  });
};
