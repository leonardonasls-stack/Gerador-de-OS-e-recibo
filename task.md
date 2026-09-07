# Tarefas de Implementação - Gerador de OS (PWA + Firebase)

## Fase 1 — Configuração do Projeto e Vite
- [ ] Inicializar projeto Vite (React) na raiz
- [ ] Instalar e configurar TailwindCSS
- [ ] Instalar dependências (`firebase`, `vite-plugin-pwa`, `lucide-react`)
- [ ] Configurar `vite-plugin-pwa` no `vite.config.js`
- [ ] Limpar arquivos antigos (`sw.js`, `js/app.js`, `css/styles.css`, `index.html` antigo)

## Fase 2 — Componentização (UI e Tailwind)
- [ ] Criar estrutura base (`App.jsx` com estado global da OS)
- [ ] Criar componente `SidebarForm.jsx` (Inputs) estilizado com Tailwind
- [ ] Criar componente `PreviewA4.jsx` (Documento para impressão) estilizado com Tailwind
- [ ] Testar layout de impressão (`@media print`)

## Fase 3 — Integração Firebase
- [ ] Configurar `src/services/firebase.js` com variáveis do `.env`
- [ ] Implementar autenticação (Login com Google)
- [ ] Implementar salvamento/carregamento da OS no Firestore
- [ ] (Opcional) Autosave de rascunho

## Fase 4 — Deploy e Testes PWA
- [ ] Testar modo offline (Service Worker gerado pelo Vite)
- [ ] Fazer build e testar PWA
- [ ] Deploy no Firebase Hosting
