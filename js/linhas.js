'use strict';

/**
 * Empty-Bus - telas "Próximos ônibus" (#) e "Linhas de ônibus" (#linhas)
 *  - Saudação conforme o horário e nome do usuário logado
 *  - Cards com tempo, lotação (Cheio/Moderado/Vazio) e relatos
 *  - Busca com debounce; Enter na tela inicial leva ao mapa
 *  - Filtros Todas / Mais próximos / Favoritos (linhas favoritas ficam no navegador)
 *  - Contagem regressiva simulada
 *
 * Quando houver API real, basta substituir BUSES por um fetch().
 */
(() => {
  // ---------- Dados (mock) ----------
  // counts = relatos de lotação dos últimos 15 min (mock); stop = id da parada no mapa; via = paradas do itinerário (entre início e Centro)
  const BUSES = [
    { line: '201', name: 'Terminal Central', direction: 'Centro', minutes: 3,  stop: 'terminal-central',  counts: { empty: 1,  mid: 4,  full: 22 }, via: ['Av. Brasil', 'Praça da Liberdade', 'Hospital Municipal'] },
    { line: '307', name: 'Joana Bezerra',    direction: 'Centro', minutes: 7,  stop: 'ti-joana-bezerra', counts: { empty: 19, mid: 3,  full: 0 },  via: ['Rua das Acácias', 'Escola Estadual', 'Mercado Público'] },
    { line: '412', name: 'Boa Vista',        direction: 'Centro', minutes: 12, stop: 'boa-vista',        counts: { empty: 3,  mid: 12, full: 4 },  via: ['Rua da Aurora', 'Ponte Princesa Isabel', 'Praça da República'] },
    { line: '518', name: 'Derby',            direction: 'Centro', minutes: 18, stop: 'derby',            counts: { empty: 2,  mid: 9,  full: 3 },  via: ['Av. Conde da Boa Vista', 'Praça Maciel Pinheiro', 'Mercado de São José'], color: '#8e44ad' },
    { line: '623', name: 'Boa Viagem',       direction: 'Centro', minutes: 25, stop: 'boa-viagem',       counts: { empty: 8,  mid: 2,  full: 0 },  via: ['Av. Domingos Ferreira', 'Pina', 'Ponte Paulo Guerra'], color: '#16a085' },
  ];
  const HOME_COUNT = 3;
  const NEAR_MINUTES = 10;
  const TICK_MS = 60_000;
  const FAV_KEY = 'painel:linhas-favoritas';
  const STATUS_CLASS = { Cheio: 'full', Moderado: 'mid', Vazio: 'empty' };

  // ---------- Utilitários ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const normalize = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const debounce = (fn, delay = 200) => {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); };
  };
  const el = (tag, className, text) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const favorites = (() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []); } catch { return new Set(); }
  })();
  const saveFavorites = () => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); } catch { /* segue sem persistir */ }
  };

  // ---------- Relatos de lotação (o voto do usuário fica no navegador) ----------
  const VOTES_KEY = 'painel:relatos';
  const votes = (() => {
    try { return JSON.parse(localStorage.getItem(VOTES_KEY)) || {}; } catch { return {}; }
  })();
  const saveVotes = () => {
    try { localStorage.setItem(VOTES_KEY, JSON.stringify(votes)); } catch { /* segue sem persistir */ }
  };
  const countsFor = (bus) => {
    const c = { ...bus.counts };
    if (votes[bus.line] in c) c[votes[bus.line]] += 1;
    return c;
  };
  const statusFor = (c) => (c.full >= c.mid && c.full >= c.empty ? 'Cheio' : c.mid >= c.empty ? 'Moderado' : 'Vazio');
  function refreshBus(bus) {
    const c = countsFor(bus);
    bus.status = statusFor(c);
    bus.reports = c.empty + c.mid + c.full;
  }

  // ---------- Estado e elementos ----------
  const state = { buses: BUSES.map((b) => ({ ...b })), qHome: '', qLines: '', filter: 'all' };
  state.buses.forEach(refreshBus);
  const viewHome = $('#view-home');
  const viewLines = $('#view-lines');
  const listHome = $('#list-home');
  const listLines = $('#list-lines');
  const matches = (b, q) => {
    const n = normalize(q);
    return !n || [b.line, b.name, b.direction].some((v) => normalize(v).includes(n));
  };
  const formatTime = (min) => (min <= 0 ? 'Chegando ›' : `${min} min ›`);

  // ---------- Saudação ----------
  function renderGreeting() {
    const h = new Date().getHours();
    const greet = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    const user = Auth.currentUser();
    const first = user && user.name ? user.name.split(' ')[0] : 'usuário';
    $('.user-info h1').textContent = `${greet}, ${first}!`;
  }

  // ---------- Cards ----------
  function buildItem(bus, theme) {
    const item = el('div', `bus-item ${theme}`);
    item.tabIndex = 0;
    item.setAttribute('role', 'link');
    item.setAttribute('aria-label', `Linha ${bus.line}, ${bus.name}, ${formatTime(bus.minutes)}, ${bus.status}`);

    const badge = el('div', `bus-number badge-${bus.line}`, bus.line);
    if (bus.color) badge.style.background = bus.color;

    const details = el('div', 'bus-details');
    details.append(el('strong', '', bus.name), el('span', '', `Direção: ${bus.direction}`));
    if (theme === 'dark') details.append(el('span', '', `Relatos: ${bus.reports}`));

    const time = el('div', 'bus-time', formatTime(bus.minutes));
    time.dataset.line = bus.line;

    const pill = el('span', `pill ${STATUS_CLASS[bus.status]}`);
    pill.append(el('i', 'fa-solid fa-bus'), ` ${bus.status}`);

    const top = el('div', 'bus-row');
    if (theme === 'light') top.append(buildFav(bus));
    top.append(time);

    const side = el('div', 'bus-side');
    side.append(top, pill);
    item.append(badge, details, side);

    const go = () => { window.location.href = `#linha?linha=${encodeURIComponent(bus.line)}`; };
    item.addEventListener('click', go);
    item.addEventListener('keydown', (e) => {
      if (e.target === item && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(); }
    });
    return item;
  }

  function buildFav(bus) {
    const btn = el('button', 'fav');
    btn.type = 'button';
    const paint = () => {
      const on = favorites.has(bus.line);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? `Remover linha ${bus.line} dos favoritos` : `Favoritar linha ${bus.line}`);
      btn.replaceChildren(el('i', `${on ? 'fa-solid' : 'fa-regular'} fa-star`));
    };
    paint();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      favorites.has(bus.line) ? favorites.delete(bus.line) : favorites.add(bus.line);
      saveFavorites();
      state.filter === 'fav' ? renderLines() : paint();
    });
    return btn;
  }

  // ---------- Listas ----------
  function fill(list, items, theme, emptyText) {
    list.replaceChildren();
    if (!items.length) return list.append(el('p', 'bus-empty', emptyText));
    items.forEach((b) => list.append(buildItem(b, theme)));
  }

  function renderHome() {
    const searching = state.qHome.trim() !== '';
    const found = state.buses.filter((b) => matches(b, state.qHome));
    fill(listHome, searching ? found : found.slice(0, HOME_COUNT), 'dark',
      'Nenhuma linha encontrada. Pressione Enter para buscar no mapa.');
  }

  function renderLines() {
    let items = state.buses.filter((b) => matches(b, state.qLines));
    if (state.filter === 'near') items = items.filter((b) => b.minutes <= NEAR_MINUTES);
    if (state.filter === 'fav') items = items.filter((b) => favorites.has(b.line));
    fill(listLines, items, 'light',
      state.filter === 'fav' ? 'Você ainda não tem linhas favoritas.' : 'Nenhuma linha encontrada.');
  }

  function tick() {
    state.buses.forEach((b) => {
      b.minutes -= 1;
      if (b.minutes < 0) b.minutes = 15 + Math.floor(Math.random() * 15);
    });
    state.buses.forEach((b) => {
      document.querySelectorAll(`.bus-time[data-line="${b.line}"]`).forEach((t) => (t.textContent = formatTime(b.minutes)));
      document.querySelectorAll(`.bd-eta-time[data-line="${b.line}"]`).forEach((t) => (t.textContent = formatEta(b.minutes)));
    });
  }

  // ---------- Tela da linha (#linha?linha=201) ----------
  const viewBus = $('#screen-bus');
  const NOTES = { full: 'Ainda há espaço para ficar em pé', mid: 'Há assentos e espaço em pé', empty: 'Há muitos assentos disponíveis' };
  const LEVEL = { full: 4, mid: 3, empty: 1 };
  const REPORT_OPTIONS = [['empty', 'Vazio'], ['mid', 'Moderado'], ['full', 'Cheio']];
  const formatEta = (min) => (min <= 0 ? 'Chegando' : `${min} min`);
  const people = (n) => `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`;

  // lembra se o usuário veio de #inicio ou #linhas, para o botão Voltar
  let cameFrom = '#linhas';
  window.addEventListener('hashchange', (e) => {
    const old = e.oldURL.includes('#') ? '#' + e.oldURL.split('#')[1].split('?')[0] : '';
    if (old === '#inicio' || old === '#linhas') cameFrom = old;
  });

  function renderBus(bus, focusSelector) {
    const c = countsFor(bus);
    const total = c.empty + c.mid + c.full;
    const cls = STATUS_CLASS[bus.status];
    const mine = votes[bus.line];
    const isFav = favorites.has(bus.line);
    const stops = [bus.name, ...bus.via, 'Centro'];
    const badgeStyle = bus.color ? ` style="background:${bus.color}"` : '';

    viewBus.innerHTML = `
      <header class="bd-top">
        <div class="bd-top-left">
          <a class="bd-back" href="${cameFrom}" aria-label="Voltar"><i class="fa-solid fa-arrow-left"></i></a>
          <h1>Linha ${bus.line}</h1>
        </div>
        <button type="button" class="bd-fav" id="bd-fav" aria-pressed="${isFav}" aria-label="${isFav ? 'Remover dos favoritos' : 'Favoritar linha'}">
          <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-star"></i>
        </button>
      </header>

      <section class="bd-card">
        <div class="bd-badge badge-${bus.line}"${badgeStyle}>${bus.line}</div>
        <div class="bd-info">
          <span class="bd-name">${bus.name}</span>
          <span class="bd-dir">Direção: ${bus.direction}</span>
          <span class="bd-chip ${cls}"><i class="fa-solid fa-user-group"></i> ${bus.status}</span>
        </div>
        <div class="bd-eta"><span class="bd-eta-time" data-line="${bus.line}">${formatEta(bus.minutes)}</span><i class="fa-solid fa-chevron-right"></i></div>
      </section>

      <h2 class="bd-title">Ocupação de ônibus</h2>
      <div class="bd-meter ${cls}" role="img" aria-label="Ocupação: ${LEVEL[cls]} de 5 níveis">
        ${[0, 1, 2, 3, 4].map((i) => `<span class="${i < LEVEL[cls] ? '' : 'off'}"></span>`).join('')}
      </div>
      <p class="bd-note"><i class="fa-solid fa-user"></i> ${NOTES[cls]}</p>

      <section class="bd-report" aria-labelledby="bd-rep-title">
        <h2 id="bd-rep-title">Reportar lotação</h2>
        <p>Ajude outros passageiros: como está o ônibus agora?</p>
        <div class="bd-options">
          ${REPORT_OPTIONS.map(([key, label]) => `
            <button type="button" class="bd-rbtn ${key}" data-key="${key}" aria-pressed="${mine === key}">
              <span class="bd-label"><span class="bd-dot"></span>${label}</span>
              <span class="bd-count">${people(c[key])}</span>
            </button>`).join('')}
        </div>
        <div class="bd-total">${total} ${total === 1 ? 'pessoa reportou' : 'pessoas reportaram'} nos últimos 15 min</div>
        ${mine ? '<p class="bd-thanks" role="status">Obrigado por ajudar! Toque de novo no mesmo botão para desfazer.</p>' : ''}
      </section>

      <h2 class="bd-route-title">Itinerário</h2>
      <ol class="bd-route">
        ${stops.map((name, i) => {
          const end = i === 0 || i === stops.length - 1;
          const tag = i === 0 ? '<span class="bd-tag">Início</span>' : i === stops.length - 1 ? '<span class="bd-tag">Fim</span>' : '';
          return `<li class="bd-stop${end ? ' end' : ''}"><span class="bd-pin"></span>${name}${tag}</li>`;
        }).join('')}
      </ol>

      <a class="bd-map" href="#mapa?parada=${encodeURIComponent(bus.stop)}&linha=${encodeURIComponent(bus.line)}">
        <i class="fa-solid fa-map"></i> Ver no mapa
      </a>`;

    $('#bd-fav', viewBus).addEventListener('click', () => {
      favorites.has(bus.line) ? favorites.delete(bus.line) : favorites.add(bus.line);
      saveFavorites();
      renderLines();
      renderBus(bus, '#bd-fav');
    });

    viewBus.querySelectorAll('.bd-rbtn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (votes[bus.line] === key) delete votes[bus.line];
        else votes[bus.line] = key;
        saveVotes();
        refreshBus(bus);
        renderHome();
        renderLines();
        renderBus(bus, `.bd-rbtn[data-key="${key}"]`);
      });
    });

    if (focusSelector) viewBus.querySelector(focusSelector)?.focus();
  }

  window.addEventListener('painel:route', (e) => {
    if (e.detail.name !== 'linha') return;
    const line = new URLSearchParams(e.detail.query).get('linha');
    const bus = state.buses.find((b) => b.line === line);
    if (!bus) { location.replace('#linhas'); return; }
    renderBus(bus);
  });

  // ---------- Navegação entre as duas telas ----------
  function setFilter(f) {
    state.filter = f;
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.f === f)));
    renderLines();
  }

  function route() {
    const [name, query = ''] = location.hash.slice(1).split('?');
    const lines = name === 'linhas';
    viewHome.hidden = lines;
    viewLines.hidden = !lines;
    if (lines && new URLSearchParams(query).get('filtro') === 'fav') setFilter('fav');
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- Eventos ----------
  const onHomeSearch = debounce((v) => { state.qHome = v; renderHome(); });
  const onLinesSearch = debounce((v) => { state.qLines = v; renderLines(); });
  $('#q-home').addEventListener('input', (e) => onHomeSearch(e.target.value));
  $('#q-lines').addEventListener('input', (e) => onLinesSearch(e.target.value));
  $('#q-home').addEventListener('keydown', (e) => {
    const q = e.target.value.trim();
    if (e.key === 'Enter' && q) window.location.href = `#mapa?q=${encodeURIComponent(q)}`;
  });

  $('#chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    setFilter(chip.dataset.f);
  });

  $('#logout-btn').addEventListener('click', () => Auth.logout());

  // ---------- Init ----------
  window.addEventListener('painel:route', renderGreeting);
  renderGreeting();
  renderHome();
  renderLines();
  route();
  setInterval(tick, TICK_MS);
})();

    
