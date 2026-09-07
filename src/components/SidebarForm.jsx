export default function SidebarForm({ data, onChange, onUpdateSimple, onAddItem, onRemoveItem, onUpdateItem, onOpenClientManager, onOpenProductManager }) {
    const handlePrint = () => window.print();

    // Estilos baseados no seu styles.css original
    const inputClass = "w-full p-2 border border-[#ccc] rounded text-[13px] box-border";
    const labelClass = "block text-[12px] font-bold text-[#555] mb-1";
    const h2Class = "text-[#1a5276] text-[18px] font-bold mb-4 border-b-2 border-[#1a5276] pb-1 mt-6 first:mt-0";

    return (
        <div className="w-full md:w-[400px] bg-white p-5 overflow-y-auto shadow-[2px_0_5px_rgba(0,0,0,0.1)] border-r border-[#ddd] print:hidden h-full">
            <button
                onClick={handlePrint}
                className="bg-[#1a5276] hover:bg-[#123c57] text-white border-none p-3 w-full rounded text-[15px] font-bold cursor-pointer mb-6 transition-colors"
            >
                🖨️ Imprimir / Salvar PDF
            </button>


            <h2 className={h2Class}>1. Dados da OS</h2>
            <div className="flex gap-2.5 mb-3">
                <div className="flex-[1.5]">
                    <label className={labelClass}>Nº da OS</label>
                    <input className={inputClass} value={data.os.numero} onChange={(e) => onChange('os', 'numero', e.target.value)} />
                </div>
                <div className="flex-[1.5]">
                    <label className={labelClass}>Data</label>
                    <input className={inputClass} value={data.os.data} onChange={(e) => onChange('os', 'data', e.target.value)} />
                </div>
                <div className="flex-[2]">
                    <label className={labelClass}>Status</label>
                    <select 
                        className={inputClass} 
                        value={data.os.status || 'Aberta'} 
                        onChange={(e) => onChange('os', 'status', e.target.value)}
                    >
                        <option value="Aberta">Aberta</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Finalizada">Finalizada</option>
                        <option value="Cancelada">Cancelada</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-between items-center mb-4 border-b-2 border-[#1a5276] pb-1 mt-6 first:mt-0">
                <h2 className="text-[#1a5276] text-[18px] font-bold m-0 border-none pb-0">2. Cliente</h2>
                {onOpenClientManager && (
                    <button 
                        onClick={onOpenClientManager}
                        className="text-[11px] bg-[#1a5276] text-white px-2 py-1 rounded hover:bg-[#154360] font-bold"
                    >
                        🔍 Buscar Cliente Salvo
                    </button>
                )}
            </div>
            <div className="mb-3">
                <label className={labelClass}>Nome / Razão Social</label>
                <input className={inputClass} value={data.cliente.nome} onChange={(e) => onChange('cliente', 'nome', e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="mb-3">
                <label className={labelClass}>CPF / CNPJ</label>
                <input className={inputClass} value={data.cliente.doc} onChange={(e) => onChange('cliente', 'doc', e.target.value)} placeholder="000.000.000-00" />
            </div>
            <div className="mb-3">
                <label className={labelClass}>Endereço Completo</label>
                <input className={inputClass} value={data.cliente.end} onChange={(e) => onChange('cliente', 'end', e.target.value)} />
            </div>
            <div className="mb-3">
                <label className={labelClass}>Contato (Telefone/Email)</label>
                <input className={inputClass} value={data.cliente.contato} onChange={(e) => onChange('cliente', 'contato', e.target.value)} />
            </div>

            <h2 className={h2Class}>3. Detalhes do Serviço</h2>
            <div className="mb-3">
                <textarea className={`${inputClass} min-h-[80px] resize-y`} placeholder="Descreva o serviço executado de forma clara..." value={data.servico} onChange={(e) => onUpdateSimple('servico', e.target.value)}></textarea>
            </div>

            <div className="flex justify-between items-center mb-4 border-b-2 border-[#1a5276] pb-1 mt-6 first:mt-0">
                <h2 className="text-[#1a5276] text-[18px] font-bold m-0 border-none pb-0">4. Serviços e Peças (Itens)</h2>
                {onOpenProductManager && (
                    <button 
                        onClick={onOpenProductManager}
                        className="text-[11px] bg-[#1a5276] text-white px-2 py-1 rounded hover:bg-[#154360] font-bold"
                    >
                        🔍 Buscar Catálogo
                    </button>
                )}
            </div>
            <div className="mb-3">
                {data.items.map(item => (
                    <div key={item.id} className="flex gap-1.5 mb-1.5 items-center">
                        <input className={`${inputClass} flex-[3] py-1.5`} placeholder="Descrição" value={item.desc} onChange={(e) => onUpdateItem(item.id, 'desc', e.target.value)} />
                        <input className={`${inputClass} flex-1 py-1.5`} type="number" placeholder="Qtd" value={item.qtd} onChange={(e) => onUpdateItem(item.id, 'qtd', Number(e.target.value) || 0)} />
                        <input className={`${inputClass} flex-1 py-1.5`} type="number" step="0.01" placeholder="R$" value={item.val} onChange={(e) => onUpdateItem(item.id, 'val', Number(e.target.value) || 0)} />
                        <button onClick={() => onRemoveItem(item.id)} className="bg-[#e74c3c] text-white border-none rounded cursor-pointer py-1.5 px-2.5">
                            X
                        </button>
                    </div>
                ))}
                <button onClick={onAddItem} className="bg-[#28b463] text-white border-none p-2 text-[12px] rounded cursor-pointer mb-2.5 w-full">
                    + Adicionar Item
                </button>
            </div>

            <div className="flex gap-2.5 mt-[15px] mb-3">
                <div className="flex-1">
                    <label className={labelClass}>Desconto (R$)</label>
                    <input className={inputClass} type="number" step="0.01" value={data.desconto} onChange={(e) => onUpdateSimple('desconto', Number(e.target.value) || 0)} />
                </div>
            </div>

            <h2 className={h2Class}>5. Assinaturas</h2>
            <div className="mb-3">
                <label className={labelClass}>Nome do Técnico</label>
                <input className={inputClass} value={data.tecnico} onChange={(e) => onUpdateSimple('tecnico', e.target.value)} />
            </div>
        </div>
    );
}
