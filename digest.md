Directory structure:
└── Gerador de OS/
    ├── README.md
    ├── firestore.rules
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── supabase_schema.sql
    ├── tailwind.config.js
    ├── task.md
    ├── vercel.json
    ├── vite.config.js
    ├── .oxlintrc.json
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── ClientManager.jsx
        │   ├── CompanySettings.jsx
        │   ├── Header.jsx
        │   ├── Layout.jsx
        │   ├── Login.jsx
        │   ├── OSHistory.jsx
        │   ├── PreviewA4.jsx
        │   ├── ProductManager.jsx
        │   ├── Sidebar.jsx
        │   └── SidebarForm.jsx
        ├── services/
        │   ├── osService.js
        │   ├── profileService.js
        │   └── supabase.js
        └── views/
            ├── Dashboard.jsx
            └── OSEditor.jsx

================================================
FILE: README.md
================================================
Error reading file with 'cp1252': 'charmap' codec can't decode byte 0x8f in position 1461: character maps to <undefined>


================================================
FILE: firestore.rules
================================================
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /config/{docId} {
      allow read, write: if request.auth != null
        && docId == request.auth.uid + '_osCounter';
    }
  }
}



================================================
FILE: index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gerador de OS</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
    
    <!-- Material Symbols Outlined -->
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>



================================================
FILE: package.json
================================================
{
  "name": "temp-vite",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.116.0",
    "lucide-react": "^1.42.0",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-hot-toast": "^2.6.0",
    "react-router-dom": "^7.18.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "autoprefixer": "^10.5.5",
    "oxlint": "^1.79.0",
    "postcss": "^8.5.28",
    "tailwindcss": "^4.3.3",
    "vite": "^8.2.2",
    "vite-plugin-pwa": "^1.3.0"
  }
}



================================================
FILE: postcss.config.js
================================================
export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {},
    },
}



================================================
FILE: supabase_schema.sql
================================================
-- Schema inicial para o Gerador de OS (Supabase / PostgreSQL)

-- 1. CriaÃ§Ã£o das Tabelas

CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    cnpj TEXT,
    fone TEXT,
    email TEXT,
    "end" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- Cada usuÃ¡rio tem apenas 1 empresa
);

CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    doc TEXT,
    "end" TEXT,
    contato TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.produtos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    custo NUMERIC(10, 2) DEFAULT 0,
    margem NUMERIC(10, 2) DEFAULT 0,
    val NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    data TEXT,
    status TEXT,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    cliente_snapshot JSONB, -- Salva uma cÃ³pia dos dados do cliente no momento da OS
    equipamento TEXT,
    servico TEXT,
    obsInterna TEXT,
    desconto NUMERIC(10, 2) DEFAULT 0,
    tecnico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.os_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    os_id UUID NOT NULL REFERENCES public.os(id) ON DELETE CASCADE,
    "desc" TEXT NOT NULL,
    qtd NUMERIC(10, 2) DEFAULT 1,
    val NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitando RLS (Row Level Security)

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_items ENABLE ROW LEVEL SECURITY;

-- 3. PolÃ­ticas de SeguranÃ§a (Policies)
-- Garante que cada usuÃ¡rio sÃ³ pode Ler, Inserir, Atualizar e Deletar seus prÃ³prios dados

-- Empresas
CREATE POLICY "UsuÃ¡rios podem gerenciar suas prÃ³prias empresas" 
ON public.empresas FOR ALL USING (auth.uid() = user_id);

-- Clientes
CREATE POLICY "UsuÃ¡rios podem gerenciar seus prÃ³prios clientes" 
ON public.clientes FOR ALL USING (auth.uid() = user_id);

-- Produtos
CREATE POLICY "UsuÃ¡rios podem gerenciar seus prÃ³prios produtos" 
ON public.produtos FOR ALL USING (auth.uid() = user_id);

-- OS
CREATE POLICY "UsuÃ¡rios podem gerenciar suas prÃ³prias OS" 
ON public.os FOR ALL USING (auth.uid() = user_id);

-- OS Items (Depende da OS)
CREATE POLICY "UsuÃ¡rios podem gerenciar os itens de suas OS" 
ON public.os_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.os
        WHERE os.id = os_items.os_id AND os.user_id = auth.uid()
    )
);

-- 4. FunÃ§Ã£o para obter o prÃ³ximo nÃºmero de OS para o usuÃ¡rio
CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero), 0) + 1 INTO next_num
  FROM public.os
  WHERE user_id = p_user_id;
  
  RETURN next_num;
END;
$$;



================================================
FILE: tailwind.config.js
================================================
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-secondary": "#ffffff",
        "surface-container-highest": "#d3e4fe",
        "background": "#f8f9ff",
        "error": "#ba1a1a",
        "tertiary-fixed-dim": "#93ccff",
        "on-primary": "#ffffff",
        "outline": "#72777e",
        "surface-container-low": "#eff4ff",
        "surface": "#f8f9ff",
        "secondary-fixed-dim": "#9bccf6",
        "outline-variant": "#c2c7ce",
        "error-container": "#ffdad6",
        "on-tertiary-fixed-variant": "#004b73",
        "secondary": "#2f6388",
        "inverse-surface": "#213145",
        "surface-container": "#e5eeff",
        "tertiary-fixed": "#cce5ff",
        "inverse-primary": "#a4caf1",
        "on-surface-variant": "#42474e",
        "surface-dim": "#cbdbf5",
        "surface-bright": "#f8f9ff",
        "on-primary-fixed": "#001d32",
        "on-tertiary-fixed": "#001d31",
        "on-error": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "secondary-fixed": "#cbe6ff",
        "on-primary-container": "#81a7cc",
        "primary-container": "#0f3c5c",
        "on-secondary-container": "#275c81",
        "on-error-container": "#93000a",
        "primary": "#00263f",
        "on-secondary-fixed": "#001e30",
        "on-background": "#0b1c30",
        "inverse-on-surface": "#eaf1ff",
        "surface-tint": "#3b6284",
        "tertiary": "#00263e",
        "on-primary-fixed-variant": "#214a6a",
        "tertiary-container": "#003d5f",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed-variant": "#0e4b6e",
        "surface-variant": "#d3e4fe",
        "on-surface": "#0b1c30",
        "surface-container-high": "#dce9ff",
        "primary-fixed-dim": "#a4caf1",
        "secondary-container": "#a3d4fe",
        "on-tertiary-container": "#4babf0",
        "primary-fixed": "#cee5ff"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "unit-xl": "1.5rem",
        "gutter-mobile": "0.75rem",
        "unit-2xs": "0.125rem",
        "unit-md": "0.75rem",
        "unit-xs": "0.25rem",
        "a4-ratio-width": "210mm",
        "unit-2xl": "2rem",
        "unit-lg": "1.25rem",
        "a4-ratio-height": "297mm",
        "unit-sm": "0.5rem",
        "gutter-desktop": "1.5rem",
        "unit-base": "1rem",
        "max-sheet-width": "1280px"
      },
      fontFamily: {
        "headline-sm": ["Inter"],
        "body-md": ["Inter"],
        "headline-md": ["Inter"],
        "badge-label": ["Inter"],
        "body-sm": ["Inter"],
        "body-lg": ["Inter"],
        "display-lg-mobile": ["Inter"],
        "label-numeric": ["JetBrains Mono"],
        "title-base": ["Inter"],
        "code-dense": ["JetBrains Mono"],
        "display-lg": ["Inter"]
      },
      fontSize: {
        "headline-sm": ["18px", { "lineHeight": "26px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "body-md": ["13px", { "lineHeight": "20px", "letterSpacing": "0em", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.015em", "fontWeight": "600" }],
        "badge-label": ["11px", { "lineHeight": "14px", "letterSpacing": "0.04em", "fontWeight": "600" }],
        "body-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.01em", "fontWeight": "400" }],
        "body-lg": ["15px", { "lineHeight": "24px", "letterSpacing": "0em", "fontWeight": "400" }],
        "display-lg-mobile": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label-numeric": ["13px", { "lineHeight": "18px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "title-base": ["15px", { "lineHeight": "22px", "letterSpacing": "-0.005em", "fontWeight": "600" }],
        "code-dense": ["12px", { "lineHeight": "16px", "letterSpacing": "-0.02em", "fontWeight": "500" }],
        "display-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      }
    }
  },
  plugins: [],
}



