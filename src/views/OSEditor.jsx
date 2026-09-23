import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useOS } from '../context/OSContext';
import ClientManager from '../components/ClientManager';
import ProductManager from '../components/ProductManager';
import EquipmentManager from '../components/EquipmentManager';
import OSHistory from '../components/OSHistory';
import { generateOSPDF } from '../utils/pdfGenerator';
import { toast } from 'react-hot-toast';

export default function OSEditor() {
  const { user } = useAuth();
  const { data, dispatch, saveCurrentOS, loadOS } = useOS();

  // Local Modal States
  const [showClientManager, setShowClientManager] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [showOSHistory, setShowOSHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await saveCurrentOS(user?.id);
    } catch (err) {
      // toast error handled inside saveCurrentOS
    } finally {
      setIsSaving(false);
    }
  };

  // Dispatch helpers
  const onChange = (section, field, value) => {
    dispatch({ type: 'UPDATE_SECTION_FIELD', payload: { section, field, value } });
  };
  const onUpdateSimple = (field, value) => {
    dispatch({ type: 'UPDATE_SIMPLE_FIELD', payload: { field, value } });
  };
  const onAddItem = () => dispatch({ type: 'ADD_ITEM' });
  const onRemoveItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const onUpdateItem = (id, field, value) => dispatch({ type: 'UPDATE_ITEM', payload: { id, field, value } });

  const formatMoney = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const subtotal = data.items?.reduce((sum, item) => sum + (Number(item.valor) * Number(item.quantidade)), 0) || 0;
  const valorDesconto = subtotal * (Number(data.desconto || 0) / 100);
  const totalFinal = Math.max(0, subtotal - valorDesconto);

  const handlePrint = () => window.print();

  const handleShareWhatsApp = async () => {
    toast.loading('Gerando PDF...', { id: 'pdf-gen' });
    try {
      const { blob, filename } = await generateOSPDF(data.os.numero, data.cliente.nome);
      const file = new File([blob], filename, { type: 'application/pdf' });
      
      let phone = data.cliente?.contato?.replace(/\D/g, '') || '';
      if (phone && !phone.startsWith('55')) {
        phone = '55' + phone;
      }
      
      const greeting = `Olá, ${data.cliente?.nome?.split(' ')[0] || 'cliente'}! Segue em anexo o seu orçamento (OS ${data.os?.numero}).`;
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        toast.dismiss('pdf-gen');
        try {
          await navigator.share({
            files: [file],
            title: filename,
            text: greeting
          });
          toast.success('Compartilhado com sucesso!');
          return;
        } catch (err) {
          console.error('Erro ao compartilhar', err);
          // Fallback se cancelar ou falhar
        }
      }

      // Fallback: Download manual e link
      toast.success('PDF baixado! Abrindo WhatsApp...', { id: 'pdf-gen' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      const encodedMessage = encodeURIComponent(greeting);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      let waUrl = '';
      if (isMobile) {
        waUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
      } else {
        waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
      }
      
      window.open(waUrl, '_blank');
    } catch (err) {
      console.error('Erro ao gerar pdf', err);
      toast.error('Erro ao gerar PDF', { id: 'pdf-gen' });
    }
  };

  const handleSaveOS = async () => {
    try {
      const saved = await saveCurrentOS(user?.id);
      if (saved) {
        if (window.confirm('OS salva com sucesso! Deseja gerar o PDF e enviar pelo WhatsApp do cliente?')) {
          await handleShareWhatsApp();
        }
      }
    } catch (err) {
      console.error('Erro ao salvar ou gerar pdf', err);
    }
  };

  return (
    <div className="w-full bg-slate-50 min-h-full pb-24 max-w-7xl mx-auto">
      {/* Sub-header */}
      <section className="bg-white shadow-sm px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 mb-6 border-b border-slate-200 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-900 text-lg tracking-tight font-bold">OS {data.os.numero || 'Nova'}</span>
            <span className="px-2 py-1 rounded bg-slate-100 text-sky-600 text-[10px] uppercase font-bold">Ordem de Serviço</span>
          </div>
          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="material-symbols-outlined text-[16px] text-sky-600">cloud_done</span>
            <span>Editando localmente</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
            <span className="text-xs text-slate-500 hidden sm:inline">Status:</span>
            <div className="relative">
              <select 
                className="bg-white text-slate-900 font-semibold text-xs py-1 pl-2 pr-7 rounded appearance-none focus:outline-none focus:bg-slate-100 cursor-pointer shadow-sm border border-slate-200"
                value={data.os.status || 'Aberta'}
                onChange={(e) => onChange('os', 'status', e.target.value)}
              >
                <option value="Aberta">🟢 Aberta</option>
                <option value="Em Análise">🟡 Em Análise</option>
                <option value="Aguardando Orçamento">⏳ Aguardando Orçamento</option>
                <option value="Aprovada">🔵 Aprovada</option>
                <option value="Aguardando Peça">📦 Aguardando Peça</option>
                <option value="Em Execução">⚙️ Em Execução</option>
                <option value="Concluído">✅ Concluído</option>
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
          <button onClick={() => setShowOSHistory(true)} className="h-8 px-3 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors" title="Buscar OS Existente">
            <span className="material-symbols-outlined text-[16px]">manage_search</span>
            <span className="hidden sm:inline">Buscar OS</span>
          </button>
          <button onClick={handleShareWhatsApp} className="h-8 px-4 rounded bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.386 0 12.033c0 2.128.552 4.2 1.6 6.02L.05 24l6.141-1.611A11.972 11.972 0 0012.031 24c6.648 0 12.031-5.385 12.031-12.031C24.062 5.386 18.68 0 12.031 0zm0 22.008a9.92 9.92 0 01-5.06-1.378l-.363-.214-3.76 1.002.99-3.666-.234-.374a9.923 9.923 0 01-1.528-5.347c0-5.485 4.464-9.948 9.955-9.948 5.488 0 9.951 4.463 9.951 9.948 0 5.488-4.463 9.95-9.951 9.95zm5.45-7.442c-.298-.15-1.767-.872-2.041-.971-.274-.101-.475-.15-.675.15-.198.297-.773.971-.947 1.171-.174.198-.348.223-.646.074-.298-.15-1.261-.465-2.404-1.484-.888-.792-1.488-1.77-1.662-2.07-.174-.298-.018-.46.131-.609.135-.135.298-.348.447-.524.149-.174.198-.298.298-.498.1-.198.05-.373-.025-.523-.075-.15-.675-1.625-.925-2.223-.243-.585-.488-.506-.675-.515-.174-.01-.373-.01-.572-.01-.198 0-.523.075-.797.373-.274.298-1.045 1.022-1.045 2.49 0 1.468 1.07 2.887 1.22 3.087.15.198 2.1 3.208 5.088 4.498.712.308 1.266.492 1.7.63.714.227 1.365.194 1.875.118.572-.086 1.767-.722 2.016-1.42.249-.697.249-1.295.174-1.42-.075-.124-.274-.198-.572-.348z"/></svg>
            <span>WhatsApp</span>
          </button>
          <button onClick={handlePrint} className="h-8 px-4 rounded bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            <span>Visualizar / Imprimir</span>
          </button>
        </div>
      </section>

      {/* Split Screen Layout */}
      <div className="flex flex-col gap-6">
        
        {/* Top Info Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-navy text-white flex items-center justify-center text-lg font-bold shadow-sm">OS</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <h1 className="text-lg text-slate-900 font-bold">Nova Ordem de Serviço</h1>
              </div>
              <span className="text-[12px] text-slate-400">Preenchimento rápido e emissão simplificada</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
            <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Nº OS</span>
              <input className="bg-transparent font-mono font-semibold text-sm text-slate-900 outline-none w-full" value={data.os.numero} onChange={(e) => onChange('os', 'numero', e.target.value)} />
            </div>
            <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Data</span>
              <input className="bg-transparent font-mono font-semibold text-sm text-slate-900 outline-none w-full" value={data.os.data} onChange={(e) => onChange('os', 'data', e.target.value)} />
            </div>
            <div className="flex flex-col bg-slate-50 p-2 rounded border border-slate-100 col-span-2">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Tipo</span>
              <select className="bg-transparent font-semibold text-sm text-slate-900 outline-none w-full cursor-pointer" value={data.os.tipo_atendimento || 'Equipamento'} onChange={(e) => onChange('os', 'tipo_atendimento', e.target.value)}>
                <option value="Equipamento">🛠️ Manutenção (OS)</option>
                <option value="Balcão">🛒 Venda Balcão</option>
                <option value="Orçamento">📝 Orçamento</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Cliente */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">1</span>
                <h2 className="text-lg text-slate-900 font-bold">Dados do Cliente</h2>
              </div>
              <button onClick={() => setShowClientManager(true)} className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Buscar Salvo</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Nome / Razão Social</label>
              <input className="h-9 px-3 rounded bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm shadow-inner border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all" value={data.cliente.nome} onChange={(e) => onChange('cliente', 'nome', e.target.value)} placeholder="Nome do cliente" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded border border-slate-100">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">CNPJ / CPF</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.documento} onChange={(e) => onChange('cliente', 'documento', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Contato</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.contato} onChange={(e) => onChange('cliente', 'contato', e.target.value)} />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Rua / Logradouro</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.rua} onChange={(e) => onChange('cliente', 'rua', e.target.value)} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Número</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.numero_end} onChange={(e) => onChange('cliente', 'numero_end', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Complemento</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.complemento} onChange={(e) => onChange('cliente', 'complemento', e.target.value)} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Bairro</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.bairro} onChange={(e) => onChange('cliente', 'bairro', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Cidade - UF</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.cidade} onChange={(e) => onChange('cliente', 'cidade', e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase text-slate-400">CEP</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.cep} onChange={(e) => onChange('cliente', 'cep', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2: Equipamento e Diagnóstico */}
          {data.os.tipo_atendimento !== 'Balcão' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">2</span>
                <h2 className="text-lg text-slate-900 font-bold">Equipamento & Diagnóstico</h2>
              </div>
            </div>
            <div className="flex flex-col gap-1 relative">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Equipamento / Modelo / Serial</label>
              <div className="relative w-full">
                <input 
                  className="w-full h-9 pl-3 pr-10 rounded bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm transition-all" 
                  value={data.equipamento || ''} 
                  onChange={(e) => onUpdateSimple('equipamento', e.target.value)} 
                  placeholder="Selecione ou digite um equipamento..."
                />
                <button 
                  onClick={() => setShowEquipmentManager(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-9 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                  title="Buscar Equipamento Salvo"
                >
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 h-full">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Laudo Técnico / Serviços Executados</label>
              <textarea className="p-3 rounded bg-slate-50 focus:bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none shadow-sm h-full min-h-[100px]" value={data.servico || ''} onChange={(e) => onUpdateSimple('servico', e.target.value)} placeholder="Descreva os serviços..."></textarea>
            </div>
            </div>
          )}
        </div>

        {/* Section 3: Itens */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">3</span>
              <h2 className="text-lg text-slate-900 font-bold">Peças & Serviços</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowProductSelector(true)} className="h-8 px-3 rounded bg-slate-100 text-sky-600 hover:bg-slate-200 font-semibold text-sm flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                <span>Buscar no Catálogo</span>
              </button>
              <button onClick={onAddItem} className="h-8 px-3 rounded bg-brand-navy text-white hover:bg-[#0a273c] font-semibold text-sm flex items-center gap-1 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>+ Adicionar Linha</span>
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded bg-slate-50 border border-slate-200">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase">
                  <th className="py-2 px-3 border-b border-slate-200">Descrição</th>
                  <th className="py-2 px-2 w-20 text-center border-b border-slate-200">Qtd</th>
                  <th className="py-2 px-3 w-32 text-right border-b border-slate-200">Unitário</th>
                  <th className="py-2 px-3 w-32 text-right border-b border-slate-200">Total</th>
                  <th className="py-2 px-2 w-14 text-center border-b border-slate-200">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {data.items.map((item, idx) => {
                  const itemTotal = (Number(item.valor) || 0) * (Number(item.quantidade) || 0);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={item.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50 transition-colors`}>
                      <td className="p-2">
                        <input className="w-full h-8 px-2 rounded bg-transparent focus:bg-white text-slate-900 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" value={item.descricao} onChange={(e) => onUpdateItem(item.id, 'descricao', e.target.value)} />
                      </td>
                      <td className="p-2">
                        <input className="w-full h-8 text-center rounded bg-transparent focus:bg-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" type="number" min="1" value={item.quantidade} onChange={(e) => onUpdateItem(item.id, 'quantidade', Number(e.target.value) || 0)} />
                      </td>
                      <td className="p-2">
                        <input className="w-full h-8 text-right rounded bg-transparent focus:bg-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" type="number" step="0.01" value={item.valor} onChange={(e) => onUpdateItem(item.id, 'valor', Number(e.target.value) || 0)} />
                      </td>
                      <td className="p-2 text-right font-mono font-semibold text-slate-900">
                        {formatMoney(itemTotal)}
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => onRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Remover item">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-2 bg-slate-50 p-4 rounded border border-slate-200">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-sm text-slate-900">Desconto Concedido:</label>
              <div className="relative w-32 flex items-center">
                <input className="w-full h-8 pl-3 pr-8 text-right rounded bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" type="number" step="0.1" value={data.desconto} onChange={(e) => onUpdateSimple('desconto', Number(e.target.value) || 0)} />
                <span className="absolute right-3 text-slate-400 font-mono text-sm font-bold">%</span>
              </div>
            </div>
            <div className="flex items-center gap-8 ml-auto">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Subtotal</span>
                <span className="font-mono font-semibold text-slate-500">R$ {formatMoney(subtotal)}</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div className="flex flex-col items-end bg-sky-50 px-4 py-2 rounded border border-sky-100">
                <span className="text-[10px] font-semibold uppercase text-sky-700">Total Final da OS</span>
                <span className="font-mono text-lg text-sky-700 font-bold">R$ {formatMoney(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Condições Comerciais */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">4</span>
            <h2 className="text-lg text-slate-900 font-bold">Condições e Assinatura</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Observações da OS</label>
              <input className="h-8 px-3 rounded bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500" value={data.obsInterna || ''} onChange={(e) => onUpdateSimple('obsInterna', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Técnico Responsável</label>
              <input className="h-8 px-3 rounded bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500" value={data.tecnico} onChange={(e) => onUpdateSimple('tecnico', e.target.value)} />
            </div>
          </div>
        </div>

      </div>

      {/* Footer Sticky Bar */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 rounded text-slate-400 hover:text-red-500 hover:bg-slate-50 font-semibold text-sm transition-colors" type="button">Limpar</button>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveOS} 
            disabled={isSaving}
            className={`h-9 px-6 rounded bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="material-symbols-outlined text-[18px]">{isSaving ? 'sync' : 'check_circle'}</span>
            <span>{isSaving ? 'Salvando...' : 'Salvar OS'}</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showClientManager && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <ClientManager 
            user={user} 
            onClose={() => setShowClientManager(false)}
            onClientSelect={(clientData) => {
              dispatch({ type: 'SET_CLIENTE', payload: clientData });
              setShowClientManager(false);
            }}
          />
        </div>
      )}

      {showProductSelector && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <ProductManager 
            user={user} 
            onClose={() => setShowProductSelector(false)}
            onProductSelect={(productData) => {
              dispatch({ type: 'ADD_PRODUCT_ITEM', payload: productData });
              setShowProductSelector(false);
            }}
          />
        </div>
      )}

      {showEquipmentManager && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <EquipmentManager 
            user={user} 
            onClose={() => setShowEquipmentManager(false)}
            onEquipmentSelect={(equipString) => {
              dispatch({ type: 'SET_EQUIPAMENTO', payload: equipString });
              setShowEquipmentManager(false);
            }}
          />
        </div>
      )}
      
      {showOSHistory && (
        <OSHistory 
          user={user}
          isPage={false}
          onClose={() => setShowOSHistory(false)}
          onLoadOS={(os) => {
            loadOS(os);
            setShowOSHistory(false);
          }}
        />
      )}

    </div>
  );
}
