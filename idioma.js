// Idioma do site: português do Brasil (o texto do próprio HTML), espanhol da Espanha e inglês dos EUA.
//   data-i18n="chave"         troca o conteúdo do elemento pelo texto da chave
//   data-i18n-attr="attr:chave;attr:chave"  troca atributos (aria-label, content, alt...)
//   data-idioma-bloco="es-ES" mostra o bloco só nesse idioma (textos longos, como os documentos legais)
// O português fica guardado ao carregar, então voltar para ele não precisa de dicionário.
import { TEXTOS } from './textos.js';

const PORTUGUES = 'pt-BR';
const IDIOMAS = Object.freeze([PORTUGUES, 'es-ES', 'en-US']);
const CHAVE_DA_PREFERENCIA = 'gradua:idioma';

/** Nome de cada idioma escrito nele mesmo: é assim que a pessoa o reconhece. */
const NOME_DO_IDIOMA = Object.freeze({ 'pt-BR': 'Português (Brasil)', 'es-ES': 'Español (España)', 'en-US': 'English (US)' });
const ROTULO_DO_SELETOR = Object.freeze({ 'pt-BR': 'Idioma', 'es-ES': 'Idioma', 'en-US': 'Language' });

// Bandeiras simplificadas (3:2), desenhadas aqui porque emojis de bandeira não aparecem em todo aparelho.
const BANDEIRA = Object.freeze({
  'pt-BR': '<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5 27.5 10 15 17.5 2.5 10z" fill="#ffdf00"/><circle cx="15" cy="10" r="4.6" fill="#002776"/><path d="M10.6 9.1c3-.9 6.1-.6 8.8.9" stroke="#fff" stroke-width=".9" fill="none"/>',
  'es-ES': '<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>',
  'en-US': '<rect width="30" height="20" fill="#fff"/><path d="M0 0h30M0 3.08h30M0 6.15h30M0 9.23h30M0 12.3h30M0 15.38h30M0 18.46h30" stroke="#b22234" stroke-width="1.54" transform="translate(0 .77)"/><rect width="13" height="10.77" fill="#3c3b6e"/><g fill="#fff"><circle cx="2.2" cy="2" r=".7"/><circle cx="6.5" cy="2" r=".7"/><circle cx="10.8" cy="2" r=".7"/><circle cx="4.3" cy="4.2" r=".7"/><circle cx="8.6" cy="4.2" r=".7"/><circle cx="2.2" cy="6.4" r=".7"/><circle cx="6.5" cy="6.4" r=".7"/><circle cx="10.8" cy="6.4" r=".7"/><circle cx="4.3" cy="8.6" r=".7"/><circle cx="8.6" cy="8.6" r=".7"/></g>',
});

const bandeira = (idioma) => `<svg class="bandeira" viewBox="0 0 30 20" aria-hidden="true" focusable="false">${BANDEIRA[idioma]}</svg>`;

function lerPreferencia() {
  try {
    return localStorage.getItem(CHAVE_DA_PREFERENCIA);
  } catch {
    return null;
  }
}

function gravarPreferencia(idioma) {
  try {
    localStorage.setItem(CHAVE_DA_PREFERENCIA, idioma);
  } catch {
    // Sem armazenamento (aba anônima, por exemplo): o idioma vale só nesta visita.
  }
}

/** Escolha salva; senão, o idioma do navegador; senão, português. */
function idiomaInicial() {
  const salvo = lerPreferencia();
  if (IDIOMAS.includes(salvo)) return salvo;
  const doNavegador = (navigator.language || '').toLowerCase();
  if (doNavegador.startsWith('es')) return 'es-ES';
  if (doNavegador.startsWith('en')) return 'en-US';
  return PORTUGUES;
}

function lerAtributosTraduziveis(elemento) {
  return elemento.dataset.i18nAttr.split(';').map((par) => par.split(':').map((parte) => parte.trim()));
}

