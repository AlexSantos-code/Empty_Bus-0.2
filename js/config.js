'use strict';

/** Empty-Bus - telas Configurações (#config) e Perfil (#perfil) */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const THEME_KEY = 'painel:tema';
  const LOC_KEY = 'painel:localizacao';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  };

  // ---------- Toast ----------
  let toastTimer;
  function toast(message) {
    let t = $('#cf-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'cf-toast';
      t.setAttribute('role', 'status');
      t.style.cssText =
        'position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:#222;color:#fff;' +
        'padding:10px 16px;border-radius:20px;font-size:14px;z-index:3000;max-width:90%;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.style.display = 'none'), 2800);
  }

  document.querySelectorAll('[data-toast]').forEach((btn) =>
    btn.addEventListener('click', () => toast(btn.dataset.toast)));

  // ---------- Modo escuro e Localização ----------
  const dark = $('#cf-dark');
  const loc = $('#cf-loc');
  const applyTheme = (on) => { document.documentElement.dataset.tema = on ? 'escuro' : 'claro'; };

  const syncSwitches = () => {
    dark.checked = store.get(THEME_KEY) === 'escuro';
    loc.checked = store.get(LOC_KEY) !== '0';
  };
  syncSwitches();
  applyTheme(dark.checked);

  dark.addEventListener('change', () => {
    applyTheme(dark.checked);
    store.set(THEME_KEY, dark.checked ? 'escuro' : 'claro');
  });
  loc.addEventListener('change', () => {
    store.set(LOC_KEY, loc.checked ? '1' : '0');
    toast(loc.checked ? 'Localização ativada' : 'Localização desativada');
  });

  // ---------- Perfil ----------
  const profileKey = (u) => `painel:perfil:${u.id}`;
  const readProfile = (u) => {
    try { return JSON.parse(localStorage.getItem(profileKey(u))) || {}; } catch { return {}; }
  };
  const writeProfile = (u, p) => store.set(profileKey(u), JSON.stringify(p));

  const form = $('#perfil-form');
  const view = $('#perfil-view');
  const errBox = $('#pf-err');

  function renderProfile() {
    const user = Auth.currentUser();
    if (!user) return;
    const p = readProfile(user);
    $('#perfil-nome').textContent = user.name;
    $('#perfil-email').textContent = user.email;
    $('#pv-name').textContent = user.name;
    $('#pv-email').textContent = user.email;
    $('#pv-phone').textContent = p.phone || 'Adicionar telefone';
    $('#pv-address').textContent = p.address || 'Defina um endereço padrão';

    const img = $('#perfil-img');
    if (p.photo) img.src = p.photo;
    img.toggleAttribute('hidden', !p.photo);
    $('#perfil-icon').toggleAttribute('hidden', !!p.photo);
  }

  function setEditing(on, focusSel = '#pf-name') {
    view.hidden = on;
    form.hidden = !on;
    errBox.textContent = '';
    if (!on) return;
    const user = Auth.currentUser();
    if (!user) return;
    const p = readProfile(user);
    $('#pf-name').value = user.name;
    $('#pf-email').value = user.email;
    $('#pf-phone').value = p.phone || '';
    $('#pf-address').value = p.address || '';
    $(focusSel).focus();
  }

  view.querySelectorAll('[data-edit]').forEach((btn) =>
    btn.addEventListener('click', () => setEditing(true, `#pf-${btn.dataset.edit}`)));
  $('#perfil-edit').addEventListener('click', () => setEditing(true));
  $('#pf-cancel').addEventListener('click', () => setEditing(false));
  $('#perfil-bell').addEventListener('click', () => toast('Você não tem novas notificações'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = Auth.currentUser();
    if (!user) return;
    const fail = (msg, sel) => { errBox.textContent = msg; if (sel) $(sel).focus(); };

    const name = $('#pf-name').value.trim();
    const phone = $('#pf-phone').value.trim();
    const address = $('#pf-address').value.trim();
    const digits = phone.replace(/\D/g, '');

    if (name.length < 2) return fail('Informe seu nome (mínimo 2 letras).', '#pf-name');
    if (phone && (digits.length < 10 || digits.length > 11)) return fail('Telefone inválido. Use DDD + número.', '#pf-phone');

    const result = Auth.updateName(name);
    if (!result.ok) return fail(result.error, '#pf-name');
    if (!writeProfile(user, { ...readProfile(user), phone, address }))
      return fail('Não foi possível salvar neste navegador.');

    renderProfile();
    setEditing(false);
    toast('Perfil atualizado');
  });

  // ---------- Foto (reduzida para 256x256 e guardada no navegador) ----------
  $('#perfil-foto').addEventListener('click', () => $('#perfil-file').click());
  $('#perfil-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const SIZE = 256;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const side = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE);

      const user = Auth.currentUser();
      if (!user) return;
      const p = readProfile(user);
      p.photo = canvas.toDataURL('image/jpeg', 0.85);
      if (writeProfile(user, p)) { renderProfile(); toast('Foto atualizada'); }
      else toast('Não foi possível salvar a foto.');
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('Não foi possível ler a imagem.'); };
    img.src = url;
  });

  // ---------- Entrada nas telas ----------
  let prev = '';
  const routeName = (url) => (url.includes('#') ? url.split('#')[1].split('?')[0] : '');
  window.addEventListener('hashchange', (e) => { prev = routeName(e.oldURL); });

  window.addEventListener('painel:route', (e) => {
    if (e.detail.name === 'config') syncSwitches();
    if (e.detail.name === 'perfil') {
      $('#perfil-back').setAttribute('href', prev === 'config' ? '#config' : '#inicio');
      renderProfile();
      setEditing(false);
    }
  });
})();

    
