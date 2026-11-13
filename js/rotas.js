'use strict';

/** Empty-Bus - navegação entre as telas (#login, #inicio, #linhas, #linha, #mapa, #config, #perfil) */
(() => {
  const screens = {
    login: document.getElementById('screen-login'),
    app: document.getElementById('screen-app'),
    map: document.getElementById('screen-map'),
    bus: document.getElementById('screen-bus'),
    config: document.getElementById('screen-config'),
    perfil: document.getElementById('screen-perfil'),
  };

  function route() {
    const [name, query = ''] = location.hash.slice(1).split('?');
    const user = Auth.currentUser();

    if (!user && name !== 'login') return location.replace('#login');
    if (user && !['inicio', 'linhas', 'linha', 'mapa', 'config', 'perfil'].includes(name)) return location.replace('#inicio');

    const current = { login: 'login', mapa: 'map', linha: 'bus', config: 'config', perfil: 'perfil' }[name] || 'app';
    Object.entries(screens).forEach(([key, node]) => (node.hidden = key !== current));
    document.title = { login: 'Entrar - Empty-Bus', mapa: 'Mapa de Linhas', linha: 'Linha - Empty-Bus', config: 'Configurações - Empty-Bus', perfil: 'Perfil - Empty-Bus' }[name] || 'Empty-Bus';
    window.dispatchEvent(new CustomEvent('painel:route', { detail: { name, query } }));
  }

  window.addEventListener('hashchange', route);
  route();
})();

    
