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
import { supabase, logout } from './services/supabase';
import { saveOS, getNextOSNumber } from './services/osService';
import { getCompanyData } from './services/profileService';
import { Toaster, toast } from 'react-hot-toast';

function AppContent() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    empresa: {
      nome: '', endereco: '', cnpj: '', telefone: '', email: ''
    },
    os: {
      numero: '', data: new Date().toISOString().split('T')[0], status: 'Aberta'
    },
    cliente: { nome: '', documento: '', contato: '', cep: '', rua: '', numero_end: '', complemento: '', bairro: '', cidade: '' },
    equipamento: '',
    servico: '',
    obsInterna: '',
    items: [{ id: Date.now(), descricao: '', quantidade: 1, valor: 0.00 }],
    desconto: 0,
    tecnico: ''
  });

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modals state
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [showClientManager, setShowClientManager] = useState(false);
  const [showProductManager, setShowProductManager] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [showOSHistory, setShowOSHistory] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user);
    });

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleUserSession = async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      
      if (currentUser) {
        // Update user name as default tecnico
        setData(prev => ({ ...prev, tecnico: currentUser.user_metadata?.display_name || '' }));

        // Fetch next OS number
        try {
          const nextOS = await getNextOSNumber(currentUser.id);
          setData(prev => ({ ...prev, os: { ...prev.os, numero: nextOS } }));
        } catch (error) {
          console.error("Failed to get next OS number:", error);
        }

        // Load company data in background
        try {
          const companyData = await getCompanyData(currentUser.id);
          if (companyData) {
            setData(prev => ({ ...prev, empresa: companyData }));
          } else {
            // Se não tem empresa cadastrada, obriga o onboarding
            setShowCompanySettings(true);
            setForceOnboarding(true);
          }
        } catch (error) {
          console.error("Failed to load company data:", error);
        }
      }
  };

  const handleChange = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleClientSelect = (clientData) => {
    setData(prev => ({
      ...prev,
      cliente: clientData
    }));
  };

  const handleEquipmentSelect = (equipString) => {
    setData(prev => ({
      ...prev,
      equipamento: equipString
    }));
  };

  const handleProductSelect = (productData) => {
    setData(prev => {
      if (prev.items.length === 1 && prev.items[0].descricao === '' && prev.items[0].valor === 0) {
        return {
          ...prev,
          items: [{ id: Date.now(), descricao: productData.nome, quantidade: 1, valor: productData.valor }]
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          { id: Date.now(), descricao: productData.nome, quantidade: 1, valor: productData.valor }
        ]
      };
    });
  };

  const handleLoadOS = (osData) => {
    setData(prev => ({
      ...osData,
      empresa: prev.empresa, // Preserva a empresa carregada no login
      os: {
        numero: osData.os?.numero || '',
        data: osData.os?.data || '',
        status: osData.os?.status || 'Aberta'
      },
      cliente: osData.cliente || { nome: '', documento: '', contato: '', cep: '', rua: '', numero_end: '', complemento: '', bairro: '', cidade: '' },
      equipamento: osData.equipamento || '',
      servico: osData.servico || '',
      obsInterna: osData.obsInterna || '',
      items: osData.items?.length > 0 ? osData.items : [{ id: 1, descricao: '', quantidade: 1, valor: 0 }],
      desconto: osData.desconto || 0,
      tecnico: osData.tecnico || ''
    }));
    toast.success(`OS carregada com sucesso!`);
    navigate('/os/editor');
  };

  const handleNewOS = async () => {
    try {
      const nextOS = await getNextOSNumber(user.id);
      setData(prev => ({
        empresa: prev.empresa, // Keep company data
        os: { numero: nextOS, data: new Date().toISOString().split('T')[0], status: 'Aberta' },
        cliente: { nome: '', documento: '', contato: '', cep: '', rua: '', numero_end: '', complemento: '', bairro: '', cidade: '' },
        equipamento: '',
        servico: '',
        obsInterna: '',
        items: [{ id: Date.now(), descricao: '', quantidade: 1, valor: 0.00 }],
        desconto: 0,
        tecnico: user.user_metadata?.display_name || ''
      }));
      navigate('/os/editor');
    } catch (error) {
      console.error("Failed to generate new OS:", error);
      toast.error("Erro ao gerar nova OS.");
    }
  };

  const handleCompanyUpdate = (companyData) => {
    setData(prev => ({ ...prev, empresa: companyData }));
    setShowCompanySettings(false);
    setForceOnboarding(false);
  };

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), descricao: '', quantidade: 1, valor: 0 }]
    }));
  };

  const removeItem = (id) => {
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id, field, value) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Faça login para salvar a OS!");
      return;
    }
    setSaving(true);
    try {
      await saveOS(user.id, data);
      toast.success("OS salva com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a OS.");
    } finally {
      setSaving(false);
    }
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
            <Dashboard data={data} user={user} onNewOS={handleNewOS} />
          </Layout>
        } />
        
        <Route path="/os" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <OSHistory 
                user={user} 
                onClose={() => {}}
                onLoadOS={handleLoadOS}
                onNewOS={handleNewOS}
                isPage={true}
              />
            </div>
          </Layout>
        } />

        <Route path="/os/editor" element={
          <Layout user={user} onLogout={logout}>
            <div className="relative">
              <OSEditor
                data={data}
                onChange={handleChange}
                onUpdateSimple={(field, val) => setData(prev => ({ ...prev, [field]: val }))}
                onAddItem={addItem}
                onRemoveItem={removeItem}
                onUpdateItem={updateItem}
                onOpenClientManager={() => setShowClientManager(true)}
                onOpenProductManager={() => setShowProductSelector(true)}
                onOpenEquipmentManager={() => setShowEquipmentManager(true)}
                onOpenHistory={() => setShowOSHistory(true)}
                onSave={handleSave}
              />
            </div>
          </Layout>
        } />

        <Route path="/clientes" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <ClientManager 
                user={user} 
                onClose={() => {}} // Remove close since it's a page now
                isPage={true}
              />
            </div>
          </Layout>
        } />

        <Route path="/produtos" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <ProductManager 
                user={user} 
                onClose={() => {}}
                isPage={true}
              />
            </div>
          </Layout>
        } />

        <Route path="/equipamentos" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <EquipmentManager 
                user={user} 
                onClose={() => {}}
                isPage={true}
              />
            </div>
          </Layout>
        } />
        
        <Route path="/configuracoes" element={
          <Layout user={user} onLogout={logout}>
            <div className="pt-4 h-[calc(100vh-64px)] w-full">
              <CompanySettings 
                user={user} 
                currentData={data.empresa}
                onClose={() => navigate('/')}
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
        <PreviewA4 data={data} />
      </div>

      {/* Modals that still need to be modals */}
      {showCompanySettings && forceOnboarding && (
        <CompanySettings 
          user={user} 
          currentData={data.empresa}
          onClose={() => {}}
          onSaveSuccess={handleCompanyUpdate}
          forceOnboarding={true}
        />
      )}

      {showClientManager && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <ClientManager 
            user={user} 
            onClose={() => setShowClientManager(false)}
            onClientSelect={handleClientSelect}
          />
        </div>
      )}

      {showProductSelector && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <ProductManager 
            user={user} 
            onClose={() => setShowProductSelector(false)}
            onProductSelect={handleProductSelect}
          />
        </div>
      )}

      {showEquipmentManager && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <EquipmentManager 
            user={user} 
            onClose={() => setShowEquipmentManager(false)}
            onEquipmentSelect={handleEquipmentSelect}
          />
        </div>
      )}
      
      {showOSHistory && (
        <OSHistory 
          user={user}
          isPage={false}
          onClose={() => setShowOSHistory(false)}
          onLoadOS={(os) => {
            handleLoadOS(os);
            setShowOSHistory(false);
          }}
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
