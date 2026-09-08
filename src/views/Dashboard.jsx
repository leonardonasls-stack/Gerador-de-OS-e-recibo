import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useOS } from '../context/OSContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { resetToNewOS } = useOS();
  const navigate = useNavigate();

  const handleNewOS = async () => {
    if (user) {
      await resetToNewOS(user.id, user.user_metadata?.display_name);
      navigate('/os/editor');
    }
  };
  const [seeding, setSeeding] = useState(false);
  const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });


  const [metrics, setMetrics] = useState({
    abertas: 0,
    concluidasHoje: 0,
    faturamentoMes: 0,
    ticketMedio: 0
  });

  const loadMetrics = async () => {
    if (!user) return;
    try {
      const { data: metricsData, error } = await supabase.rpc('get_dashboard_metrics', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      
      // O Supabase converte automaticamente o retorno JSON da RPC para um objeto JS
      const abertas = metricsData?.abertas || 0;
      const concluidasHoje = metricsData?.concluidasHoje || 0;
      const faturamentoMes = metricsData?.faturamentoMes || 0;
      const concluidasMes = metricsData?.concluidasMes || 0;

      setMetrics({
        abertas,
        concluidasHoje,
        faturamentoMes,
        ticketMedio: concluidasMes > 0 ? faturamentoMes / concluidasMes : 0
      });
    } catch (err) {
      console.error("Erro ao carregar métricas:", err);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Top Action & Overview Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2 pb-6 border-b border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 tracking-tight">Painel de Controle</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">v2.4 Live</span>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
            <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
            <span id="current-date-label" className="capitalize">{currentDate}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Conectado à Base Local & Nuvem
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all text-sm font-medium" type="button">
            <span className="material-symbols-outlined text-[18px] text-slate-500">file_download</span>
            <span>Exportar XLS</span>
          </button>

          <Link to="/clientes" state={{ openNewClient: true }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all">
            <span className="material-symbols-outlined text-[20px] text-sky-600">person_add</span>
            <span>Novo Cliente</span>
          </Link>

          <button onClick={onNewOS} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-semibold shadow-md hover:bg-[#0a273c] transition-all">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Nova OS</span>
          </button>
        </div>
      </div>

      {/* Operational Health Metrics / KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">OS Abertas</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-slate-900 font-bold">{metrics.abertas}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Concluídas Hoje</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-slate-900 font-bold">{metrics.concluidasHoje}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Faturamento Mês</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-slate-900 font-bold">
                  R$ {metrics.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Ticket Médio / OS</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl text-slate-900 font-bold">
                  R$ {metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
              <span className="material-symbols-outlined">analytics</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