================================================
FILE: task.md
================================================
# Tarefas de ImplementaÃ§Ã£o - Gerador de OS (PWA + Firebase)

## Fase 1 â€” ConfiguraÃ§Ã£o do Projeto e Vite
- [ ] Inicializar projeto Vite (React) na raiz
- [ ] Instalar e configurar TailwindCSS
- [ ] Instalar dependÃªncias (`firebase`, `vite-plugin-pwa`, `lucide-react`)
- [ ] Configurar `vite-plugin-pwa` no `vite.config.js`
- [ ] Limpar arquivos antigos (`sw.js`, `js/app.js`, `css/styles.css`, `index.html` antigo)

## Fase 2 â€” ComponentizaÃ§Ã£o (UI e Tailwind)
- [ ] Criar estrutura base (`App.jsx` com estado global da OS)
- [ ] Criar componente `SidebarForm.jsx` (Inputs) estilizado com Tailwind
- [ ] Criar componente `PreviewA4.jsx` (Documento para impressÃ£o) estilizado com Tailwind
- [ ] Testar layout de impressÃ£o (`@media print`)

## Fase 3 â€” IntegraÃ§Ã£o Firebase
- [ ] Configurar `src/services/firebase.js` com variÃ¡veis do `.env`
- [ ] Implementar autenticaÃ§Ã£o (Login com Google)
- [ ] Implementar salvamento/carregamento da OS no Firestore
- [ ] (Opcional) Autosave de rascunho

## Fase 4 â€” Deploy e Testes PWA
- [ ] Testar modo offline (Service Worker gerado pelo Vite)
- [ ] Fazer build e testar PWA
- [ ] Deploy no Firebase Hosting



================================================
FILE: vercel.json
================================================
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}



================================================
FILE: vite.config.js
================================================
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: "Gerador de Ordem de ServiÃ§o",
        short_name: "Gerador OS",
        description: "Aplicativo para gerar orÃ§amentos e OS",
        theme_color: "#1a5276",
        background_color: "#f0f2f5",
        display: "standalone",
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}']
      }
    })
  ]
});



================================================
FILE: .oxlintrc.json
================================================
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}



================================================
FILE: src/App.css
================================================
.counter {
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 5px;
  color: var(--accent);
  background: var(--accent-bg);
  border: 2px solid transparent;
  transition: border-color 0.3s;
  margin-bottom: 24px;

  &:hover {
    border-color: var(--accent-border);
  }
  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.hero {
  position: relative;

  .base,
  .framework,
  .vite {
    inset-inline: 0;
    margin: 0 auto;
  }

  .base {
    width: 170px;
    position: relative;
    z-index: 0;
  }

  .framework,
  .vite {
    position: absolute;
  }

  .framework {
    z-index: 1;
    top: 34px;
    height: 28px;
    transform: perspective(2000px) rotateZ(300deg) rotateX(44deg) rotateY(39deg)
      scale(1.4);
  }

  .vite {
    z-index: 0;
    top: 107px;
    height: 26px;
    width: auto;
    transform: perspective(2000px) rotateZ(300deg) rotateX(40deg) rotateY(39deg)
      scale(0.8);
  }
}

#center {
  display: flex;
  flex-direction: column;
  gap: 25px;
  place-content: center;
  place-items: center;
  flex-grow: 1;

  @media (max-width: 1024px) {
    padding: 32px 20px 24px;
    gap: 18px;
  }
}

#next-steps {
  display: flex;
  border-top: 1px solid var(--border);
  text-align: left;

  & > div {
    flex: 1 1 0;
    padding: 32px;
    @media (max-width: 1024px) {
      padding: 24px 20px;
    }
  }

  .icon {
    margin-bottom: 16px;
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    flex-direction: column;
    text-align: center;
  }
}

#docs {
  border-right: 1px solid var(--border);

  @media (max-width: 1024px) {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

#next-steps ul {
  list-style: none;
  padding: 0;
  display: flex;
  gap: 8px;
  margin: 32px 0 0;

  .logo {
    height: 18px;
  }

  a {
    color: var(--text-h);
    font-size: 16px;
    border-radius: 6px;
    background: var(--social-bg);
    display: flex;
    padding: 6px 12px;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    transition: box-shadow 0.3s;

    &:hover {
      box-shadow: var(--shadow);
    }
    .button-icon {
      height: 18px;
      width: 18px;
    }
  }

  @media (max-width: 1024px) {
    margin-top: 20px;
    flex-wrap: wrap;
    justify-content: center;

    li {
      flex: 1 1 calc(50% - 8px);
    }

    a {
      width: 100%;
      justify-content: center;
      box-sizing: border-box;
    }
  }
}

#spacer {
  height: 88px;
  border-top: 1px solid var(--border);
  @media (max-width: 1024px) {
    height: 48px;
  }
}

.ticks {
  position: relative;
  width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -4.5px;
    border: 5px solid transparent;
  }

  &::before {
    left: 0;
    border-left-color: var(--border);
  }
  &::after {
    right: 0;
    border-right-color: var(--border);
  }
}



