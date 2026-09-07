import { useState, useEffect } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function ClientManager({ user, onClose, onClientSelect, isPage }) {
  const isSelectMode = !!onClientSelect;
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    doc: '',
    end: '',
    contato: '',
    obs: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(user.id);
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateClient(user.id, currentId, formData);
        toast.success("Cliente atualizado!");
      } else {
        await addClient(user.id, formData);
        toast.success("Cliente adicionado!");
      }
      resetForm();
      setIsFormOpen(false);
      loadClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar cliente.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      await deleteClient(user.id, id);
      toast.success("Cliente excluído!");
      loadClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cliente.");
    }
  };

  const startEdit = (client) => {
    setIsEditing(true);
    setCurrentId(client.id);
    setFormData({
      nome: client.nome || '',
      doc: client.doc || '',
      end: client.end || '',
      contato: client.contato || '',
      obs: client.obs || ''
    });
    setIsFormOpen(true);
  };

  const openNewClient = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ nome: '', doc: '', end: '', contato: '', obs: '' });
  };

  const handleSelect = (client) => {
    if (onClientSelect) {
      onClientSelect(client);
      onClose();
    }
  };

  const containerClass = isPage
    ? "w-full max-w-[1280px] mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-navy flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {isSelectMode ? 'Selecionar Cliente' : 'Gerenciamento de Clientes'}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {isSelectMode ? 'Busque e selecione para a OS' : 'Cadastro e Histórico'}
              </span>
            </div>
          </div>
          {!isPage && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          )}
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 min-w-0 w-full">
          {/* Top Bar: Search & Action */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 pointer-events-none">search</span>
              <input 
                type="text"
                placeholder="Pesquisar por nome ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
              />
            </div>
            
            <button 
              onClick={openNewClient}
              className="w-full sm:w-auto h-10 px-4 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* List Section (Table) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 min-w-0 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy"></div>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
                <span className="text-sm">Nenhum cliente encontrado.</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 border-b border-slate-200">Nome / Razão Social</th>
                        <th className="py-3 px-4 border-b border-slate-200">CPF / CNPJ</th>
                        <th className="py-3 px-4 border-b border-slate-200">Contato</th>
                        <th className="py-3 px-4 border-b border-slate-200 w-1/3">Endereço</th>
                        <th className="py-3 px-4 border-b border-slate-200 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {clients.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (c.doc && c.doc.includes(searchTerm))).map((client, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={client.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-sky-50/50 transition-colors group`}>
                            <td className="py-3 px-4 font-semibold text-slate-900">{client.nome}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 text-xs">{client.doc || '-'}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 text-xs">{client.contato || '-'}</td>
                            <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-[200px]" title={client.end}>{client.end || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              {isSelectMode ? (
                                <button 
                                  onClick={() => handleSelect(client)}
                                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#0a273c] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                                  Usar na OS
                                </button>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => startEdit(client)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Editar">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                  <button onClick={() => handleDelete(client.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-[24px] text-sky-600">
                  {isEditing ? 'edit_square' : 'person_add'}
                </span>
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </span>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">Nome / Razão Social</label>
                  <input 
                    type="text" name="nome" value={formData.nome} onChange={handleChange} required
                    placeholder="Ex: João da Silva / Empresa LTDA"
                    className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">CPF / CNPJ</label>
                    <input 
                      type="text" name="doc" value={formData.doc} onChange={handleChange}
                      placeholder="000.000.000-00"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Contato (Tel/Email)</label>
                    <input 
                      type="text" name="contato" value={formData.contato} onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">Endereço Completo</label>
                  <textarea 
                    name="end" value={formData.end} onChange={handleChange} rows="2"
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    className="p-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full resize-none"
                  ></textarea>
                </div>
                
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 mt-2">
                  <label className="text-[11px] font-semibold uppercase text-amber-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                    Observações Internas (Não saem na OS)
                  </label>
                  <textarea 
                    name="obs" value={formData.obs} onChange={handleChange} rows="3"
                    placeholder="Anotações privadas sobre o cliente, histórico de crédito, etc..."
                    className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all w-full resize-none placeholder:text-amber-700/40"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 rounded-b-xl">
              <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" form="client-form"
                className="h-10 px-6 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isEditing ? 'Atualizar Cliente' : 'Salvar Cliente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
