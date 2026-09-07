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
import OSHistory from './components/OSHistory';
import { supabase, logout } from './services/supabase';
import { saveOS, getNextOSNumber } from './services/osService';
import { getCompanyData } from './services/profileService';
import { Toaster, toast } from 'react-hot-toast';

function AppContent() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    empresa: {
      nome: '', end: '', cnpj: '', fone: '', email: ''
    },
    os: {
      numero: '', data: new Date().toLocaleDateString('pt-BR'), status: 'Aberta'
    },
    cliente: { nome: '', doc: '', end: '', contato: '' },
    equipamento: '',
    servico: '',
    obsInterna: '',
    items: [{ id: Date.now(), desc: '', qtd: 1, val: 0.00 }],
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
  const [showOSHistory, setShowOSHistory] = useState(false);
  const [forceOnboarding, setForceOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session?.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const handleProductSelect = (productData) => {
    setData(prev => {
      // Se o único item da lista for vazio, substitui ele em vez de adicionar outro
      if (prev.items.length === 1 && prev.items[0].desc === '' && prev.items[0].val === 0) {
        return {
          ...prev,
          items: [{ id: Date.now(), desc: productData.desc, qtd: 1, val: productData.val }]
        };
      }
      return {
        ...prev,
        items: [
          ...prev.items,
          { id: Date.now(), desc: productData.desc, qtd: 1, val: productData.val }
        ]
      };
    });
  };

  const handleLoadOS = (osData) => {
    setData({
      ...osData,
      os: {
        numero: osData.os?.numero || '',
        data: osData.os?.data || '',
        status: osData.os?.status || 'Aberta'
      },
      cliente: osData.cliente || { nome: '', doc: '', end: '', contato: '' },
      equipamento: osData.equipamento || '',
      servico: osData.servico || '',
      obsInterna: osData.obsInterna || '',
      items: osData.items?.length > 0 ? osData.items : [{ id: 1, desc: '', qtd: 1, val: 0 }],
      desconto: osData.desconto || 0,
      tecnico: osData.tecnico || ''
    });
    toast.success(`OS carregada com sucesso!`);
    navigate('/os/editor');
  };

  const handleNewOS = async () => {
    try {
      const nextOS = await getNextOSNumber(user.id);
      setData(prev => ({
        empresa: prev.empresa, // Keep company data
        os: { numero: nextOS, data: new Date().toLocaleDateString('pt-BR'), status: 'Aberta' },
        cliente: { nome: '', doc: '', end: '', contato: '' },
        equipamento: '',
        servico: '',
        obsInterna: '',
        items: [{ id: Date.now(), desc: '', qtd: 1, val: 0.00 }],
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
      items: [...prev.items, { id: Date.now(), desc: '', qtd: 1, val: 0 }]
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
            <Dashboard data={data} user={user} />
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
