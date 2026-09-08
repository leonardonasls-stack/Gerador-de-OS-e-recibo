import { supabase } from './supabase';

// --- COMPANY / EMPRESA ---
export const saveCompanyData = async (userId, companyData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { error } = await supabase
    .from('empresas')
    .upsert(
      { user_id: userId, ...companyData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    
  if (error) throw error;
};

export const getCompanyData = async (userId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data || null;
};

// --- CLIENTS / CLIENTES ---
export const addClient = async (userId, clientData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ user_id: userId, ...clientData }])
    .select()
    .single();
    
  if (error) throw error;
  return data.id;
};

export const getClients = async (userId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

export const updateClient = async (userId, clientId, clientData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { error } = await supabase
    .from('clientes')
    .update({ ...clientData })
    .eq('id', clientId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const deleteClient = async (userId, clientId) => {
  if (!userId || !clientId) throw new Error("Parâmetros inválidos");
  
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

// ==========================================
// PRODUCTS CRUD
// ==========================================

export const getProducts = async (userId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

export const addProduct = async (userId, productData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { error } = await supabase
    .from('produtos')
    .insert([{ 
      user_id: userId, 
      ...productData,
      valor: Number(productData.valor) || 0
    }]);
    
  if (error) throw error;
};

export const updateProduct = async (userId, productId, productData) => {
  if (!userId || !productId) throw new Error("Parâmetros inválidos");
  
  const { error } = await supabase
    .from('produtos')
    .update({ 
      ...productData,
      valor: Number(productData.valor) || 0 
    })
    .eq('id', productId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const deleteProduct = async (userId, productId) => {
  if (!userId || !productId) throw new Error("Parâmetros inválidos");
  
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', productId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

// ==========================================
// GERENCIAMENTO DE EQUIPAMENTOS
// ==========================================

export const getEquipments = async (userId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('equipamentos')
    .select('*, clientes(nome)')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
    
  if (error) throw error;
  return data;
};

export const addEquipment = async (userId, equipmentData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('equipamentos')
    .insert([{ user_id: userId, ...equipmentData }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateEquipment = async (userId, equipmentId, equipmentData) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { data, error } = await supabase
    .from('equipamentos')
    .update(equipmentData)
    .eq('id', equipmentId)
    .eq('user_id', userId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const deleteEquipment = async (userId, equipmentId) => {
  if (!userId) throw new Error("Usuário não autenticado");
  
  const { error } = await supabase
    .from('equipamentos')
    .delete()
    .eq('id', equipmentId)
    .eq('user_id', userId);
    
  if (error) throw error;
};
