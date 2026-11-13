# Empty-Bus

Protótipo web/mobile (largura máxima de 430 px) para acompanhar linhas de ônibus, ver a lotação em tempo real (simulada) e reportar a ocupação do veículo. Interface em português (BR), centrada no Recife-PE.

> Status: protótipo/demonstração. Todo o dado é mock e fica no navegador (`localStorage`). Veja [`error.md`](error.md) para os problemas já identificados.

## Funcionalidades

- **Login e cadastro** com validação, senha com PBKDF2 + salt e opção "Manter conectado".
- **Início:** saudação por horário, busca e os próximos ônibus com tempo de chegada e lotação (Vazio / Moderado / Cheio).
- **Linhas de ônibus:** busca, filtros (Todas / Mais próximos / Favoritos) e favoritar linhas.
- **Detalhe da linha:** ocupação, **reportar lotação**, itinerário e atalho para o mapa.
- **Mapa** (Leaflet + OpenStreetMap): paradas, popup, favoritos, geolocalização, camada ruas/satélite e busca.
- **Configurações e Perfil:** modo escuro, localização, nome, telefone, endereço padrão e foto.

## Estrutura

```
empty-bus/
├── index.html        # marcação de todas as telas
├── css/
│   └── style.css     # estilos
├── js/
│   ├── auth.js       # cadastro, login e sessão (objeto global Auth)
│   ├── login.js      # tela #login
│   ├── linhas.js     # telas #inicio, #linhas e #linha
│   ├── mapa.js       # tela #mapa (Leaflet)
│   ├── config.js     # telas #config e #perfil
│   └── rotas.js      # roteador por hash entre as telas
├── error.md          # erros e problemas encontrados na revisão
└── README.md
```

A **ordem dos scripts** em `index.html` importa e foi mantida: `auth.js` → Leaflet (CDN) → `login.js` → `linhas.js` → `mapa.js` → `config.js` → `rotas.js`.

## Rotas (hash)

| Rota | Tela |
|------|------|
| `#login` | Entrar / Cadastrar |
| `#inicio` | Próximos ônibus |
| `#linhas` (`?filtro=fav`) | Linhas de ônibus |
| `#linha?linha=201` | Detalhe da linha e reportar lotação |
| `#mapa` (`?q=`, `?linha=`, `?parada=`) | Mapa |
| `#config` | Configurações |
| `#perfil` | Perfil |

## Como executar

Não precisa instalar nada, mas **use um servidor local** em vez de abrir o arquivo direto (`file:///`): o mapa, a geolocalização e a Web Crypto funcionam melhor em `localhost`/HTTPS.

```bash
cd empty-bus
python -m http.server 8000
# abra http://localhost:8000
```

Requer internet para carregar Leaflet, Font Awesome, Google Fonts e os tiles do mapa (CDNs).

## Dados salvos no navegador

| Chave | Conteúdo |
|-------|----------|
| `painel:usuarios` | usuários cadastrados (com hash da senha) |
| `painel:sessao` | sessão atual (`sessionStorage` ou `localStorage`) |
| `painel:perfil:<id>` | telefone, endereço e foto do usuário |
| `painel:linhas-favoritas` | linhas favoritas |
| `painel:favoritos` | paradas favoritas |
| `painel:relatos` | voto de lotação do usuário por linha |
| `painel:tema` / `painel:localizacao` | preferências de tema e localização |

## Observações

- A autenticação é apenas client-side e **não oferece segurança real**; para produção é necessário um backend (trocar `Auth.register()/login()` por chamadas à API).
- Para usar dados reais, substitua `BUSES` (`js/linhas.js`) e `STOPS` (`js/mapa.js`) por chamadas `fetch()`.
- Nesta etapa o conteúdo **não foi modificado**: os arquivos foram apenas separados e revisados. As correções ficam para uma próxima etapa, guiadas por `error.md`.

## Dependências externas (CDN)

- [Leaflet 1.9.4](https://leafletjs.com/) e tiles do OpenStreetMap / Esri
- [Font Awesome 6.4.0](https://fontawesome.com/)
- [Google Fonts — Inter](https://fonts.google.com/specimen/Inter)
