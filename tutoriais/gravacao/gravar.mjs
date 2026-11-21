// Grava um tutorial: node gravar.mjs <roteiro.mjs> <pasta-de-saida>
// O roteiro exporta TEMA, NOME, POSTER_NO_SEGUNDO e roteiro(gravacao).
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { iniciarGravacao } from './gravador.mjs';

const [, , caminhoDoRoteiro, pasta] = process.argv;
if (!caminhoDoRoteiro || !pasta) {
  console.error('Uso: node gravar.mjs <roteiro.mjs> <pasta-de-saida>');
  process.exit(2);
}

const { TEMA, NOME, POSTER_NO_SEGUNDO, roteiro } = await import(pathToFileURL(resolve(caminhoDoRoteiro)).href);
const gravacao = await iniciarGravacao({ tema: TEMA });
try {
  await roteiro(gravacao);
} catch (erro) {
  await gravacao.navegador.close();
  throw erro;
}
const { duracaoEmSegundos } = await gravacao.salvar({ pasta: resolve(pasta), nome: NOME, posterNoSegundo: POSTER_NO_SEGUNDO });
console.log(`${NOME}: ${duracaoEmSegundos.toFixed(1)} s em ${resolve(pasta)}`);
