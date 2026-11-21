// Monta o HTML dos capítulos e da transcrição a partir das legendas: node montar-secao.mjs <pasta> <nome> <caminho-no-site>
// Imprime os trechos para colar na seção Tutorial da landing page.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , pasta, nome] = process.argv;

function lerVtt(arquivo) {
  return readFileSync(arquivo, 'utf8').split(/\r?\n\r?\n/).slice(1).filter(Boolean).map((bloco) => {
    const [, tempos, ...texto] = bloco.split(/\r?\n/);
    const [inicio, fim] = tempos.split(' --> ').map(segundos);
    return { inicio, fim, texto: texto.join(' ').trim() };
  });
}

function segundos(tempo) {
  const [hh, mm, ss] = tempo.split(':');
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

const relogio = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const escapar = (texto) => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const capitulos = lerVtt(join(pasta, `${nome}-capitulos.vtt`));
const legendas = lerVtt(join(pasta, `${nome}.vtt`));

console.log('<!-- capítulos -->');
for (const { inicio, texto } of capitulos) {
  console.log(`<li><button type="button" data-tempo="${inicio.toFixed(1)}"><span class="tutorial__tempo">${relogio(inicio)}</span> ${escapar(texto)}</button></li>`);
}
console.log('\n<!-- transcrição -->');
for (const capitulo of capitulos) {
  const falas = legendas.filter(({ inicio }) => inicio >= capitulo.inicio - 0.05 && inicio < capitulo.fim - 0.05).map(({ texto }) => escapar(texto));
  if (falas.length === 0) continue;
  console.log(`<h4>${escapar(capitulo.texto)}</h4>\n<p>${falas.join(' ')}</p>`);
}
console.log(`\n<!-- duração: ${relogio(capitulos.at(-1).fim)} -->`);
