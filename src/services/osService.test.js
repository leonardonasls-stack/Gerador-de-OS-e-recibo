import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNextOSNumber, saveOS, getOSList } from './osService';
import { supabase } from './supabase';

vi.mock('./supabase', () => {
  const selectMock = vi.fn().mockReturnThis();
  const eqMock = vi.fn().mockReturnThis();
  const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });

  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(() => ({
        select: selectMock,
        eq: eqMock,
        order: orderMock
      }))
    }
  };
});

describe('osService - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNextOSNumber', () => {
    it('returns default 0001 when userId is missing', async () => {
      const result = await getNextOSNumber();
      const currentYear = new Date().getFullYear();
      expect(result).toBe(`0001/${currentYear}`);
    });

    it('returns formatted next number when RPC succeeds', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: 42, error: null });
      const currentYear = new Date().getFullYear();
      
      const result = await getNextOSNumber('test-user-id');
      
      expect(supabase.rpc).toHaveBeenCalledWith('get_next_os_number', { p_user_id: 'test-user-id' });
      expect(result).toBe(`0042/${currentYear}`);
    });

    it('falls back to 0001 if RPC fails', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: null, error: new Error('RPC Error') });
      const currentYear = new Date().getFullYear();
      
      const result = await getNextOSNumber('test-user-id');
      
      expect(result).toBe(`0001/${currentYear}`);
    });
  });

  describe('saveOS', () => {
    it('throws error if userId is not provided', async () => {
      await expect(saveOS(null, {})).rejects.toThrow("Usuário não autenticado");
    });
    
    it('calls RPC save_os_transaction successfully', async () => {
      supabase.rpc.mockResolvedValueOnce({ data: { os_id: 99 }, error: null });
      
      const osData = {
        os: { numero: '10/2026', data: '2026-09-08', status: 'Aberta' },
        cliente: { id: 1 },
        equipamento: 'PC',
        servico: 'Format',
        items: [{ descricao: 'Taxa', quantidade: 1, valor: 50 }],
        desconto: 10
      };

      const result = await saveOS('user123', osData);
      
      expect(supabase.rpc).toHaveBeenCalledWith('save_os_transaction', expect.any(Object));
      expect(result).toBe(99);
    });
  });
});
