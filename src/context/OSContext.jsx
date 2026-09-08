import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { getNextOSNumber, saveOS as saveOSService } from '../services/osService';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const OSContext = createContext();

const initialOSData = {
  empresa: { nome: '', endereco: '', cnpj: '', telefone: '', email: '' },
  os: { numero: '', data: new Date().toISOString().split('T')[0], status: 'Aberta', tipo_atendimento: 'Equipamento' },
  cliente: { nome: '', documento: '', contato: '', cep: '', rua: '', numero_end: '', complemento: '', bairro: '', cidade: '' },
  equipamento: '',
  servico: '',
  obsInterna: '',
  items: [{ id: Date.now(), descricao: '', quantidade: 1, valor: 0.00 }],
  desconto: 0,
  tecnico: ''
};

function osReducer(state, action) {
  switch (action.type) {
    case 'SET_FULL_DATA':
      return { ...state, ...action.payload };
    case 'SET_EMPRESA':
      return { ...state, empresa: action.payload };
    case 'SET_TECNICO':
      return { ...state, tecnico: action.payload };
    case 'UPDATE_SECTION_FIELD':
      return {
        ...state,
        [action.payload.section]: {
          ...state[action.payload.section],
          [action.payload.field]: action.payload.value
        }
      };
    case 'UPDATE_SIMPLE_FIELD':
      return { ...state, [action.payload.field]: action.payload.value };
    case 'SET_CLIENTE':
      return { ...state, cliente: action.payload };
    case 'SET_EQUIPAMENTO':
      return { ...state, equipamento: action.payload };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, { id: Date.now(), descricao: '', quantidade: 1, valor: 0 }]
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item => item.id === action.payload.id ? { ...item, [action.payload.field]: action.payload.value } : item)
      };
    case 'ADD_PRODUCT_ITEM':
      const hasEmptyItem = state.items.length === 1 && state.items[0].descricao === '' && state.items[0].valor === 0;
      const newItem = { id: Date.now(), descricao: action.payload.nome, quantidade: 1, valor: action.payload.valor };
      if (hasEmptyItem) {
        return { ...state, items: [newItem] };
      }
      return { ...state, items: [...state.items, newItem] };
    default:
      return state;
  }
}

export function OSProvider({ children }) {
  const [data, dispatch] = useReducer(osReducer, initialOSData);

  const loadOS = useCallback((osData) => {
    dispatch({
      type: 'SET_FULL_DATA',
      payload: {
        ...osData,
        empresa: data.empresa, // Preserva a empresa carregada
        os: {
          numero: osData.os?.numero || '',
          data: osData.os?.data || '',
          status: osData.os?.status || 'Aberta',
          tipo_atendimento: osData.os?.tipo_atendimento || 'Equipamento'
        },
        cliente: osData.cliente || initialOSData.cliente,
        equipamento: osData.equipamento || '',
        servico: osData.servico || '',
        obsInterna: osData.obsInterna || '',
        items: osData.items?.length > 0 ? osData.items : [{ id: 1, descricao: '', quantidade: 1, valor: 0 }],
        desconto: osData.desconto || 0,
        tecnico: osData.tecnico || ''
      }
    });
  }, [data.empresa]);

  const resetToNewOS = useCallback(async (userId, userName) => {
    try {
      const nextOS = await getNextOSNumber(userId);
      dispatch({
        type: 'SET_FULL_DATA',
        payload: {
          ...initialOSData,
          empresa: data.empresa,
          os: { numero: nextOS, data: new Date().toISOString().split('T')[0], status: 'Aberta', tipo_atendimento: 'Equipamento' },
          tecnico: userName || ''
        }
      });
    } catch (error) {
      console.error("Failed to generate new OS:", error);
      toast.error("Erro ao gerar nova OS.");
    }
  }, [data.empresa]);

  const saveCurrentOS = useCallback(async (userId) => {
    if (!userId) {
      toast.error("Faça login para salvar a OS!");
      return;
    }
    try {
      await saveOSService(userId, data);
      toast.success("OS salva com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a OS.");
      throw error;
    }
  }, [data]);

  return (
    <OSContext.Provider value={{ data, dispatch, loadOS, resetToNewOS, saveCurrentOS }}>
      {children}
    </OSContext.Provider>
  );
}

export const useOS = () => useContext(OSContext);