/** Guarda o português de cada texto e atributo marcado, para poder voltar a ele. */
function guardarPortugues() {
  for (const elemento of document.querySelectorAll('[data-i18n]')) elemento.dataset.i18nPt = elemento.innerHTML;
  for (const elemento of document.querySelectorAll('[data-i18n-attr]')) {
    for (const [atributo] of lerAtributosTraduziveis(elemento)) {
      elemento.setAttribute(`data-i18n-pt-${atributo}`, elemento.getAttribute(atributo) ?? '');
    }
  }
}

function texto(idioma, chave, portugues) {
  if (idioma === PORTUGUES) return portugues;
  const traducao = TEXTOS[idioma]?.[chave];
  if (traducao === undefined) console.warn(`Sem tradução para "${chave}" em ${idioma}`);
  return traducao ?? portugues;
}

function aplicarIdioma(idioma) {
  document.documentElement.lang = idioma;
  for (const elemento of document.querySelectorAll('[data-i18n]')) {
    elemento.innerHTML = texto(idioma, elemento.dataset.i18n, elemento.dataset.i18nPt);
  }
  for (const elemento of document.querySelectorAll('[data-i18n-attr]')) {
    for (const [atributo, chave] of lerAtributosTraduziveis(elemento)) {
      elemento.setAttribute(atributo, texto(idioma, chave, elemento.getAttribute(`data-i18n-pt-${atributo}`)));
    }
  }
  for (const bloco of document.querySelectorAll('[data-idioma-bloco]')) bloco.hidden = bloco.dataset.idiomaBloco !== idioma;
}

/** Botão com a bandeira atual que abre a lista só de bandeiras. Fecha ao escolher, ao tocar fora ou com Esc. */
function montarSeletor(container, idiomaAtual, aoEscolher) {
  container.innerHTML = `
    <button type="button" class="botao-idioma" aria-haspopup="true" aria-expanded="false" aria-controls="lista-de-idiomas"></button>
    <ul class="lista-de-idiomas" id="lista-de-idiomas" hidden>
      ${IDIOMAS.map((idioma) => `
        <li><button type="button" class="opcao-idioma" data-idioma="${idioma}" lang="${idioma}" aria-label="${NOME_DO_IDIOMA[idioma]}">${bandeira(idioma)}</button></li>`).join('')}
    </ul>`;
  const botao = container.querySelector('.botao-idioma');
  const lista = container.querySelector('.lista-de-idiomas');

  function abrir() {
    lista.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    lista.querySelector('[aria-current]')?.focus();
  }

  function fechar({ devolverFoco = false } = {}) {
    lista.hidden = true;
    botao.setAttribute('aria-expanded', 'false');
    if (devolverFoco) botao.focus();
  }

  function marcar(idioma) {
    botao.innerHTML = bandeira(idioma);
    botao.setAttribute('aria-label', `${ROTULO_DO_SELETOR[idioma]}: ${NOME_DO_IDIOMA[idioma]}`);
    for (const opcao of lista.querySelectorAll('[data-idioma]')) opcao.toggleAttribute('aria-current', opcao.dataset.idioma === idioma);
  }

  botao.addEventListener('click', () => (lista.hidden ? abrir() : fechar()));
  lista.addEventListener('click', (evento) => {
    const opcao = evento.target.closest('[data-idioma]');
    if (!opcao) return;
    fechar({ devolverFoco: true });
    marcar(opcao.dataset.idioma);
    aoEscolher(opcao.dataset.idioma);
  });
  document.addEventListener('click', (evento) => {
    if (!lista.hidden && !container.contains(evento.target)) fechar();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !lista.hidden) fechar({ devolverFoco: true });
  });
  marcar(idiomaAtual);
}

guardarPortugues();
const idioma = idiomaInicial();
aplicarIdioma(idioma);
for (const container of document.querySelectorAll('[data-seletor-de-idioma]')) {
  montarSeletor(container, idioma, (escolhido) => {
    gravarPreferencia(escolhido);
    aplicarIdioma(escolhido);
  });
}