================================================
FILE: src/App.jsx
================================================
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
    cliente: { nome: '', doc: '', contato: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', end: '' },
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
            // Se nÃ£o tem empresa cadastrada, obriga o onboarding
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
    let parsedData = { ...clientData };
    
    // Tenta desmembrar a string de endereÃ§o gerada pelo ClientManager
    if (parsedData.end && !parsedData.rua) {
      const match = parsedData.end.match(/^(.*?), (.*?)(?: \((.*?)\))? - (.*?) - (.*?) - CEP: (.*?)$/);
      if (match) {
        parsedData.rua = match[1] || '';
        parsedData.numero = match[2] || '';
        parsedData.complemento = match[3] || '';
        parsedData.bairro = match[4] || '';
        parsedData.cidade = match[5] || '';
        parsedData.cep = match[6] || '';
      } else {
        parsedData.rua = parsedData.end;
      }
    }

    setData(prev => ({
      ...prev,
      cliente: parsedData
    }));
  };

  const handleProductSelect = (productData) => {
    setData(prev => {
      // Se o Ãºnico item da lista for vazio, substitui ele em vez de adicionar outro
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
      cliente: osData.cliente || { nome: '', doc: '', contato: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', end: '' },
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
        cliente: { nome: '', doc: '', contato: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', end: '' },
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
      toast.error("FaÃ§a login para salvar a OS!");
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
              <h2 className="text-xl font-bold text-slate-700">RelatÃ³rios Financeiros</h2>
              <p className="mt-2 text-sm">Em breve! Os relatÃ³rios financeiros estÃ£o sendo desenvolvidos.</p>
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

      {deferredPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[999] bg-white rounded-lg shadow-2xl border border-slate-200 p-4 flex items-center gap-4 animate-bounce-short">
          <div className="w-10 h-10 bg-[#1a5276] text-white rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-800">Instalar Aplicativo</p>
            <p className="text-xs text-slate-500">Adicione Ã  sua tela inicial</p>
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



================================================
FILE: src/index.css
================================================
@import "tailwindcss";

@theme {
  --color-brand-navy: #0f3c5c;
  --color-brand-dark: #0a273c;
  --color-brand-light: #1d5a87;
  --color-brand-accent: #0284c7;
  --color-brand-subtle: #eaf2f8;
  
  --color-brand-50: #f0f7ff;
  --color-brand-100: #e0effe;
  --color-brand-500: #0284c7;
  --color-brand-600: #0369a1;
  --color-brand-700: #075985;
  --color-brand-900: #0c4a6e;
  
  --color-sidebar: #0B132B;
  --color-sidebar-dark: #080E21;
  --color-sidebar-hover: #142042;
  --color-sidebar-active: #102A45;

  --font-sans: "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", sans-serif;
  
  --spacing-a4-ratio-width: 210mm;
  --spacing-a4-ratio-height: 297mm;
}

@layer base {
  html, body {
    margin: 0;
    padding: 0;
  }
}

/* Custom clean scrollbars from builder */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Sidebar transition classes */
#sidebar {
  transition: width 0.25s ease-in-out;
}
.sidebar-collapsed {
  width: 5rem !important;
}
.sidebar-collapsed .nav-text,
.sidebar-collapsed .brand-text,
.sidebar-collapsed .user-info {
  display: none !important;
}
.sidebar-collapsed .brand-container {
  justify-content: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.sidebar-collapsed .nav-link {
  justify-content: center !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}


================================================
FILE: src/main.jsx
================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)



================================================
FILE: src/components/ClientManager.jsx
================================================
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getClients, addClient, updateClient, deleteClient } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function ClientManager({ user, onClose, onClientSelect, isPage }) {
  const location = useLocation();
  const isSelectMode = !!onClientSelect;
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    doc: '',
    contato: '',
    obs: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    end: '' // usado para fallback
  });

  useEffect(() => {
    loadClients();
  }, [user]);

  useEffect(() => {
    if (location.state?.openNewClient) {
      resetForm();
      setIsFormOpen(true);
      // Limpa o state da URL para nÃ£o reabrir ao dar refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(user.id);
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Concatenar endereÃ§o para o Supabase (que sÃ³ tem a coluna 'end')
    let endFormatado = formData.end;
    if (formData.rua || formData.cidade || formData.bairro) {
      endFormatado = `${formData.rua || ''}, ${formData.numero || 'S/N'}${formData.complemento ? ' ('+formData.complemento+')' : ''} - ${formData.bairro || ''} - ${formData.cidade || ''} - CEP: ${formData.cep || ''}`;
    }

    const payload = {
      nome: formData.nome,
      doc: formData.doc,
      contato: formData.contato,
      // obs: formData.obs, // Removido temporariamente pois a coluna 'obs' nÃ£o existe na tabela 'clientes' do Supabase
      end: endFormatado
    };

    try {
      if (isEditing) {
        await updateClient(user.id, currentId, payload);
        toast.success("Cliente atualizado!");
      } else {
        await addClient(user.id, payload);
        toast.success("Cliente adicionado!");
      }
      resetForm();
      setIsFormOpen(false);
      loadClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro: " + (error.message || "ao salvar cliente"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este cliente?")) return;
    try {
      await deleteClient(user.id, id);
      toast.success("Cliente excluÃ­do!");
      loadClients();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir cliente.");
    }
  };

  const startEdit = (client) => {
    setIsEditing(true);
    setCurrentId(client.id);
    
    let parsedAddress = {
      rua: client.end || '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      cep: ''
    };
    
    // Tenta desmembrar a string de endereÃ§o concatenada
    if (client.end) {
      const match = client.end.match(/^(.*?), (.*?)(?: \((.*?)\))? - (.*?) - (.*?) - CEP: (.*?)$/);
      if (match) {
        parsedAddress.rua = match[1] || '';
        parsedAddress.numero = match[2] || '';
        parsedAddress.complemento = match[3] || '';
        parsedAddress.bairro = match[4] || '';
        parsedAddress.cidade = match[5] || '';
        parsedAddress.cep = match[6] || '';
      }
    }

    setFormData({
      nome: client.nome || '',
      doc: client.doc || '',
      contato: client.contato || '',
      obs: client.obs || '',
      end: client.end || '',
      ...parsedAddress
    });
    setIsFormOpen(true);
  };

  const openNewClient = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({ nome: '', doc: '', contato: '', obs: '', cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', end: '' });
  };

  const handleSelect = (client) => {
    if (onClientSelect) {
      onClientSelect(client);
      onClose();
    }
  };

  const containerClass = isPage
    ? "w-full max-w-[1280px] mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-navy flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">group</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {isSelectMode ? 'Selecionar Cliente' : 'Gerenciamento de Clientes'}
              </h2>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                {isSelectMode ? 'Busque e selecione para a OS' : 'Cadastro e HistÃ³rico'}
              </span>
            </div>
          </div>
          {!isPage && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          )}
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50 min-w-0 w-full">
          {/* Top Bar: Search & Action */}
          <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="relative w-full sm:w-96">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 pointer-events-none">search</span>
              <input 
                type="text"
                placeholder="Pesquisar por nome ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
              />
            </div>
            
            <button 
              onClick={openNewClient}
              className="w-full sm:w-auto h-10 px-4 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Novo Cliente</span>
            </button>
          </div>

          {/* List Section (Table) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 min-w-0 w-full">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy"></div>
              </div>
            ) : clients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">person_off</span>
                <span className="text-sm">Nenhum cliente encontrado.</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4 border-b border-slate-200">Nome / RazÃ£o Social</th>
                        <th className="py-3 px-4 border-b border-slate-200">CPF / CNPJ</th>
                        <th className="py-3 px-4 border-b border-slate-200">Contato</th>
                        <th className="py-3 px-4 border-b border-slate-200 w-1/3">EndereÃ§o</th>
                        <th className="py-3 px-4 border-b border-slate-200 text-right">AÃ§Ãµes</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100">
                      {clients.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || (c.doc && c.doc.includes(searchTerm))).map((client, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={client.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-sky-50/50 transition-colors group`}>
                            <td className="py-3 px-4 font-semibold text-slate-900">{client.nome}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 text-xs">{client.doc || '-'}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 text-xs">{client.contato || '-'}</td>
                            <td className="py-3 px-4 text-slate-600 text-xs truncate max-w-[200px]" title={client.end}>{client.end || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              {isSelectMode ? (
                                <button 
                                  onClick={() => handleSelect(client)}
                                  className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#0a273c] transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                                  Usar na OS
                                </button>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => startEdit(client)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Editar">
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                  </button>
                                  <button onClick={() => handleDelete(client.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 md:px-6 md:py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                <span className="material-symbols-outlined text-[24px] text-sky-600">
                  {isEditing ? 'edit_square' : 'person_add'}
                </span>
                {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
              </span>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <form id="client-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">Nome / RazÃ£o Social</label>
                  <input 
                    type="text" name="nome" value={formData.nome} onChange={handleChange} required
                    placeholder="Ex: JoÃ£o da Silva / Empresa LTDA"
                    className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">CPF / CNPJ</label>
                    <input 
                      type="text" name="doc" value={formData.doc} onChange={handleChange}
                      placeholder="000.000.000-00"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Contato (Tel/Email)</label>
                    <input 
                      type="text" name="contato" value={formData.contato} onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">CEP</label>
                    <input 
                      type="text" name="cep" value={formData.cep} onChange={handleChange}
                      placeholder="00000-000"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Rua / Logradouro</label>
                    <input 
                      type="text" name="rua" value={formData.rua} onChange={handleChange}
                      placeholder="Nome da rua"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">NÃºmero</label>
                    <input 
                      type="text" name="numero" value={formData.numero} onChange={handleChange}
                      placeholder="123"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Complemento</label>
                    <input 
                      type="text" name="complemento" value={formData.complemento} onChange={handleChange}
                      placeholder="Apto 45, Bloco B"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Bairro</label>
                    <input 
                      type="text" name="bairro" value={formData.bairro} onChange={handleChange}
                      placeholder="Centro"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Cidade - UF</label>
                    <input 
                      type="text" name="cidade" value={formData.cidade} onChange={handleChange}
                      placeholder="SÃ£o Paulo - SP"
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 mt-2">
                  <label className="text-[11px] font-semibold uppercase text-amber-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">visibility_off</span>
                    ObservaÃ§Ãµes Internas (NÃ£o saem na OS)
                  </label>
                  <textarea 
                    name="obs" value={formData.obs} onChange={handleChange} rows="3"
                    placeholder="AnotaÃ§Ãµes privadas sobre o cliente, histÃ³rico de crÃ©dito, etc..."
                    className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm transition-all w-full resize-none placeholder:text-amber-700/40"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 rounded-b-xl">
              <button type="button" onClick={() => setIsFormOpen(false)} className="h-10 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" form="client-form"
                className="h-10 px-6 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isEditing ? 'Atualizar Cliente' : 'Salvar Cliente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



================================================
FILE: src/components/CompanySettings.jsx
================================================
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { saveCompanyData } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function CompanySettings({ user, currentData, onClose, onSaveSuccess, forceOnboarding, isPage }) {
  const [formData, setFormData] = useState({
    cnpj: '',
    fone: '',
    email: '',
    rua: '',
    numero: '',
    complemento: '',
    cep: '',
    cidade: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentData) {
      setFormData(prev => ({ ...prev, ...currentData }));
    }
  }, [currentData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const compPart = formData.complemento ? `, ${formData.complemento}` : '';
    const compiledEnd = `${formData.rua}, ${formData.numero}${compPart} - ${formData.cidade} - CEP: ${formData.cep}`;
    const dataToSave = { 
      nome: formData.nome,
      cnpj: formData.cnpj,
      fone: formData.fone,
      email: formData.email,
      end: compiledEnd 
    };
    try {
      await saveCompanyData(user.id, dataToSave);
      toast.success("Dados da empresa salvos!");
      onSaveSuccess(dataToSave);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar dados da empresa.");
    } finally {
      setLoading(false);
    }
  };

  const containerClass = isPage
    ? "w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white rounded-t-lg">
          <h2 className="text-xl font-bold text-[#1a5276]">Minha Empresa</h2>
          {!forceOnboarding && !isPage && (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="p-4 overflow-y-auto">
          <form id="company-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome / RazÃ£o Social</label>
              <input 
                type="text" name="nome" value={formData.nome || ''} onChange={handleChange} required
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input 
                type="text" name="cnpj" value={formData.cnpj || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input 
                type="text" name="fone" value={formData.fone || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" name="email" value={formData.email || ''} onChange={handleChange}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              />
            </div>
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-semibold text-[#1a5276] mb-3">EndereÃ§o</h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">CEP</label>
                  <input 
                    type="text" name="cep" value={formData.cep || ''} onChange={handleChange} placeholder="00000-000"
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rua / Logradouro</label>
                  <input 
                    type="text" name="rua" value={formData.rua || ''} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">NÃºmero</label>
                  <input 
                    type="text" name="numero" value={formData.numero || ''} onChange={handleChange} required
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Complemento / Bairro</label>
                  <input 
                    type="text" name="complemento" value={formData.complemento || ''} onChange={handleChange}
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
                <div className="sm:col-span-6">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cidade - UF</label>
                  <input 
                    type="text" name="cidade" value={formData.cidade || ''} onChange={handleChange} required placeholder="Sua Cidade - SP"
                    className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {forceOnboarding && (
          <div className="px-4 text-sm text-amber-600 bg-amber-50 py-2 border-t border-amber-200">
            VocÃª precisa preencher os dados da sua empresa antes de continuar.
          </div>
        )}

        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex justify-end gap-2 shrink-0 mt-auto">
          {!forceOnboarding && (
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          )}
          <button 
            type="submit" form="company-form" disabled={loading}
            className="flex items-center gap-2 bg-[#1a5276] text-white px-4 py-2 rounded hover:bg-[#154360] transition-colors disabled:opacity-50"
          >
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}



================================================
FILE: src/components/Header.jsx
================================================
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
          placeholder="Buscar OS, clientes ou serviÃ§os..." 
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



================================================
FILE: src/components/Layout.jsx
================================================
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 text-sm font-sans antialiased" id="app-root">
      {/* Overlay Escuro para Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        user={user} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}



================================================
FILE: src/components/Login.jsx
================================================
import { useState } from 'react';
import { signInWithEmail, signUpWithEmail, supabase } from '../services/supabase';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering && password !== confirmPassword) {
      setError("As senhas nÃ£o coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await signUpWithEmail(email, password, nome);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro inesperado.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert("E-mail de recuperaÃ§Ã£o de senha enviado!");
    } catch (err) {
      setError(err.message || "Erro ao tentar enviar e-mail de recuperaÃ§Ã£o.");
    } finally {
      setLoading(false);
    }
  };


  const toggleMode = (registerMode) => {
    setIsRegistering(registerMode);
    setError('');
    setNome('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col justify-center items-center p-4 font-sans">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border-t-4 border-[#1a5276]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a5276]">Gerador de OS</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isRegistering ? "Crie sua conta para continuar" : "FaÃ§a login para continuar"}
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input 
                type="text" 
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              placeholder="seu@email.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                autoComplete="new-password"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#1a5276] text-white py-2 rounded hover:bg-[#154360] transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-50"
          >
            {isRegistering ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? "Aguarde..." : (isRegistering ? "Cadastrar" : "Entrar")}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-4 text-center">
            <button 
              type="button" 
              onClick={handleResetPassword}
              disabled={loading}
              className="text-sm text-[#1a5276] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        )}



        <div className="mt-8 text-center text-sm text-gray-600">
          {isRegistering ? (
            <p>
              JÃ¡ tem uma conta?{' '}
              <button onClick={() => toggleMode(false)} className="text-[#1a5276] font-bold hover:underline">
                FaÃ§a login
              </button>
            </p>
          ) : (
            <p>
              Ainda nÃ£o tem cadastro?{' '}
              <button onClick={() => toggleMode(true)} className="text-[#1a5276] font-bold hover:underline">
                Clique aqui!
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}



================================================
FILE: src/components/OSHistory.jsx
================================================
import { useState, useEffect } from 'react';
import { X, Search, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { getOSList } from '../services/osService';

export default function OSHistory({ user, onClose, onLoadOS, onNewOS, isPage }) {
  const [osList, setOsList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterList();
  }, [searchTerm, statusFilter, osList]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getOSList(user.id);
      setOsList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterList = () => {
    let filtered = osList;
    
    if (statusFilter !== 'Todas') {
      filtered = filtered.filter(os => (os.os?.status || 'Aberta') === statusFilter);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(os => 
        (os.os?.numero && os.os.numero.toLowerCase().includes(term)) ||
        (os.cliente?.nome && os.cliente.nome.toLowerCase().includes(term))
      );
    }
    
    setFilteredList(filtered);
  };

  const getStatusBadge = (status) => {
    const s = status || 'Aberta';
    switch (s) {
      case 'Aberta': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded"><Clock size={12}/> Aberta</span>;
      case 'Aprovada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded"><CheckCircle size={12}/> Aprovada</span>;
      case 'Finalizada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded"><CheckCircle size={12}/> Finalizada</span>;
      case 'Cancelada': return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-red-100 text-red-800 rounded"><XCircle size={12}/> Cancelada</span>;
      default: return <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-800 rounded">{s}</span>;
    }
  };

  const calculateTotal = (os) => {
    const totalItens = os.items?.reduce((sum, item) => sum + ((Number(item.val) || 0) * (Number(item.qtd) || 0)), 0) || 0;
    const desconto = Number(os.desconto) || 0;
    return totalItens - desconto;
  };

  const containerClass = isPage
    ? "bg-white rounded-lg shadow-sm w-full flex flex-col h-full border border-gray-200"
    : "bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full pb-8"
    : "fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#1a5276]">HistÃ³rico de OS</h2>
          
          {isPage ? (
            <button onClick={onNewOS} className="bg-[#1a5276] text-white text-sm font-semibold px-4 py-2 rounded shadow hover:bg-[#154360] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Cadastrar Nova OS
            </button>
          ) : (
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por NÂº da OS ou Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border text-sm border-gray-300 rounded px-4 py-2 bg-white focus:ring-[#1a5276] focus:border-[#1a5276] outline-none"
          >
            <option value="Todas">Todos os Status</option>
            <option value="Aberta">Aberta</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Finalizada">Finalizada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="text-center text-gray-500 p-8">Carregando histÃ³rico...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center text-gray-500 p-8 flex flex-col items-center">
              <FileText size={48} className="text-gray-300 mb-2" />
              <p>Nenhuma OS encontrada.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-600 sticky top-0">
                  <th className="p-3 font-semibold">NÂº OS</th>
                  <th className="p-3 font-semibold">Data</th>
                  <th className="p-3 font-semibold">Cliente</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Total</th>
                  <th className="p-3 font-semibold text-center">AÃ§Ã£o</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(os => (
                  <tr key={os.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="p-3 font-medium text-[#1a5276]">{os.os?.numero || '-'}</td>
                    <td className="p-3 text-sm">{os.os?.data || '-'}</td>
                    <td className="p-3 text-sm truncate max-w-[200px]">{os.cliente?.nome || '-'}</td>
                    <td className="p-3">{getStatusBadge(os.os?.status)}</td>
                    <td className="p-3 font-medium">R$ {calculateTotal(os).toFixed(2).replace('.', ',')}</td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => {
                          onLoadOS(os);
                          onClose();
                        }}
                        className="bg-[#1a5276] text-white text-xs px-3 py-1.5 rounded hover:bg-[#154360]"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}



================================================
FILE: src/components/PreviewA4.jsx
================================================
export default function PreviewA4({ data }) {
  const formatMoney = (value) =>
    Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const subtotal = data.items?.reduce((acc, item) => acc + ((item.qtd || 1) * (item.val || 0)), 0) || 0;
  const totalGeral = Math.max(0, subtotal - (data.desconto || 0));

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
              {data.empresa?.end || '-'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-1">
              {data.empresa?.fone && <span>{data.empresa.fone}</span>}
              {data.empresa?.fone && data.empresa?.email && <span>â€¢</span>}
              {data.empresa?.email && <span className="text-sky-600">{data.empresa.email}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end text-right shrink-0">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded flex flex-col items-end gap-1 shadow-sm">
              <div className="flex items-baseline gap-2 text-brand-navy">
                <span className="text-xs font-bold tracking-tight uppercase">Ordem de ServiÃ§o</span>
                <span className="font-mono text-xl font-bold tracking-tight">NÂº {data.os?.numero || '-'}</span>
              </div>
              <div className="flex items-center gap-4 text-xs mt-1">
                <div className="flex flex-col items-end">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">EmissÃ£o</span>
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
              <span className="text-slate-500 text-[10px] uppercase">RazÃ£o Social / Nome</span>
              <span className="text-slate-900 font-semibold text-sm">{data.cliente?.nome || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">CNPJ / CPF</span>
              <span className="font-mono text-slate-800 text-xs">{data.cliente?.doc || '-'}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px] uppercase">Telefone / WhatsApp</span>
              <span className="font-mono text-slate-800 text-xs">{data.cliente?.contato || '-'}</span>
            </div>
            <div className="flex flex-col col-span-4">
              <span className="text-slate-500 text-[10px] uppercase">EndereÃ§o de Atendimento</span>
              <span className="text-slate-800 text-xs">
                {data.cliente?.rua || data.cliente?.cidade || data.cliente?.bairro ? (
                  `${data.cliente.rua || ''}, ${data.cliente.numero || 'S/N'}${data.cliente.complemento ? ' ('+data.cliente.complemento+')' : ''} - ${data.cliente.bairro || ''} - ${data.cliente.cidade || ''} - CEP: ${data.cliente.cep || ''}`
                ) : (
                  data.cliente?.end || '-'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Equipamento, Defeito Relatado e Laudo TÃ©cnico */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-2">
          <span className="text-[13px] uppercase tracking-wider text-sky-700 flex items-center gap-1.5 font-bold mb-0.5">
            <span className="material-symbols-outlined text-[15px]">laptop_mac</span>
            Equipamento & DiagnÃ³stico TÃ©cnico
          </span>
          
          <div className="bg-white p-2 rounded border border-slate-200 shadow-sm">
            <span className="text-slate-500 text-[10px] uppercase">Dispositivo / Equipamento</span>
            <div className="text-brand-navy font-semibold text-sm">{data.equipamento || '-'}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col gap-0.5">
              <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px] text-rose-500">report_problem</span>
                ServiÃ§o / Relato
              </span>
              <p className="text-xs text-slate-800 leading-snug whitespace-pre-wrap">
                {data.servico || '-'}
              </p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col gap-0.5">
              <span className="text-xs text-slate-600 flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[14px] text-sky-600">verified</span>
                ObservaÃ§Ãµes TÃ©cnicas Internas
              </span>
              <p className="text-xs text-slate-800 leading-snug whitespace-pre-wrap">
                {data.obsInterna || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TÃ©cnico ResponsÃ¡vel:</span>
              <span className="font-semibold text-slate-800">{data.tecnico || '-'}</span>
            </div>
          </div>
        </div>

        {/* 5. Tabela de ServiÃ§os e PeÃ§as */}
        <div className="flex flex-col gap-1 mt-1">
          <span className="text-[13px] uppercase tracking-wider text-sky-700 flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
            DiscriminaÃ§Ã£o de ServiÃ§os & PeÃ§as Aplicadas
          </span>
          
          <div className="overflow-hidden rounded border border-slate-200">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="bg-brand-navy text-white uppercase text-[10px] tracking-wider">
                  <th className="py-1.5 px-2 w-10 text-center font-semibold">Item</th>
                  <th className="py-1.5 px-2 font-semibold">DescriÃ§Ã£o do ServiÃ§o / PeÃ§a</th>
                  <th className="py-1.5 px-2 text-center w-16 font-semibold">Qtd</th>
                  <th className="py-1.5 px-2 text-right w-24 font-semibold">UnitÃ¡rio</th>
                  <th className="py-1.5 px-2 text-right w-24 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {data.items?.length > 0 ? data.items.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-1.5 px-2 text-center font-mono text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 text-slate-800 font-medium">{item.desc || '-'}</td>
                    <td className="py-1.5 px-2 text-center font-mono text-slate-600">{item.qtd} un</td>
                    <td className="py-1.5 px-2 text-right font-mono text-slate-500">R$ {formatMoney(item.val)}</td>
                    <td className="py-1.5 px-2 text-right font-mono font-semibold text-brand-navy">R$ {formatMoney((item.qtd || 1) * (item.val || 0))}</td>
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

        {/* 6. Quadro de Totais e CondiÃ§Ãµes de Pagamento */}
        <div className="grid grid-cols-12 gap-3 items-start mt-1">
          {/* ObservaÃ§Ãµes e CondiÃ§Ãµes */}
          <div className="col-span-7 bg-slate-50 border border-slate-200 rounded p-3 flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-wider text-sky-700 font-bold">
              CondiÃ§Ãµes de Pagamento
            </span>
            <p className="text-[10px] text-slate-600 leading-snug mt-0.5">
              Faturamento emitido mediante a aprovaÃ§Ã£o desta Ordem de ServiÃ§o. Em caso de dÃºvidas, consulte nosso suporte. A validade deste orÃ§amento Ã© de 10 dias Ãºteis.
            </p>
          </div>
          
          {/* Resumo Financeiro / Fechamento */}
          <div className="col-span-5 bg-white border border-slate-200 p-3 rounded flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal dos Itens</span>
              <span className="font-mono text-slate-800 font-medium">R$ {formatMoney(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-rose-600">
              <span>Desconto</span>
              <span className="font-mono font-medium">- R$ {formatMoney(data.desconto || 0)}</span>
            </div>
            <div className="h-px bg-slate-200 my-0.5"></div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-brand-navy uppercase font-bold tracking-tight">Valor Total:</span>
              <span className="font-mono text-base text-brand-navy font-bold">R$ {formatMoney(totalGeral)}</span>
            </div>
          </div>
        </div>

        {/* 7. Termos de Garantia & CondiÃ§Ãµes Legais */}
        <div className="bg-slate-100 p-3 rounded border border-slate-200 text-[10px] text-slate-600 leading-snug flex flex-col gap-0.5 mt-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-800 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px] text-sky-600">shield</span>
            Termo de Garantia Legal e Responsabilidade TÃ©cnica
          </span>
          <p>
            Garantia legal de <strong>90 (noventa) dias</strong> a partir da data de entrega, cobrindo exclusivamente as peÃ§as substituÃ­das e serviÃ§os executados constantes neste documento. A garantia perde sua validade em caso de mau uso comprovado.
          </p>
        </div>

        {/* 8. Bloco de Assinaturas Formais */}
        <div className="grid grid-cols-2 gap-6 pt-6 pb-2 mt-auto">
          {/* Assinatura TÃ©cnica / Empresa */}
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
              <span className="text-slate-400 text-[9px] italic mb-1">De acordo com serviÃ§os e valores acima</span>
            </div>
            <div className="w-4/5 h-px bg-brand-navy/30 mb-1"></div>
            <span className="text-xs text-brand-navy font-bold leading-tight">{data.cliente?.nome || '-'}</span>
            <span className="text-[10px] text-slate-500">Assinatura do Cliente</span>
          </div>
        </div>

      </div>

      {/* 9. RodapÃ© TÃ©cnico Oficial da PÃ¡gina A4 */}
      <footer className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-brand-navy">Gerador de OS</span>
          <span>â€¢</span>
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



================================================
FILE: src/components/ProductManager.jsx
================================================
import { useState, useEffect } from 'react';
import { getProducts, addProduct, updateProduct, deleteProduct } from '../services/profileService';
import { toast } from 'react-hot-toast';

export default function ProductManager({ user, onClose, onProductSelect, isPage }) {
  const isSelectMode = !!onProductSelect;
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // State for the form
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    custo: 0,
    margem: 0,
    val: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(user.id);
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numValue = name === 'nome' ? value : (Number(value) || 0);
    
    setFormData(prev => {
      const next = { ...prev, [name]: numValue };
      if (name === 'custo' || name === 'margem') {
        next.val = Number((next.custo + (next.custo * (next.margem / 100))).toFixed(2));
      } else if (name === 'val') {
        if (next.custo > 0) {
          next.margem = Number((((next.val - next.custo) / next.custo) * 100).toFixed(2));
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateProduct(user.id, currentId, formData);
        toast.success("Produto atualizado!");
      } else {
        await addProduct(user.id, formData);
        toast.success("Produto adicionado ao catÃ¡logo!");
      }
      resetForm();
      setShowForm(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente excluir este produto?")) return;
    try {
      await deleteProduct(user.id, id);
      toast.success("Produto excluÃ­do!");
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir produto.");
    }
  };

  const startEdit = (product) => {
    setIsEditing(true);
    setShowForm(true);
    setCurrentId(product.id);
    setFormData({
      nome: product.nome || '',
      custo: product.custo || 0,
      margem: product.margem || 0,
      val: product.val || 0
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setShowForm(false);
    setCurrentId(null);
    setFormData({ nome: '', custo: 0, margem: 0, val: 0 });
  };

  const handleSelect = (product) => {
    if (onProductSelect) {
      onProductSelect({ desc: product.nome, val: product.val });
      onClose();
    }
  };

  const formatMoney = (num) => num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const containerClass = isPage
    ? "w-full max-w-[1280px] mx-auto p-4 md:p-8 flex flex-col h-full bg-slate-50 min-h-screen"
    : "w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]";

  const wrapperClass = isPage
    ? "w-full h-full"
    : "fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4";

  return (
    <div className={wrapperClass}>
      <div className={containerClass}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 bg-white shrink-0 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-brand-navy flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {isSelectMode ? 'Buscar no CatÃ¡logo' : 'Cadastro de Produtos e PeÃ§as'}
              </h2>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {isSelectMode ? 'Selecione um item para adicionar Ã  OS' : 'Gerenciamento de Estoque'}
              </span>
            </div>
          </div>
          {!isPage && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          )}
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
          {/* List Section */}
          <div className="flex flex-col bg-white w-full h-full">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 shrink-0">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-slate-400 pointer-events-none">search</span>
                <input 
                  type="text"
                  placeholder="Pesquisar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                />
              </div>
              {!isSelectMode && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="h-10 px-4 bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Novo Produto
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-navy"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">inventory</span>
                  <span className="text-sm">Nenhum produto encontrado.</span>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                          <th className="py-3 px-4 border-b border-slate-200">Nome / DescriÃ§Ã£o</th>
                          <th className="py-3 px-4 border-b border-slate-200 text-right">Valor Venda</th>
                          <th className="py-3 px-4 border-b border-slate-200 text-right">AÃ§Ãµes</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-100">
                        {products.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((product, idx) => {
                          const isEven = idx % 2 === 0;
                          return (
                            <tr key={product.id} className={`${isEven ? 'bg-white' : 'bg-slate-50/50'} hover:bg-sky-50/50 transition-colors group`}>
                              <td className="py-3 px-4 font-semibold text-slate-900">{product.nome}</td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-sky-700">R$ {formatMoney(product.val)}</td>
                              <td className="py-3 px-4 text-right">
                                {isSelectMode ? (
                                  <button 
                                    onClick={() => handleSelect(product)}
                                    className="h-8 px-3 inline-flex items-center justify-center gap-1.5 bg-brand-navy text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-[#0a273c] transition-colors"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">add_circle</span>
                                    Adicionar
                                  </button>
                                ) : (
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => startEdit(product)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="Editar">
                                      <span className="material-symbols-outlined text-[18px]">edit</span>
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                      <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Form Modal */}
      {showForm && !isSelectMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-900">{isEditing ? 'Editar Produto' : 'Novo Produto'}</span>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-200">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
              <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase text-slate-500">Nome / DescriÃ§Ã£o</label>
                  <input 
                    type="text" name="nome" value={formData.nome} onChange={handleChange} required
                    placeholder="Ex: FormataÃ§Ã£o, SSD 240GB..."
                    className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Valor de compra (R$)</label>
                    <input 
                      type="number" step="0.01" name="custo" value={formData.custo || ''} onChange={handleChange}
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-semibold uppercase text-slate-500">Porcentagem de lucro (%)</label>
                    <input 
                      type="number" step="0.01" name="margem" value={formData.margem || ''} onChange={handleChange}
                      className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 mt-2">
                  <label className="text-[11px] font-semibold uppercase text-sky-700">Valor final (R$)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 font-mono font-bold text-sky-700">R$</span>
                    <input 
                      type="number" step="0.01" name="val" value={formData.val} onChange={handleChange} required
                      className="h-12 pl-10 pr-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 shadow-sm transition-all w-full"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={resetForm} className="h-9 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-sm transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" form="product-form"
                className="h-9 px-6 rounded-lg bg-brand-navy hover:bg-[#0a273c] text-white font-semibold text-sm shadow-md transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{isEditing ? 'Atualizar Produto' : 'Salvar no CatÃ¡logo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



================================================
FILE: src/components/Sidebar.jsx
================================================
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
      </svg>
    ), label: 'VisÃ£o Geral' },
    { path: '/os', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
    ), label: 'Ordens de ServiÃ§o' },
    { path: '/produtos', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
      </svg>
    ), label: 'PeÃ§as & ServiÃ§os' },
    { path: '/clientes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
    ), label: 'Clientes' },
    { path: '/relatorios', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    ), label: 'RelatÃ³rios Financeiros' },
    { path: '/configuracoes', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    ), label: 'ConfiguraÃ§Ãµes' },
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
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Sistema de GestÃ£o</span>
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
            <p className="text-sm font-semibold text-white truncate">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'UsuÃ¡rio'}</p>
            <p className="text-xs text-sky-400 font-medium truncate">TÃ©cnico</p>
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



================================================
FILE: src/components/SidebarForm.jsx
================================================
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



================================================
FILE: src/services/osService.js
================================================
import { supabase } from './supabase';

export const getNextOSNumber = async (userId) => {
  if (!userId) return "0001/2026";
  
  // Use Postgres function to get next number
  const { data, error } = await supabase
    .rpc('get_next_os_number', { p_user_id: userId });
    
  let next = 1;
  if (!error && data) {
    next = data;
  }
  
  const year = new Date().getFullYear();
  return `${String(next).padStart(4, '0')}/${year}`;
};

export const saveOS = async (userId, osData) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const numeroInt = parseInt(String(osData.os.numero).split('/')[0], 10) || 1;
  const isEditing = !!osData.id; 
  
  // 1. Upsert na tabela OS
  const osPayload = {
    user_id: userId,
    numero: numeroInt,
    data: osData.os.data,
    status: osData.os.status,
    cliente_id: osData.cliente.id || null,
    cliente_snapshot: osData.cliente,
    equipamento: osData.equipamento,
    servico: osData.servico,
    // obsInterna: osData.obsInterna, // Removido temporariamente pois a coluna 'obsInterna' nÃ£o existe na tabela 'os' do Supabase
    desconto: Number(osData.desconto) || 0,
    tecnico: osData.tecnico
  };

  let osId = osData.id;

  if (isEditing) {
    const { error } = await supabase
      .from('os')
      .update(osPayload)
      .eq('id', osId)
      .eq('user_id', userId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('os')
      .insert([osPayload])
      .select()
      .single();
    if (error) throw error;
    osId = data.id;
  }

  // 2. Sincronizar Items (Deletar antigos e inserir novos)
  if (isEditing) {
    await supabase.from('os_items').delete().eq('os_id', osId);
  }

  if (osData.items && osData.items.length > 0) {
    const itemsPayload = osData.items.map(item => ({
      os_id: osId,
      desc: item.desc,
      qtd: Number(item.qtd) || 1,
      val: Number(item.val) || 0
    }));
    const { error: itemsError } = await supabase.from('os_items').insert(itemsPayload);
    if (itemsError) throw itemsError;
  }
  
  return osId;
};

export const getOSList = async (userId) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  // Buscar OS com os itens aninhados
  const { data, error } = await supabase
    .from('os')
    .select(`
      *,
      items:os_items(*)
    `)
    .eq('user_id', userId)
    .order('numero', { ascending: false });
    
  if (error) throw error;
  
  // Reconstruir o objeto para a UI (compatibilidade retroativa)
  return (data || []).map(row => {
    const year = new Date(row.created_at).getFullYear();
    return {
      id: row.id,
      empresa: {}, // NÃ£o carregado aqui, App.jsx mantÃ©m o estado global
      os: {
        numero: `${String(row.numero).padStart(4, '0')}/${year}`,
        data: row.data,
        status: row.status
      },
      cliente: row.cliente_snapshot || { nome: '', doc: '', end: '', contato: '' },
      equipamento: row.equipamento || '',
      servico: row.servico || '',
      obsInterna: row.obsInterna || '',
      desconto: row.desconto || 0,
      tecnico: row.tecnico || '',
      items: row.items && row.items.length > 0 ? row.items : [{ id: 1, desc: '', qtd: 1, val: 0 }]
    };
  });
};



================================================
FILE: src/services/profileService.js
================================================
import { supabase } from './supabase';

// --- COMPANY / EMPRESA ---
export const saveCompanyData = async (userId, companyData) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { error } = await supabase
    .from('empresas')
    .upsert(
      { user_id: userId, ...companyData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
    
  if (error) throw error;
};

export const getCompanyData = async (userId) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data || null;
};

// --- CLIENTS / CLIENTES ---
export const addClient = async (userId, clientData) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { data, error } = await supabase
    .from('clientes')
    .insert([{ user_id: userId, ...clientData }])
    .select()
    .single();
    
  if (error) throw error;
  return data.id;
};

export const getClients = async (userId) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

export const updateClient = async (userId, clientId, clientData) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { error } = await supabase
    .from('clientes')
    .update({ ...clientData })
    .eq('id', clientId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const deleteClient = async (userId, clientId) => {
  if (!userId || !clientId) throw new Error("ParÃ¢metros invÃ¡lidos");
  
  const { error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', clientId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

// ==========================================
// PRODUCTS CRUD
// ==========================================

export const getProducts = async (userId) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('user_id', userId)
    .order('nome', { ascending: true });
    
  if (error) throw error;
  return data || [];
};

export const addProduct = async (userId, productData) => {
  if (!userId) throw new Error("UsuÃ¡rio nÃ£o autenticado");
  
  const { error } = await supabase
    .from('produtos')
    .insert([{ 
      user_id: userId, 
      ...productData,
      val: Number(productData.val) || 0
    }]);
    
  if (error) throw error;
};

export const updateProduct = async (userId, productId, productData) => {
  if (!userId || !productId) throw new Error("ParÃ¢metros invÃ¡lidos");
  
  const { error } = await supabase
    .from('produtos')
    .update({ 
      ...productData,
      val: Number(productData.val) || 0 
    })
    .eq('id', productId)
    .eq('user_id', userId);
    
  if (error) throw error;
};

export const deleteProduct = async (userId, productId) => {
  if (!userId || !productId) throw new Error("ParÃ¢metros invÃ¡lidos");
  
  const { error } = await supabase
    .from('produtos')
    .delete()
    .eq('id', productId)
    .eq('user_id', userId);
    
  if (error) throw error;
};




================================================
FILE: src/services/supabase.js
================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Authentication Helpers
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      }
    }
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};



================================================
FILE: src/views/Dashboard.jsx
================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOSList } from '../services/osService';
import { toast } from 'react-hot-toast';

export default function Dashboard({ data, user, onNewOS }) {
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
      const osList = await getOSList(user.id);
      
      const today = new Date().toLocaleDateString('pt-BR');
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let abertas = 0;
      let concluidasHoje = 0;
      let faturamentoMes = 0;
      let concluidasMes = 0;

      osList.forEach(os => {
        const status = os.os?.status || 'Aberta';
        const dataStr = os.os?.data || ''; // 'DD/MM/YYYY'
        
        // Count Abertas/Andamento
        if (status === 'Aberta' || status === 'Em Andamento') {
          abertas++;
        }

        // Count Concluidas Hoje
        if (status === 'Finalizada' && dataStr === today) {
          concluidasHoje++;
        }

        // Faturamento do MÃªs
        if (status === 'Finalizada' || status === 'Aprovada') {
          // Parse DD/MM/YYYY
          const parts = dataStr.split('/');
          if (parts.length === 3) {
            const osMonth = parseInt(parts[1], 10) - 1;
            const osYear = parseInt(parts[2], 10);
            
            if (osMonth === currentMonth && osYear === currentYear) {
              const totalItens = os.items?.reduce((sum, item) => sum + ((Number(item.val) || 0) * (Number(item.qtd) || 0)), 0) || 0;
              const desconto = Number(os.desconto) || 0;
              const total = totalItens - desconto;
              
              faturamentoMes += total;
              concluidasMes++;
            }
          }
        }
      });

      setMetrics({
        abertas,
        concluidasHoje,
        faturamentoMes,
        ticketMedio: concluidasMes > 0 ? faturamentoMes / concluidasMes : 0
      });
    } catch (err) {
      console.error("Erro ao carregar mÃ©tricas:", err);
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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 100% Conectado Ã  Base Local & Nuvem
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
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">ConcluÃ­das Hoje</span>
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
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Faturamento MÃªs</span>
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
              <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block mb-1">Ticket MÃ©dio / OS</span>
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



================================================
FILE: src/views/OSEditor.jsx
================================================
Error reading file with 'cp1252': 'charmap' codec can't decode byte 0x8f in position 2583: character maps to <undefined>

