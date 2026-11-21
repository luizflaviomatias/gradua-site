// Formulário de inscrição das academias piloto. Envia para uma função do Supabase que valida, freia robôs e grava;
// o site não lê nada de volta. As mensagens ficam no HTML (traduzidas pelo idioma.js) e só são mostradas aqui.
import { SUPABASE } from './config.js';

const ERROS_CONHECIDOS = Object.freeze(['contato-invalido', 'muitas-inscricoes', 'consentimento-necessario']);
const ERRO_GERAL = 'geral';

const formulario = document.querySelector('[data-formulario-piloto]');

function inscricoesAbertas() {
  return Boolean(SUPABASE.url && SUPABASE.chavePublicavel);
}

function abrirInscricoes() {
  for (const elemento of document.querySelectorAll('[data-piloto-em-breve]')) elemento.hidden = true;
  for (const elemento of document.querySelectorAll('[data-piloto-aberto]')) elemento.hidden = false;
}

function mostrarSituacao(situacao) {
  for (const mensagem of formulario.querySelectorAll('[data-situacao]')) mensagem.hidden = mensagem.dataset.situacao !== situacao;
}

function lerInscricao(campos) {
  const alunos = campos.get('alunos');
  return {
    academia: campos.get('academia'),
    cidade: campos.get('cidade'),
    modalidades: campos.get('modalidades'),
    alunos: alunos === '' ? null : Number(alunos),
    responsavel: campos.get('responsavel'),
    contato: campos.get('contato'),
    idioma: document.documentElement.lang,
    consentiu: campos.get('consentimento') === 'sim',
  };
}

/** Devolve o código de erro da função (a mensagem da exceção no banco) ou undefined quando deu certo. */
async function enviar(inscricao) {
  const resposta = await fetch(`${SUPABASE.url}/rest/v1/rpc/inscrever_academia_piloto`, {
    method: 'POST',
    headers: { apikey: SUPABASE.chavePublicavel, 'Content-Type': 'application/json' },
    body: JSON.stringify(inscricao),
  });
  if (resposta.ok) return undefined;
  const erro = await resposta.json().catch(() => ({}));
  return ERROS_CONHECIDOS.includes(erro.message) ? erro.message : ERRO_GERAL;
}

async function aoEnviar(evento) {
  evento.preventDefault();
  const campos = new FormData(formulario);
  // Campo invisível para pessoas: só robôs o preenchem. Finge que deu certo e não envia.
  if (campos.get('site')) return mostrarSituacao('enviada');

  const botao = formulario.querySelector('[type="submit"]');
  botao.disabled = true;
  mostrarSituacao('enviando');
  try {
    const erro = await enviar(lerInscricao(campos));
    if (erro) return mostrarSituacao(erro);
    formulario.reset();
    mostrarSituacao('enviada');
  } catch {
    mostrarSituacao(ERRO_GERAL);
  } finally {
    botao.disabled = false;
  }
}

if (formulario && inscricoesAbertas()) {
  abrirInscricoes();
  formulario.addEventListener('submit', aoEnviar);
}
