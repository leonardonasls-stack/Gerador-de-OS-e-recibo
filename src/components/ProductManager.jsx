import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function ProductManager({ user, onClose, onProductSelect, isPage }) {
  const isSelectMode = !!onProductSelect;
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for the form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    custo: 0,
    margem: 0,
    valor: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(user.id);
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = name === 'nome' ? value : (Number(value) || 0);
    
    setFormData(prev => {
      const next = { ...prev, [name]: numValue };
      if (name === 'custo' || name === 'margem') {
        next.valor = Number((next.custo + (next.custo * (next.margem / 100))).toFixed(2));
      } else if (name === 'valor') {
        if (next.custo > 0) {
          next.margem = Number((((next.valor - next.custo) / next.custo) * 100).toFixed(2));
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateProduct(user.id, currentId, formData);
        toast.success("Produto atualizado!");
      } else {
        await addProduct(user.id, formData);
        toast.success("Produto adicionado ao catálogo!");
      }
      resetForm();
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    try {
      await deleteProduct(user.id, id);
      toast.success("Produto excluído!");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir produto.");
    }
  };

  const startEdit = (product) => {
    setIsEditing(true);
    setShowForm(true);
    setCurrentId(product.id);
    setFormData({
      nome: product.nome || '',
      custo: product.custo || 0,
      margem: product.margem || 0,
      valor: product.valor || 0
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setShowForm(false);
    setCurrentId(null);
    setFormData({ nome: '', custo: 0, margem: 0, valor: 0 });
  };

  const handleSelect = (product) => {
    if (onProductSelect) {
      onProductSelect({ nome: product.nome, valor: product.valor });
      onClose();
    }
  };

  const formatMoney = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const containerClass = isPage
    ? "w-full max-w-[1280px] mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header - Apenas exibe se NÃO for modo de seleção */}
        {!isSelectMode && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-white shrink-0 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-brand-navy flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                  Cadastro de Produtos e Peças
                </h2>
                <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                  Gerenciamento de Estoque
                </span>
              </div>
            </div>
            {!isPage && (
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            )}
          </div>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
          {/* List Section */}
          <div className="flex flex-col bg-white w-full h-full">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0 items-center">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 pointer-events-none">search</span>
                <input 
                  type="text"
                  placeholder="Pesquisar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                  autoFocus={isSelectMode}
                />
              </div>
              {!isSelectMode && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="h-10 px-4 bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Novo Produto
                </button>
              )}
              {isSelectMode && !isPage && (
                <button onClick={onClose} className="h-10 px-3 bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors flex items-center shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inventory</span>
                  <span className="text-sm">Nenhum produto encontrado.</span>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4 border-b border-slate-200">Nome / Descrição</th>
                          <th className="py-3 px-4 border-b border-slate-200 text-right">Valor Venda</th>
                          <th className="py-3 px-4 border-b border-slate-200 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {products.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((product, idx) => {
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={product.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-sky-50/50 transition-colors group`}>
                              <td className="py-3 px-4 font-semibold text-slate-900">{product.nome}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">R$ {formatMoney(product.valor)}</td>
                              <td className="py-3 px-4 text-right">
                                {isSelectMode ? (
                                  <button 
                                    onClick={() => handleSelect(product)}
                                    className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#0a273c] transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Adicionar
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => startEdit(product)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Editar">
                                      <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
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
      </div>

      {/* Floating Form Modal */}
      {showForm && !isSelectMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-900">{isEditing ? 'Editar Produto' : 'Novo Produto'}</span>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-200">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
              <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">Nome / Descrição</label>
                  <input 
                    type="text" name="nome" value={formData.nome} onChange={handleChange} required
                    placeholder="Ex: Formatação, SSD 240GB..."
                    className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Valor de compra (R$)</label>
                    <input 
                      type="number" step="0.01" name="custo" value={formData.custo || ''} onChange={handleChange}
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Porcentagem de lucro (%)</label>
                    <input 
                      type="number" step="0.01" name="margem" value={formData.margem || ''} onChange={handleChange}
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 mt-2">
                  <label className="text-[11px] font-semibold uppercase text-sky-700">Valor final (R$)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-bold text-sky-700">R$</span>
                    <input 
                      type="number" step="0.01" name="valor" value={formData.valor || ''} onChange={handleChange} required
                      className="h-12 pl-10 pr-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={resetForm} className="h-9 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" form="product-form"
                className="h-9 px-6 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isEditing ? 'Atualizar Produto' : 'Salvar no Catálogo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
