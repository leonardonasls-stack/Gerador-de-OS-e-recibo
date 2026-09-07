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
  
  // 1. Upsert na tabela OS
  const osPayload = {
    user_id: userId,
    numero: numeroInt,
    data: osData.os.data,
    status: osData.os.status,
    cliente_id: osData.cliente.id || null,
    cliente_snapshot: osData.cliente,
    equipamento: osData.equipamento,
    servico: osData.servico,
    obsInterna: osData.obsInterna,
    desconto: Number(osData.desconto) || 0,
    tecnico: osData.tecnico
  };

  let osId = osData.id;

  if (isEditing) {
    const { error } = await supabase
      .from('os')
      .update(osPayload)
      .eq('id', osId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('os')
      .insert([osPayload])
      .select()
      .single();
    if (error) throw error;
    osId = data.id;
  }

  // 2. Sincronizar Items (Deletar antigos e inserir novos)
  if (isEditing) {
    await supabase.from('os_items').delete().eq('os_id', osId);
  }

  if (osData.items && osData.items.length > 0) {
    const itemsPayload = osData.items.map(item => ({
      os_id: osId,
      desc: item.desc,
      qtd: Number(item.qtd) || 1,
      val: Number(item.val) || 0
    }));
    const { error: itemsError } = await supabase.from('os_items').insert(itemsPayload);
    if (itemsError) throw itemsError;
  }
  
  return osId;
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
      cliente: row.cliente_snapshot || { nome: '', doc: '', end: '', contato: '' },
      equipamento: row.equipamento || '',
      servico: row.servico || '',
      obsInterna: row.obsInterna || '',
      desconto: row.desconto || 0,
      tecnico: row.tecnico || '',
      items: row.items && row.items.length > 0 ? row.items : [{ id: 1, desc: '', qtd: 1, val: 0 }]
    };
  });
};
