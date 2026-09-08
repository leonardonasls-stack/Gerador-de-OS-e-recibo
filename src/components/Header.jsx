export default function Header({ onMenuClick }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
      <div className="flex items-center flex-1 max-w-lg relative">
        <button 
          onClick={onMenuClick}
          className="mr-3 p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
          title="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 lg:pl-3 pl-[3.25rem]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
        <input 
          className="block w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f3c5c] focus:border-transparent focus:bg-white transition-all lg:pl-9 pl-12" 
          placeholder="Buscar OS, clientes ou serviços..." 
          type="text" 
        />
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
          <span className="text-[10px] font-mono font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">Alt + K</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-emerald-700 tracking-wide">Conectado</span>
        </div>
      </div>
    </header>
  );
}
