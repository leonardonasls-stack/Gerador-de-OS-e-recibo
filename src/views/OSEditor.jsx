import React, { useState } from 'react';

export default function OSEditor({ 
  data, 
  onChange, 
  onUpdateSimple, 
  onAddItem, 
  onRemoveItem, 
  onUpdateItem, 
  onOpenClientManager, 
  onOpenProductManager,
  onOpenHistory,
  onSave 
}) {
  const formatMoney = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const subtotal = data.items?.reduce((sum, item) => sum + (Number(item.val) * Number(item.qtd)), 0) || 0;
  const totalFinal = Math.max(0, subtotal - Number(data.desconto || 0));

  const handlePrint = () => window.print();

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
                <option value="Aprovada">🔵 Aprovada</option>
                <option value="Em Execução">⚙️ Em Execução</option>
                <option value="Aguardando Peças">📦 Aguardando Peças</option>
                <option value="Finalizada">✅ Finalizada</option>
                <option value="Cancelada">🔴 Cancelada</option>
              </select>
              <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
          <button onClick={onOpenHistory} className="h-8 px-3 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 font-semibold text-xs flex items-center gap-1 shadow-sm transition-colors" title="Buscar OS Existente">
            <span className="material-symbols-outlined text-[16px]">manage_search</span>
            <span className="hidden sm:inline">Buscar OS</span>
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
              <button onClick={onOpenClientManager} className="text-sky-600 hover:text-sky-700 font-semibold text-sm flex items-center gap-1 transition-colors">
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
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.doc} onChange={(e) => onChange('cliente', 'doc', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Contato</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.contato} onChange={(e) => onChange('cliente', 'contato', e.target.value)} />
              </div>

              {/* Endereço - Linha 1 */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Rua / Logradouro</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.rua || data.cliente.end} onChange={(e) => onChange('cliente', 'rua', e.target.value)} />
              </div>

              {/* Endereço - Linha 2 */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Número</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.numero} onChange={(e) => onChange('cliente', 'numero', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Complemento</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.complemento} onChange={(e) => onChange('cliente', 'complemento', e.target.value)} />
              </div>

              {/* Endereço - Linha 3 */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Bairro</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.bairro} onChange={(e) => onChange('cliente', 'bairro', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-semibold uppercase text-slate-400">Cidade - UF</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.cidade} onChange={(e) => onChange('cliente', 'cidade', e.target.value)} />
              </div>
              
              {/* Endereço - Linha 4 */}
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-semibold uppercase text-slate-400">CEP</label>
                <input className="h-8 px-3 rounded bg-white text-slate-900 font-mono text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.cliente.cep} onChange={(e) => onChange('cliente', 'cep', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Section 2: Equipamento e Diagnóstico */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">2</span>
                <h2 className="text-lg text-slate-900 font-bold">Equipamento & Diagnóstico</h2>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Equipamento / Modelo / Serial</label>
              <input className="h-9 px-3 rounded bg-slate-50 focus:bg-white text-slate-900 font-semibold text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" value={data.equipamento || ''} onChange={(e) => onUpdateSimple('equipamento', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1 h-full">
              <label className="text-[10px] font-semibold uppercase text-slate-400">Laudo Técnico / Serviços Executados</label>
              <textarea className="p-3 rounded bg-slate-50 focus:bg-white text-slate-900 text-sm border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none shadow-sm h-full min-h-[100px]" value={data.servico || ''} onChange={(e) => onUpdateSimple('servico', e.target.value)} placeholder="Descreva os serviços..."></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Itens */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-slate-100 text-slate-900 flex items-center justify-center font-mono text-sm font-bold">3</span>
              <h2 className="text-lg text-slate-900 font-bold">Peças & Serviços</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onOpenProductManager} className="h-8 px-3 rounded bg-slate-100 text-sky-600 hover:bg-slate-200 font-semibold text-sm flex items-center gap-1 transition-colors">
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
                  const itemTotal = (Number(item.val) || 0) * (Number(item.qtd) || 0);
                  const isEven = idx % 2 === 0;
                  return (
                    <tr key={item.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-50 transition-colors`}>
                      <td className="p-2">
                        <input className="w-full h-8 px-2 rounded bg-transparent focus:bg-white text-slate-900 font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" value={item.desc} onChange={(e) => onUpdateItem(item.id, 'desc', e.target.value)} />
                      </td>
                      <td className="p-2">
                        <input className="w-full h-8 text-center rounded bg-transparent focus:bg-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" type="number" min="1" value={item.qtd} onChange={(e) => onUpdateItem(item.id, 'qtd', Number(e.target.value) || 0)} />
                      </td>
                      <td className="p-2">
                        <input className="w-full h-8 text-right rounded bg-transparent focus:bg-white font-mono text-sm focus:outline-none focus:ring-1 focus:ring-slate-200" type="number" step="0.01" value={item.val} onChange={(e) => onUpdateItem(item.id, 'val', Number(e.target.value) || 0)} />
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
                <span className="absolute left-2 text-slate-400 font-mono text-sm">R$</span>
                <input className="w-full h-8 pl-8 pr-2 text-right rounded bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-sm" type="number" step="0.01" value={data.desconto} onChange={(e) => onUpdateSimple('desconto', Number(e.target.value) || 0)} />
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
          <button onClick={onSave} className="h-9 px-6 rounded bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Salvar OS</span>
          </button>
        </div>
      </div>
    </div>
  );
}
