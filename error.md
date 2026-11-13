# error.md — Revisão do Empty-Bus

Revisão feita sobre `empty-bus03-completo.html`. **Nenhum código foi alterado**: o conteúdo foi apenas separado em `index.html`, `css/style.css` e `js/*.js` (a união dos arquivos é equivalente ao original, ignorando espaços em branco) e todos os scripts passam em `node --check`.

Os itens abaixo são problemas encontrados, **ainda não corrigidos**.

Gravidade: 🔴 alta · 🟠 média · 🟡 baixa

---

## 1. Bugs e comportamento incorreto

| # | Gravidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 1.1 | 🔴 | `js/config.js` + `css/style.css` | **Modo escuro só afeta Configurações e Perfil.** O tema é aplicado em `<html data-tema>`, mas o CSS só reage em `.cf` e `.cf-err`. Login, Início, Linhas, Linha e Mapa continuam claros. |
| 1.2 | 🔴 | `js/mapa.js` / `css/style.css` | **O bottom sheet cobre a atribuição do Leaflet/OSM** (canto inferior), que fica atrás do painel com `z-index: 1000`. A licença do OpenStreetMap exige atribuição visível. |
| 1.3 | 🟠 | `js/linhas.js`, `js/mapa.js`, `js/config.js` | **Dados não são separados por usuário.** O perfil usa `painel:perfil:<id>`, mas favoritos de linhas (`painel:linhas-favoritas`), relatos de lotação (`painel:relatos`) e favoritos de paradas (`painel:favoritos`) são globais. Dois usuários no mesmo navegador compartilham tudo isso. |
| 1.4 | 🟠 | `js/mapa.js` | **Busca por endereço não funciona**, embora o campo diga "Buscar endereço, linha de ônibus...". Só procura nome de parada ou número de linha. Na Home, Enter com um endereço leva ao mapa e resulta em "Nenhuma parada ou linha encontrada". |
| 1.5 | 🟠 | `js/linhas.js` | **A busca não considera "destinos ou região"** (placeholder da tela Linhas). `matches()` só compara `line`, `name` e `direction`; as paradas em `via` não entram, e todas as linhas têm direção "Centro". |
| 1.6 | 🟠 | `js/config.js` | **Salvar perfil não é atômico.** `Auth.updateName()` grava o nome antes de `writeProfile()`. Se a segunda gravação falhar, o nome muda mas telefone e endereço não, e o usuário vê erro. |
| 1.7 | 🟠 | `js/mapa.js` | **Toast de erro aparece na tela errada.** Se o Leaflet não carregar, `toast('Não foi possível carregar o mapa...')` roda no carregamento, inclusive na tela de login, e o `return` impede o registro do listener de rota. |
| 1.8 | 🟡 | `js/linhas.js` | **Lista não é redesenhada pelo `tick()`.** O filtro "Mais próximos" (`minutes <= 10`) e o `aria-label` dos cards só atualizam em interação; um ônibus que passa de 11 para 10 min continua fora da lista, e o `aria-label` fica desatualizado. |
| 1.9 | 🟡 | `js/linhas.js` | **Empate favorece "Cheio".** Em `statusFor`, `full >= mid && full >= empty` retorna "Cheio" em qualquer empate (ex.: todos zerados ou 0/0/0). |
| 1.10 | 🟡 | `js/linhas.js` | **Medidor inconsistente:** `LEVEL = { full: 4, mid: 3, empty: 1 }` de 5 níveis. "Cheio" nunca chega a 5/5 e "Moderado" fica em 3/5 sem critério claro. |
| 1.11 | 🟡 | `js/linhas.js` | **Filtro persiste entre visitas.** Depois de `#linhas?filtro=fav`, o filtro "Favoritos" continua ativo ao voltar em `#linhas` sem parâmetro. |
| 1.12 | 🟡 | `js/mapa.js` | `search()` sem resultado só mostra toast; o mapa mantém os marcadores filtrados da busca anterior. |
| 1.13 | 🟡 | `js/config.js` | Telefone só valida a quantidade de dígitos; letras e símbolos são aceitos (ex.: `81 abc 91234-5678`) e gravados como estão. |
| 1.14 | 🟡 | `js/login.js` | Se não há Web Crypto, só aparece um aviso: os formulários continuam ativos e falham com mensagem genérica. |
| 1.15 | 🟡 | `js/rotas.js` | Título de `#mapa` é "Mapa de Linhas" (sem "- Empty-Bus"), diferente das outras telas. |

