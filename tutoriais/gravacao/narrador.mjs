// Narração dos tutoriais: transforma cada fala do roteiro em áudio com uma voz neural (edge-tts) antes da gravação,
// para o vídeo não ficar parado esperando a síntese. Os áudios ficam numa pasta de cache, um por fala.
//
// Requisitos: Python com o pacote edge-tts (python -m pip install --user edge-tts). O texto das falas vai para o
// serviço de voz da Microsoft; por isso as falas são só o texto do roteiro, nunca dados de alguém.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PYTHON = process.env.PYTHON ?? 'python';
const FFPROBE = process.env.FFPROBE ?? (process.env.FFMPEG ? process.env.FFMPEG.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1') : 'ffprobe');
const SINTESES_AO_MESMO_TEMPO = 4;

/** Símbolos que aparecem na legenda mas não devem ser lidos como estão. */
const LEITURA_PADRAO = [[/\s*☰/g, ''], [/\+ de /g, 'mais de '], [/…/g, '.']];

function rodar(comando, argumentos) {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(comando, argumentos, { stdio: ['ignore', 'ignore', 'pipe'] });
    let erro = '';
    processo.stderr.on('data', (parte) => { erro += parte; });
    processo.on('error', rejeitar);
    processo.on('close', (codigo) => (codigo === 0 ? resolver() : rejeitar(new Error(`${comando} falhou: ${erro}`))));
  });
}

function duracaoEmSegundos(arquivo) {
  const resultado = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', arquivo], { encoding: 'utf8' });
  const duracao = Number(resultado.stdout.trim());
  if (!Number.isFinite(duracao)) throw new Error(`Não deu para medir ${arquivo}: ${resultado.stderr}`);
  return duracao;
}

/**
 * @param {{ falas: string[], pasta: string, voz?: string, velocidade?: string, pronuncia?: Array<[RegExp|string, string]> }} opcoes
 * @returns {Promise<{ obter: (fala: string) => { arquivo: string, duracao: number } }>}
 */
export async function criarNarrador({ falas, pasta, voz = 'pt-BR-FranciscaNeural', velocidade = '+6%', pronuncia = [] }) {
  mkdirSync(pasta, { recursive: true });
  const leitura = [...LEITURA_PADRAO, ...pronuncia];
  const paraLer = (fala) => leitura.reduce((texto, [de, para]) => texto.replaceAll(de, para), fala).trim();
  const arquivoDe = (fala) => join(pasta, `${createHash('sha1').update(`${voz}|${velocidade}|${paraLer(fala)}`).digest('hex').slice(0, 16)}.mp3`);

  const pendentes = [...new Set(falas)].filter((fala) => !existsSync(arquivoDe(fala)));
  for (let i = 0; i < pendentes.length; i += SINTESES_AO_MESMO_TEMPO) {
    await Promise.all(pendentes.slice(i, i + SINTESES_AO_MESMO_TEMPO).map((fala) => rodar(PYTHON,
      ['-m', 'edge_tts', '--voice', voz, `--rate=${velocidade}`, '--text', paraLer(fala), '--write-media', arquivoDe(fala)])));
  }

  const audios = new Map(falas.map((fala) => [fala, { arquivo: arquivoDe(fala), duracao: duracaoEmSegundos(arquivoDe(fala)) }]));
  return {
    obter(fala) {
      const audio = audios.get(fala);
      if (!audio) throw new Error(`Fala fora do roteiro (não sintetizada): "${fala}"`);
      return audio;
    },
  };
}

/** As falas de um roteiro: todo texto passado a legenda('...') ou a fala: '...' (aspas simples). */
export function extrairFalas(codigoDoRoteiro) {
  return [...codigoDoRoteiro.matchAll(/(?:legenda\(|fala:\s*)'((?:[^'\\]|\\.)+)'/g)].map(([, fala]) => fala.replace(/\\'/g, "'"));
}
