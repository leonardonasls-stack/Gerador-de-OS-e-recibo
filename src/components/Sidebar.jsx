import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
      </svg>
    ), label: 'Visão Geral' },
    { path: '/os', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ), label: 'Ordens de Serviço' },
    { path: '/produtos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
      </svg>
    ), label: 'Peças & Serviços' },
    { path: '/clientes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    ), label: 'Clientes' },
    { path: '/relatorios', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    ), label: 'Relatórios Financeiros' },
    { path: '/configuracoes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    ), label: 'Configurações' },
  ];

  return (
    <aside 
      className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 select-none z-50 shadow-2xl lg:shadow-xl border-r border-slate-800 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`} 
      id="sidebar"
    >
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 brand-container flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-brand-navy flex items-center justify-center text-white shadow-md shadow-sky-900/40">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <div className="brand-text">
              <span className="text-base font-bold text-white tracking-wide leading-none block">Gerador<span className="text-sky-400">OS</span></span>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Sistema de Gestão</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="p-3 space-y-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link 
                onClick={onClose}
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm group ${
                  isActive 
                    ? 'bg-brand-navy text-white font-medium shadow-sm' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'
                }`}
              >
                <div className={`${isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-400'}`}>
                  {item.icon}
                </div>
                <span className="nav-text">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors">
          {user?.user_metadata?.avatar_url ? (
            <img alt="Perfil" className="w-10 h-10 rounded-full object-cover border-2 border-sky-500 shrink-0" src={user.user_metadata.avatar_url} />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border-2 border-sky-500">
              {user?.user_metadata?.display_name ? user.user_metadata.display_name.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U')}
            </div>
          )}
          <div className="user-info flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário'}</p>
            <p className="text-xs text-sky-400 font-medium truncate">Técnico</p>
          </div>
          <button 
            onClick={onLogout}
            className="user-info text-slate-400 hover:text-red-400 p-1 rounded transition-colors" 
            title="Sair do sistema"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
