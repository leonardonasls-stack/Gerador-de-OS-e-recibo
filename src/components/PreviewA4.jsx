import { useOS } from '../context/OSContext';

export default function PreviewA4() {
  const { data } = useOS();
  const formatMoney = (value) =>
    Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const subtotal = data.items?.reduce((acc, item) => acc + ((item.quantidade || 1) * (item.valor || 0)), 0) || 0;
  const valorDesconto = subtotal * (Number(data.desconto || 0) / 100);
  const totalGeral = Math.max(0, subtotal - valorDesconto);

  return (
    <div className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white text-slate-800 p-6 flex flex-col justify-between relative shadow-2xl print:shadow-none print:m-0 print:w-full print:max-w-none print:p-6">
      
      {/* Document Content Stack */}
      <div className="flex flex-col gap-3">
        
        {/* 1. Header Institucional / Empresa Prestadora & OS Info */}
        <header className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200">
          <div className="flex flex-col">
            <h1 className="text-2xl text-brand-navy font-bold uppercase leading-tight tracking-tight">
              {data.empresa?.nome || '-'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 leading-snug">
              CNPJ: {data.empresa?.cnpj || '-'}
            </p>
            <p className="text-sm text-slate-600 leading-snug max-w-sm">
              {data.empresa?.endereco || '-'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-1">
              {data.empresa?.telefone && <span>{data.empresa.telefone}</span>}
              {data.empresa?.telefone && data.empresa?.email && <span>•</span>}
              {data.empresa?.email && <span className="text-sky-600">{data.empresa.email}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end text-right shrink-0">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded flex flex-col items-end gap-1 shadow-sm">
              <div className="flex items-baseline gap-2 text-brand-navy">
                <span className="text-xs font-bold tracking-tight uppercase">
                  {data.os?.tipo_atendimento === 'Orçamento' ? 'Orçamento' : (data.os?.tipo_atendimento === 'Balcão' ? 'Venda / Balcão' : 'Ordem de Serviço')}
                </span>
                <span className="font-mono text-xl font-bold tracking-tight">Nº {data.os?.numero || '-'}</span>
              </div>
              <div className="flex items-center gap-4 text-xs mt-1">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Emissão</span>
                  <span className="font-mono text-slate-700 font-medium">{data.os?.data || '-'}</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Status</span>
                  <span className="text-brand-navy font-bold uppercase">{data.os?.status || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 3. Dados do Cliente / Tomador */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 mb-1">
            <span className="text-sm uppercase tracking-wider text-sky-700 flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[16px]">domain</span>
              Dados do Cliente / Tomador
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="flex flex-col col-span-2">
              <span className="text-slate-500 text-[10px] uppercase">Razão Social / Nome</span>
              <span className="text-slate-900 font-semibold text-sm">{data.cliente?.nome || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">CNPJ / CPF</span>
              <span className="font-mono text-slate-800 text-xs">{data.cliente?.documento || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">Telefone / WhatsApp</span>
              <span className="font-mono text-slate-800 text-xs">{data.cliente?.contato || '-'}</span>
            </div>
            <div className="flex flex-col col-span-4">
              <span className="text-slate-500 text-[10px] uppercase">Endereço de Atendimento</span>
              <span className="text-slate-800 text-xs">
                {data.cliente?.rua || data.cliente?.cidade || data.cliente?.bairro ? (
                  `${data.cliente.rua || ''}, ${data.cliente.numero_end || 'S/N'}${data.cliente.complemento ? ' ('+data.cliente.complemento+')' : ''} - ${data.cliente.bairro || ''} - ${data.cliente.cidade || ''} - CEP: ${data.cliente.cep || ''}`
                ) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Equipamento, Defeito Relatado e Laudo Técnico */}
        {data.os?.tipo_atendimento !== 'Balcão' && (
          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-2">
            <span className="text-[13px] uppercase tracking-wider text-sky-700 flex items-center gap-1.5 font-bold mb-0.5">
              <span className="material-symbols-outlined text-[15px]">laptop_mac</span>
              Equipamento & Diagnóstico Técnico
            </span>
            
            <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] uppercase">Dispositivo / Equipamento</span>
              <div className="text-brand-navy font-semibold text-sm">{data.equipamento || '-'}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col gap-0.5">
                <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-rose-500">report_problem</span>
                  Serviço / Relato
                </span>
                <p className="text-xs text-slate-800 leading-snug whitespace-pre-wrap">
                  {data.servico || '-'}
                </p>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col gap-0.5">
                <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-sky-600">verified</span>
                  Observações Técnicas Internas
                </span>
                <p className="text-xs text-slate-800 leading-snug whitespace-pre-wrap">
                  {data.obsInterna || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Técnico Responsável:</span>
                <span className="font-semibold text-slate-800">{data.tecnico || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 5. Tabela de Serviços e Peças */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[13px] uppercase tracking-wider text-sky-700 flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
            Discriminação de Serviços & Peças Aplicadas
          </span>
          
          <div className="overflow-hidden rounded border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-brand-navy text-white uppercase text-[10px] tracking-wider">
                  <th className="py-1.5 px-2 w-10 text-center font-semibold">Item</th>
                  <th className="py-1.5 px-2 font-semibold">Descrição do Serviço / Peça</th>
                  <th className="py-1.5 px-2 text-center w-16 font-semibold">Qtd</th>
                  <th className="py-1.5 px-2 text-right w-24 font-semibold">Unitário</th>
                  <th className="py-1.5 px-2 text-right w-24 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.items?.length > 0 ? data.items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-2 text-center font-mono text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 text-slate-800 font-medium">{item.descricao || '-'}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-600">{item.quantidade} un</td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-500">R$ {formatMoney(item.valor)}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-semibold text-brand-navy">R$ {formatMoney((item.quantidade || 1) * (item.valor || 0))}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="py-2 text-center text-slate-400">Nenhum item adicionado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Quadro de Totais e Condições de Pagamento */}
        <div className="grid grid-cols-12 gap-3 items-start mt-1">
          {/* Observações e Condições */}
          <div className="col-span-7 bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-sky-700 font-bold">
              Condições de Pagamento
            </span>
            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
              Faturamento emitido mediante a aprovação desta Ordem de Serviço. Em caso de dúvidas, consulte nosso suporte. A validade deste orçamento é de 10 dias úteis.
            </p>
          </div>
          
          {/* Resumo Financeiro / Fechamento */}
          <div className="col-span-5 bg-white border border-slate-200 p-3 rounded flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Itens</span>
              <span className="font-mono text-slate-800 font-medium">R$ {formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-rose-600">
              <span>Desconto ({data.desconto || 0}%)</span>
              <span className="font-mono font-medium">- R$ {formatMoney(valorDesconto)}</span>
            </div>
            <div className="h-px bg-slate-200 my-0.5"></div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-brand-navy uppercase font-bold tracking-tight">Valor Total:</span>
              <span className="font-mono text-base text-brand-navy font-bold">R$ {formatMoney(totalGeral)}</span>
            </div>
          </div>
        </div>

        {/* 7. Termos de Garantia & Condições Legais */}
        {data.os?.tipo_atendimento !== 'Orçamento' && (
          <div className="bg-slate-100 p-3 rounded border border-slate-200 text-[10px] text-slate-600 leading-snug flex flex-col gap-0.5 mt-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-800 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-sky-600">shield</span>
              Termo de Garantia Legal e Responsabilidade Técnica
            </span>
            <p>
              Garantia legal de <strong>90 (noventa) dias</strong> a partir da data de entrega, cobrindo exclusivamente as peças substituídas e serviços executados constantes neste documento. A garantia perde sua validade em caso de mau uso comprovado.
            </p>
          </div>
        )}

        {/* 8. Bloco de Assinaturas Formais */}
        <div className="grid grid-cols-2 gap-6 pt-6 pb-2 mt-auto">
          {/* Assinatura Técnica / Empresa */}
          <div className="flex flex-col items-center text-center">
            <div className="h-10 flex items-end justify-center w-full relative">
              <div className="text-sky-700/70 font-mono text-[9px] tracking-widest uppercase mb-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified_user</span>
                <span>Assinatura Digital - {data.tecnico || '-'}</span>
              </div>
            </div>
            <div className="w-4/5 h-px bg-brand-navy/30 mb-1"></div>
            <span className="text-xs text-brand-navy font-bold leading-tight">{data.empresa?.nome || '-'}</span>
            <span className="text-[10px] text-slate-500">{data.tecnico || '-'}</span>
          </div>
          
          {/* Assinatura Cliente / Aceite */}
          <div className="flex flex-col items-center text-center">
            <div className="h-10 flex items-end justify-center w-full">
              <span className="text-slate-400 text-[9px] italic mb-1">De acordo com serviços e valores acima</span>
            </div>
            <div className="w-4/5 h-px bg-brand-navy/30 mb-1"></div>
            <span className="text-xs text-brand-navy font-bold leading-tight">{data.cliente?.nome || '-'}</span>
            <span className="text-[10px] text-slate-500">Assinatura do Cliente</span>
          </div>
        </div>

      </div>

      {/* 9. Rodapé Técnico Oficial da Página A4 */}
      <footer className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-navy">Gerador de OS</span>
          <span>•</span>
          <span>Documento emitido eletronicamente</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>ID: OS-{new Date().getFullYear()}-{data.os?.numero || '-'}</span>
          <span className="font-semibold text-brand-navy font-sans">Folha 1 de 1</span>
        </div>
      </footer>
    </div>
  );
}
