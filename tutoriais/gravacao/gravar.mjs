// Grava um tutorial: node gravar.mjs <roteiro.mjs> <pasta-de-saida> [--sem-narracao]
// O roteiro exporta TEMA, NOME, POSTER_NO_SEGUNDO, roteiro(gravacao) e, opcionalmente, PRONUNCIA (trocas só na fala).
// As falas (legendas) são narradas por voz neural; o áudio de cada uma fica em cache em <pasta-de-saida>/.narracao.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { iniciarGravacao } from './gravador.mjs';
import { criarNarrador, extrairFalas } from './narrador.mjs';

const [, , caminhoDoRoteiro, pasta, opcao] = process.argv;
if (!caminhoDoRoteiro || !pasta) {
  console.error('Uso: node gravar.mjs <roteiro.mjs> <pasta-de-saida> [--sem-narracao]');
  process.exit(2);
}

const { TEMA, NOME, POSTER_NO_SEGUNDO, PRONUNCIA = [], roteiro } = await import(pathToFileURL(resolve(caminhoDoRoteiro)).href);
const narrador = opcao === '--sem-narracao' ? null : await criarNarrador({
  falas: extrairFalas(readFileSync(caminhoDoRoteiro, 'utf8')),
  pasta: join(resolve(pasta), '.narracao'),
  pronuncia: PRONUNCIA,
});

const gravacao = await iniciarGravacao({ tema: TEMA, narrador });
try {
  await roteiro(gravacao);
} catch (erro) {
  await gravacao.navegador.close();
  throw erro;
}
const { duracaoEmSegundos } = await gravacao.salvar({ pasta: resolve(pasta), nome: NOME, posterNoSegundo: POSTER_NO_SEGUNDO });
console.log(`${NOME}: ${duracaoEmSegundos.toFixed(1)} s em ${resolve(pasta)}`);
