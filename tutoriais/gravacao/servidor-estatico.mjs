// Servidor estático para a gravação: node servidor-estatico.mjs <pasta> <porta>
// Caminho desconhecido sem extensão cai no index.html, como num app de página única.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const [pasta, porta] = process.argv.slice(2);
const RAIZ = resolve(pasta);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt; charset=utf-8',
};

async function ler(caminho) {
  const alvo = normalize(join(RAIZ, caminho));
  if (!alvo.startsWith(RAIZ)) return undefined;
  try {
    return { conteudo: await readFile(alvo), tipo: TIPOS[extname(alvo)] ?? 'application/octet-stream' };
  } catch {
    return undefined;
  }
}

createServer(async (pedido, resposta) => {
  const caminho = decodeURIComponent(new URL(pedido.url, 'http://local').pathname);
  const arquivo = (await ler(caminho.endsWith('/') ? `${caminho}index.html` : caminho))
    ?? (extname(caminho) ? undefined : await ler('/index.html'));
  if (!arquivo) {
    resposta.writeHead(404);
    resposta.end();
    return;
  }
  // Pedido de um trecho (Range), como o navegador faz para pular para um ponto do vídeo.
  const trecho = /^bytes=(\d*)-(\d*)$/.exec(pedido.headers.range ?? '');
  const tamanho = arquivo.conteudo.length;
  if (trecho) {
    const inicio = trecho[1] ? Number(trecho[1]) : tamanho - Number(trecho[2]);
    const fim = trecho[1] && trecho[2] ? Math.min(Number(trecho[2]), tamanho - 1) : tamanho - 1;
    resposta.writeHead(206, { 'Content-Type': arquivo.tipo, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${inicio}-${fim}/${tamanho}`, 'Content-Length': fim - inicio + 1 });
    resposta.end(arquivo.conteudo.subarray(inicio, fim + 1));
    return;
  }
  resposta.writeHead(200, { 'Content-Type': arquivo.tipo, 'Accept-Ranges': 'bytes', 'Content-Length': tamanho });
  resposta.end(arquivo.conteudo);
}).listen(Number(porta), () => console.log(`Servindo ${RAIZ} em http://localhost:${porta}`));