## 2. Código duplicado, morto ou inconsistente

| # | Gravidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 2.1 | 🟡 | `css/style.css` | `*`, `body`, `.app-container` e `.user-avatar` são declarados mais de uma vez (reset repetido 3×). `.app-container` ganha `overflow: hidden` só na terceira declaração, o que afeta todas as telas. |
| 2.2 | 🟡 | `js/auth.js` | `Auth.requireLogin()` e `Auth.redirectIfLoggedIn()` são definidas e exportadas, mas nunca usadas (o roteamento é feito em `rotas.js`). |
| 2.3 | 🟡 | vários `js/` | `$`, `el`, `normalize`, `debounce` e `toast()` reimplementados em `linhas.js`, `mapa.js` e `config.js` (toasts com ids, posições e tempos diferentes). |
| 2.4 | 🟡 | `js/linhas.js` | Existem **dois roteadores**: `route()` em `linhas.js` (alterna Home/Linhas) e `rotas.js` (alterna as demais telas). Ambos ouvem `hashchange` e a ordem de registro dos scripts importa. |
| 2.5 | 🟡 | `js/linhas.js` | O botão de logout (`#logout-btn`, tela Configurações) é tratado em `linhas.js`, fora do arquivo/responsabilidade correta. |
| 2.6 | 🟡 | `js/linhas.js`, `js/mapa.js` | Dados de linhas (`BUSES`) e paradas (`STOPS`) ficam em arquivos separados, ligados só por strings de id (`stop`, `lines`); fácil de dessincronizar. |
| 2.7 | 🟡 | `js/linhas.js` | `formatTime` e `formatEta` fazem quase a mesma coisa. |
| 2.8 | 🟡 | todos | Prefixo legado `painel:` em chaves de storage e no evento `painel:route`, apesar de o app se chamar Empty-Bus. |
| 2.9 | 🟡 | cabeçalhos | Comentário de `linhas.js` cita "Próximos ônibus (#)", mas a rota real é `#inicio`; o de `mapa.js` não cita `?parada=`. |
| 2.10 | 🟡 | `css/style.css` | `z-index: 10` dos controles do mapa é inútil (abaixo dos painéis do Leaflet) e é sobrescrito por JS (`1000`). Deveria estar no CSS. |
| 2.11 | 🟡 | `js/mapa.js` | Estilos inline extensos (`cssText`) para painel, linhas e popup em vez de classes no CSS. |
| 2.12 | 🟡 | `index.html` | Ids genéricos no sprite SVG (`user`, `out`, `info`, `back`, `star`, `help`...) podem colidir com outros ids. |

## 3. Segurança

Observação: o próprio código avisa que é protótipo 100% client-side. Os pontos abaixo valem para qualquer uso além de demonstração.

| # | Gravidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 3.1 | 🔴 | `js/auth.js` | **Autenticação só no navegador.** Usuários, hashes e sessão ficam em `localStorage`/`sessionStorage`; qualquer pessoa pode editar a sessão no DevTools e entrar como qualquer usuário, ou ler/copiar hash e salt. |
| 3.2 | 🟠 | `js/auth.js` | Sessão sem expiração; sem limite de tentativas ou bloqueio no login. |
| 3.3 | 🟠 | `js/linhas.js` | **XSS latente em `renderBus()`:** monta HTML com `innerHTML` interpolando `bus.name`, `bus.via`, `bus.color` e `bus.line`. Hoje os dados são constantes locais, mas ao trocar `BUSES` por uma API isso vira injeção de HTML/JS. Usar `textContent`/`el()`. |
| 3.4 | 🟠 | `index.html` | Scripts e estilos de CDN (Font Awesome 6.4.0, Leaflet 1.9.4) e Google Fonts **sem SRI** (`integrity`) e sem `crossorigin`. |
| 3.5 | 🟡 | `js/auth.js` | Cadastro revela se o e-mail já existe (esperado em app comum, mas permite enumeração). Política de senha fraca (8 caracteres, letra + número). |
| 3.6 | 🟡 | `index.html` | Sem Content-Security-Policy. |
| 3.7 | 🟡 | `js/config.js` | Foto do perfil aceita qualquer `image/*` (inclui SVG), sem limite de tamanho antes da leitura. |

## 4. Mapa, licenças e ambiente

| # | Gravidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 4.1 | 🟠 | `js/mapa.js` | **Abrir via `file:///` quebra o mapa:** os tiles do OpenStreetMap exigem `Referer`, que `file://` não envia (tiles podem vir bloqueados). Também limita geolocalização e armazenamento. Rodar com servidor local (`localhost`). |
| 4.2 | 🟠 | `js/mapa.js` | Servidor público `tile.openstreetmap.org` é proibido para uso em produção/volume pela política de tiles. Usar provedor próprio ou pago. |
| 4.3 | 🟠 | `js/mapa.js` | Camada de satélite usa o endpoint público da Esri/ArcGIS sem chave; verificar termos de uso. |
| 4.4 | 🟡 | `js/mapa.js` | Atribuição escrita `&copy; OpenStreetMap` sem link e sem "contributors" (o padrão pede link para o copyright). |
| 4.5 | 🟡 | `css/style.css` | `min-height: 100dvh` sem fallback `vh` para navegadores antigos. |
| 4.6 | 🟡 | `index.html` | Sem favicon (gera 404 no console) e sem `theme-color`. |
| 4.7 | 🟡 | `index.html` | Pesos 500 usados no CSS (`.bd-tag`, `.bd-count`), mas a fonte Inter só carrega 400/600/700. |

## 5. Acessibilidade

| # | Gravidade | Arquivo | Problema |
|---|-----------|---------|----------|
| 5.1 | 🔴 | `css/style.css` | **Foco invisível em áreas brancas:** `:focus-visible` usa outline branco, que some sobre o cartão branco do login (abas, mostrar senha, botão Entrar) e é pouco visível sobre o mapa. |
| 5.2 | 🟠 | `index.html` (mapa) | Botões só com ícone sem nome acessível: localizar, camadas e limpar busca. O campo de busca do mapa e o link voltar também não têm `aria-label`. |
| 5.3 | 🟠 | `js/linhas.js` | Card com `role="link"` contém um `<button>` de favoritar (interativo dentro de interativo), e o `aria-label` do card sobrescreve o conteúdo, escondendo o botão do leitor de tela. O texto "3 min ›" também é lido de forma estranha. |
| 5.4 | 🟠 | `js/mapa.js` | Alça do bottom sheet (`.drag-handle`) é um `div` clicável sem teclado/role; não há arrastar de fato. Botões Favoritos/Paradas sem `aria-pressed`. |
| 5.5 | 🟡 | `js/login.js` | Abas sem navegação por setas (padrão ARIA tabs). |
| 5.6 | 🟡 | `js/rotas.js` | Troca de tela não move o foco nem anuncia a nova tela. |
| 5.7 | 🟡 | `css/style.css` | Contraste estimado abaixo de 4.5:1: `.see-all` (#5cf1ff sobre #9900FF, ~4:1) e título `.cf-hd h2` (#1b0b33 sobre #9900FF, ~3,4:1); `.bus-item.dark` com texto pequeno fica no limite. |
| 5.8 | 🟡 | `index.html` | Ícones Font Awesome (`<i>`) decorativos sem `aria-hidden="true"`. |

## 6. Funcionalidades incompletas (placeholders)

- Configurações: **Privacidade**, **Notificações**, **Ajuda**, **Fale conosco** só mostram toast "em breve"; **Idioma** só informa que existe PT-BR.
- Perfil: botão de notificações mostra sempre "Você não tem novas notificações"; e-mail não pode ser alterado; não há troca de senha nem exclusão de conta.
- Botões flutuantes e de paradas/favoritos do mapa existem, mas não há rota/itinerário traçado, nem posição dos ônibus no mapa.
- Dados de ônibus, lotação e tempos são **mock**; contagem regressiva simulada (`tick`) e relatos de lotação ficam só no navegador, sem sincronização entre usuários.
- A foto do perfil não aparece na Home (o avatar do topo é sempre o ícone).

## 7. Itens verificados sem problema

- Sintaxe de todos os `.js` (`node --check`).
- Nenhum `id` duplicado no HTML; os ids usados no JS existem (exceto os criados dinamicamente: `bd-fav`, `toast`, `cf-toast`).
- Ordem de carregamento preservada: `auth` → Leaflet → `login` → `linhas` → `mapa` → `config` → `rotas`.
- Classes `badge-201/307/412` são usadas dinamicamente (`badge-${bus.line}`), não são código morto.
- Popups do mapa usam `textContent` (sem XSS); senhas são derivadas com PBKDF2 + salt.
