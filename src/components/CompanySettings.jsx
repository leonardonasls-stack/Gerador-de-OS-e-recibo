import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { saveCompanyData } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function CompanySettings({ user, currentData, onClose, onSaveSuccess, forceOnboarding, isPage }) {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    tel: '',
    email: '',
    rua: '',
    numero: '',
    complemento: '',
    cep: '',
    cidade: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentData) {
      setFormData(currentData);
    }
  }, [currentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const compPart = formData.complemento ? `, ${formData.complemento}` : '';
    const compiledEnd = `${formData.rua}, ${formData.numero}${compPart} - ${formData.cidade} - CEP: ${formData.cep}`;
    const dataToSave = { ...formData, end: compiledEnd };

    try {
      await saveCompanyData(user.uid, dataToSave);
      toast.success("Dados da empresa salvos!");
      onSaveSuccess(dataToSave);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar dados da empresa.");
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isPage
    ? "w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-[#1a5276]">Minha Empresa</h2>
          {!forceOnboarding && !isPage && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form id="company-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Razão Social</label>
              <input 
                type="text" name="nome" value={formData.nome} onChange={handleChange} required
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input 
                type="text" name="cnpj" value={formData.cnpj} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input 
                type="text" name="tel" value={formData.tel} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" name="email" value={formData.email} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[#1a5276] mb-3">Endereço</h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                  <input 
                    type="text" name="cep" value={formData.cep || ''} onChange={handleChange} placeholder="00000-000"
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rua / Logradouro</label>
                  <input 
                    type="text" name="rua" value={formData.rua || ''} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Número</label>
                  <input 
                    type="text" name="numero" value={formData.numero || ''} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Complemento / Bairro</label>
                  <input 
                    type="text" name="complemento" value={formData.complemento || ''} onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade - UF</label>
                  <input 
                    type="text" name="cidade" value={formData.cidade || ''} onChange={handleChange} required placeholder="Sua Cidade - SP"
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {forceOnboarding && (
          <div className="px-4 text-sm text-amber-600 bg-amber-50 py-2 border-t border-amber-200">
            Você precisa preencher os dados da sua empresa antes de continuar.
          </div>
        )}

        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex justify-end gap-2 shrink-0 mt-auto">
          {!forceOnboarding && (
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          )}
          <button 
            type="submit" form="company-form" disabled={loading}
            className="flex items-center gap-2 bg-[#1a5276] text-white px-4 py-2 rounded hover:bg-[#154360] transition-colors disabled:opacity-50"
          >
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
