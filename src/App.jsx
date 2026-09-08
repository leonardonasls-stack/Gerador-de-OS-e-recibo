import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import OSEditor from './views/OSEditor';
import PreviewA4 from './components/PreviewA4';
import Login from './components/Login';
import CompanySettings from './components/CompanySettings';
import ClientManager from './components/ClientManager';
import ProductManager from './components/ProductManager';
import EquipmentManager from './components/EquipmentManager';
import OSHistory from './components/OSHistory';
import { logout } from './services/supabase';
import { getCompanyData } from './services/profileService';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { useOS } from './context/OSContext';

function AppContent() {
  const { user, loadingAuth } = useAuth();
  const { data, dispatch, resetToNewOS } = useOS();
  
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (user) {
      // Load company data for onboarding
      getCompanyData(user.id).then(companyData => {
        if (companyData) {
          dispatch({ type: 'SET_EMPRESA', payload: companyData });
        } else {
          setShowCompanySettings(true);
          setForceOnboarding(true);
        }
      }).catch(console.error);
    }
  }, [user, dispatch]);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleCompanyUpdate = (companyData) => {
    dispatch({ type: 'SET_EMPRESA', payload: companyData });
    setShowCompanySettings(false);
    setForceOnboarding(false);
  };

  if (loadingAuth) {
    return <div className="flex h-screen items-center justify-center bg-[#f0f2f5]">Carregando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <Routes>
        <Route path="/" element={
          <Layout user={user} onLogout={logout}>
            <Dashboard />
          </Layout>
        } />
        
        <Route path="/os" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <OSHistory isPage={true} />
            </div>
          </Layout>
        } />

        <Route path="/os/editor" element={
          <Layout user={user} onLogout={logout}>
            <div className="relative">
              <OSEditor />
            </div>
          </Layout>
        } />

        <Route path="/clientes" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <ClientManager isPage={true} onClose={() => {}} />
            </div>
          </Layout>
        } />

        <Route path="/produtos" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <ProductManager isPage={true} onClose={() => {}} />
            </div>
          </Layout>
        } />

        <Route path="/equipamentos" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <EquipmentManager isPage={true} onClose={() => {}} />
            </div>
          </Layout>
        } />
        
        <Route path="/configuracoes" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <CompanySettings 
                user={user} 
                currentData={data.empresa}
                onClose={() => {}}
                onSaveSuccess={handleCompanyUpdate}
                forceOnboarding={false}
                isPage={true}
              />
            </div>
          </Layout>
        } />
        
        <Route path="/relatorios" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full flex flex-col items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-[64px] mb-4 text-slate-300">query_stats</span>
              <h2 className="text-xl font-bold text-slate-700">Relatórios Financeiros</h2>
              <p className="mt-2 text-sm">Em breve! Os relatórios financeiros estão sendo desenvolvidos.</p>
            </div>
          </Layout>
        } />
      </Routes>

      {/* Hidden print view globally available */}
      <div className="hidden print:block absolute inset-0 bg-white z-[999]">
        <PreviewA4 />
      </div>

      {showCompanySettings && forceOnboarding && (
        <CompanySettings 
          user={user} 
          currentData={data.empresa}
          onClose={() => {}}
          onSaveSuccess={handleCompanyUpdate}
          forceOnboarding={true}
        />
      )}

      {deferredPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[999] bg-white rounded-lg shadow-2xl border border-slate-200 p-4 flex items-center gap-4 animate-bounce-short">
          <div className="w-10 h-10 bg-[#1a5276] text-white rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Instalar Aplicativo</p>
            <p className="text-xs text-slate-500">Adicione à sua tela inicial</p>
          </div>
          <button 
            onClick={handleInstallPwa}
            className="bg-[#1a5276] text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-[#154360] transition-colors"
          >
            Instalar
          </button>
          <button 
            onClick={() => setDeferredPrompt(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
