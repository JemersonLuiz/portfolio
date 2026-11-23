# Análise Técnica e Oportunidades de Melhoria — `portfolio`

Análise realizada nos arquivos públicos da branch `main` (páginas do portfólio e aplicativo embarcado em `apps/organizando/`).

## 1. Prioridade Alta

### 1.1. Resiliência de `localStorage` em `apps/organizando`
- **Arquivos:** `apps/organizando/app.js` (linhas 6–7), `apps/organizando/finance.js` (linhas 34–40)
- **Problema:** As leituras de `localStorage.getItem(...)` e `JSON.parse(saved)` não estão protegidas por `try/catch`. Em navegadores com armazenamento bloqueado ou caso exista JSON corrompido no dispositivo, a aplicação lança exceção na inicialização e não renderiza a interface.
- **Melhoria sugerida:** Envolver a leitura/parse em `try/catch` com fallback seguro para o estado padrão (`demoData()` ou `{ entries: [], plans: [] }`) e feedback discreto ao usuário caso o armazenamento esteja indisponível.

### 1.2. Privacidade de dados pessoais no rodapé
- **Arquivos:** `index.html` (linhas 126–129) e páginas de projeto (`helptask.html`, `jaboatao-360.html`, `nexo.html`, `organizando.html`, `triagem-de-materiais.html`)
- **Problema:** O número de telefone pessoal e o e-mail estão expostos diretamente em texto puro no HTML público de todas as páginas, facilitando coleta automatizada (spam/scraping).
- **Melhoria sugerida:** Avaliar remover o telefone pessoal direto do HTML público e priorizar LinkedIn, GitHub e e-mail profissional ou formulário de contato.

### 1.3. Links para recursos privados em `organizando.html`
- **Arquivo:** `organizando.html` (linha 53)
- **Problema:** Os links `Aplicativo privado` e `Repositório privado no GitHub` direcionam visitantes externos para páginas sem acesso público (404 no GitHub).
- **Melhoria sugerida:** Indicar claramente no texto que o código-fonte é privado sem exibir link quebrado para visitantes, destacando o botão principal `Abrir demonstração` (`apps/organizando/index.html`).

---

## 2. Prioridade Média

### 2.1. Duplicação de cabeçalho, rodapé e SVGs nas 6 páginas HTML
- **Arquivos:** `index.html`, `helptask.html`, `jaboatao-360.html`, `nexo.html`, `organizando.html`, `triagem-de-materiais.html`
- **Problema:** Toda a barra de navegação, botão de tema e rodapé de contatos são replicados manualmente em cada arquivo, aumentando o risco de divergência em futuras edições.
- **Melhoria sugerida:** Adotar um gerador estático simples (ex.: Eleventy, Astro ou script de build) ou Web Components leves para centralizar header/footer.

### 2.2. Verificações defensivas e preferência do sistema nos scripts de tema
- **Arquivos:** `portfolio-theme.js` (linhas 10 e 31), `apps/organizando/theme.js` (linhas 10 e 23)
- **Problema:** O código acessa `themeColor.content`, `button.hidden` e `toggle.addEventListener` sem validar se os elementos existem no DOM. Além disso, na primeira visita (sem valor no `localStorage`), o tema não respeita `window.matchMedia('(prefers-color-scheme: light)')`.
- **Melhoria sugerida:** Adicionar optional chaining (`?.`) e detectar a preferência inicial do sistema operacional quando não houver escolha salva.

### 2.3. Organização modular e datas dinâmicas em `apps/organizando`
- **Arquivos:** `apps/organizando/index.html` (linha 8), `finance.js` (linhas 6–8), `app.js` (linha 51), `market.js` (linha 10)
- **Problemas encontrados:**
  - Os 6 arquivos JS dependem de escopo global compartilhado e ordem rígida de `<script defer>`.
  - `now`, `today` e `thisMonth` em `finance.js` são calculados apenas no carregamento da página; se a aba ficar aberta na virada de dia/mês, validações de data ficam defasadas.
  - Em `app.js:51`, `plan.saved * 100 / plan.target` pode gerar `NaN`/`Infinity` se `plan.target <= 0` vier de dados alterados.
  - Em `market.js:10`, se a API `brapi.dev` retornar `hasNextPage: true`, a consulta inteira falha com `Error('Lista incompleta')`.
- **Melhoria sugerida:** Migrar para ES Modules (`type="module"`), transformar `today()`/`thisMonth()` em funções, proteger divisões contra zero e tratar paginação ou fallback parcial na API de ações.

### 2.4. Otimização de fontes e imagens
- **Arquivos:** `assets/dm-sans.ttf`, `apps/organizando/dm-sans.ttf`, `assets/jemerson-luiz.webp`
- **Problema:** A fonte `dm-sans.ttf` (~240 KB) está duplicada em duas pastas e em formato TTF (mais pesado que WOFF2). A foto de perfil (`1024x1536`, ~294 KB) é servida em tamanho único para qualquer largura de tela.
- **Melhoria sugerida:** Compartilhar uma única fonte em formato `.woff2` (redução típica de 50%–70%) e adicionar `srcset`/`sizes` para a imagem principal.

---

## 3. Prioridade Baixa / Polimento

- **Metadados de compartilhamento (SEO/Social):** Adicionar tags Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) e Twitter Cards para gerar cartões visuais ao compartilhar o portfólio no LinkedIn ou WhatsApp.
- **Limpeza de CSS (`style.css`):** Remover duplicidades de seletores (ex.: `.hero h1` nas linhas 28 e 161; `@media (max-width: 620px)` nas linhas 199 e 268) e padronizar formatação (parte do arquivo está minificada e parte expandida).
- **Documentação (`README.md`) e testes:** Criar um `README.md` documentando como rodar o portfólio localmente, estrutura de pastas e publicação via GitHub Pages. Adicionar testes unitários em Node para `apps/organizando/market.js` (que já exporta `rankMarket`) e `finance.js`.
- **Backup de dados no `Organizando`:** Incluir opções de exportar e importar JSON/CSV dos lançamentos e planos salvos no `localStorage`.
