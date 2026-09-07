import { useState, useEffect } from 'react';
import { X, Search, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getOSList } from '../services/osService';

export default function OSHistory({ user, onClose, onLoadOS, onNewOS, isPage }) {
  const [osList, setOsList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterList();
  }, [searchTerm, statusFilter, osList]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getOSList(user.uid);
      setOsList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterList = () => {
    let filtered = osList;
    
    if (statusFilter !== 'Todas') {
      filtered = filtered.filter(os => (os.os?.status || 'Aberta') === statusFilter);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(os => 
        (os.os?.numero && os.os.numero.toLowerCase().includes(term)) ||
        (os.cliente?.nome && os.cliente.nome.toLowerCase().includes(term))
      );
    }
    
    setFilteredList(filtered);
  };

  const getStatusBadge = (status) => {
    const s = status || 'Aberta';
    switch (s) {
      case 'Aberta': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded"><Clock size={12}/> Aberta</span>;
      case 'Aprovada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded"><CheckCircle size={12}/> Aprovada</span>;
      case 'Finalizada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded"><CheckCircle size={12}/> Finalizada</span>;
      case 'Cancelada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded"><XCircle size={12}/> Cancelada</span>;
      default: return <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{s}</span>;
    }
  };

  const calculateTotal = (os) => {
    const totalItens = os.items?.reduce((sum, item) => sum + ((Number(item.val) || 0) * (Number(item.qtd) || 0)), 0) || 0;
    const desconto = Number(os.desconto) || 0;
    return totalItens - desconto;
  };

  const containerClass = isPage
    ? "bg-white rounded-lg shadow-sm w-full flex flex-col h-full border border-gray-200"
    : "bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full pb-8"
    : "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#1a5276]">Histórico de OS</h2>
          
          {isPage ? (
            <button onClick={onNewOS} className="bg-[#1a5276] text-white text-sm font-semibold px-4 py-2 rounded shadow hover:bg-[#154360] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Cadastrar Nova OS
            </button>
          ) : (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por Nº da OS ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border text-sm border-gray-300 rounded px-4 py-2 bg-white focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
          >
            <option value="Todas">Todos os Status</option>
            <option value="Aberta">Aberta</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="text-center text-gray-500 p-8">Carregando histórico...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center text-gray-500 p-8 flex flex-col items-center">
              <FileText size={48} className="text-gray-300 mb-2" />
              <p>Nenhuma OS encontrada.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600 sticky top-0">
                  <th className="p-3 font-semibold">Nº OS</th>
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">Cliente</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(os => (
                  <tr key={os.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="p-3 font-medium text-[#1a5276]">{os.os?.numero || '-'}</td>
                    <td className="p-3 text-sm">{os.os?.data || '-'}</td>
                    <td className="p-3 text-sm truncate max-w-[200px]">{os.cliente?.nome || '-'}</td>
                    <td className="p-3">{getStatusBadge(os.os?.status)}</td>
                    <td className="p-3 font-medium">R$ {calculateTotal(os).toFixed(2).replace('.', ',')}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          onLoadOS(os);
                          onClose();
                        }}
                        className="bg-[#1a5276] text-white text-xs px-3 py-1.5 rounded hover:bg-[#154360]"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
