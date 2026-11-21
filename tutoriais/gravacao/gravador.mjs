// Gravador de tutoriais: dirige o app web num navegador com tela de celular, captura a tela quadro a quadro
// (screencast do DevTools, mais nítido que o recordVideo) e gera MP4 (H.264), WebM (VP9), poster e legendas WebVTT.
//
// Variáveis de ambiente:
//   PLAYWRIGHT_CORE  caminho do index.mjs do playwright-core (padrão: o do kimepro-app)
//   FFMPEG           executável do ffmpeg (padrão: "ffmpeg" no PATH)
//   E2E_NAVEGADOR    canal do navegador instalado (padrão: "msedge")
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const CAMINHO_DO_PLAYWRIGHT = process.env.PLAYWRIGHT_CORE ?? 'C:/Projetos/kimepro-app/node_modules/playwright-core/index.mjs';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const CANAL = process.env.E2E_NAVEGADOR ?? 'msedge';

/** Tela de celular comum (CSS px); o vídeo sai com o dobro, para o texto ficar nítido. */
const TELA = Object.freeze({ largura: 390, altura: 844, densidade: 2 });
const QUADROS_POR_SEGUNDO = 30;

const segundosAgora = () => Date.now() / 1000;

function tempoVtt(segundos) {
  const ms = Math.max(0, Math.round(segundos * 1000));
  const hh = String(Math.floor(ms / 3_600_000)).padStart(2, '0');
  const mm = String(Math.floor(ms / 60_000) % 60).padStart(2, '0');
  const ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}.${String(ms % 1000).padStart(3, '0')}`;
}

function montarVtt(trechos) {
  const blocos = trechos.map(({ inicio, fim, texto }, indice) => `${indice + 1}\n${tempoVtt(inicio)} --> ${tempoVtt(fim)}\n${texto}`);
  return `WEBVTT\n\n${blocos.join('\n\n')}\n`;
}

function rodarFfmpeg(argumentos) {
  const resultado = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...argumentos], { encoding: 'utf8' });
  if (resultado.status !== 0) throw new Error(`ffmpeg falhou: ${resultado.stderr || resultado.error}`);
}

/** Linha do tempo de um trecho com início e fim (legendas e capítulos). */
class Trilha {
  #trechos = [];
  #aberto = null;

  abrir(texto, agora) {
    this.fechar(agora);
    this.#aberto = { inicio: agora, texto };
  }

  fechar(agora) {
    if (!this.#aberto) return;
    this.#trechos.push({ ...this.#aberto, fim: agora });
    this.#aberto = null;
  }

  relativaA(origem) {
    return this.#trechos.map((trecho) => ({ ...trecho, inicio: trecho.inicio - origem, fim: trecho.fim - origem }));
  }
}

/**
 * Uma gravação: o roteiro usa legenda(), capitulo(), cartela(), tocar(), digitar() e pausa(); no fim, salvar().
 * @param {{ tema: { fundo: string, texto: string, destaque: string } }} opcoes
 */
export async function iniciarGravacao({ tema }) {
  const { chromium } = await import(pathToFileURL(CAMINHO_DO_PLAYWRIGHT).href);
  const navegador = await chromium.launch({ channel: CANAL });
  const contexto = await navegador.newContext({
    viewport: { width: TELA.largura, height: TELA.altura },
    deviceScaleFactor: TELA.densidade,
    isMobile: true,
    hasTouch: true,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    colorScheme: 'light',
    // Sem service worker: o app vem sempre do servidor local e as rotas do roteiro alcançam todos os pedidos.
    serviceWorkers: 'block',
  });
  const pagina = await contexto.newPage();
  return new Gravacao({ navegador, contexto, pagina, tema });
}

class Gravacao {
  #quadros = [];
  #legendas = new Trilha();
  #capitulos = new Trilha();
  #cdp = null;
  #tema;

  constructor({ navegador, contexto, pagina, tema }) {
    this.navegador = navegador;
    this.contexto = contexto;
    this.pagina = pagina;
    this.#tema = tema;
  }

  /** Começa a capturar a tela. Chame depois de abrir o app, para o vídeo não começar em branco. */
  async comecar() {
    this.#cdp = await this.contexto.newCDPSession(this.pagina);
    // O instante é o da chegada do quadro, no mesmo relógio das legendas (o do DevTools pode estar defasado).
    this.#cdp.on('Page.screencastFrame', ({ data, sessionId }) => {
      this.#quadros.push({ dados: data, instante: segundosAgora() });
      this.#cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await this.#cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 90,
      maxWidth: TELA.largura * TELA.densidade,
      maxHeight: TELA.altura * TELA.densidade,
    });
    await this.pausa(400);
  }

  legenda(texto) {
    this.#legendas.abrir(texto, segundosAgora());
  }

  semLegenda() {
    this.#legendas.fechar(segundosAgora());
  }

  capitulo(titulo) {
    this.#capitulos.abrir(titulo, segundosAgora());
  }

  pausa(ms) {
    return this.pagina.waitForTimeout(ms);
  }

  /** Cartela de tela cheia por cima do app (abertura, capítulo ou fechamento). */
  async cartela({ titulo, texto = '', ms = 2800 }) {
    await this.pagina.evaluate(({ titulo, texto, tema }) => {
      const cartela = document.createElement('div');
      cartela.id = '__cartela-do-tutorial';
      cartela.setAttribute('style', `position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:14px;padding:32px;text-align:center;background:${tema.fundo};
        color:${tema.texto};font-family:system-ui,'Segoe UI',Roboto,sans-serif;opacity:0;transition:opacity .35s`);
      const linha = `<div style="width:56px;height:4px;border-radius:2px;background:${tema.destaque}"></div>`;
      cartela.innerHTML = `${linha}<div style="font-size:30px;font-weight:800;line-height:1.15">${titulo}</div>
        <div style="font-size:18px;line-height:1.4;opacity:.85;max-width:300px">${texto}</div>`;
      document.body.appendChild(cartela);
      requestAnimationFrame(() => { cartela.style.opacity = '1'; });
    }, { titulo, texto, tema: this.#tema });
    await this.pausa(ms);
    await this.pagina.evaluate(() => {
      const cartela = document.getElementById('__cartela-do-tutorial');
      cartela.style.opacity = '0';
      setTimeout(() => cartela.remove(), 400);
    });
    await this.pausa(450);
  }

  /** Mostra um círculo onde o dedo toca e então clica, para quem assiste ver onde tocar. */
  async tocar(alvo, { depois = 900 } = {}) {
    await this.mostrar(alvo);
    const caixa = await alvo.boundingBox();
    if (caixa) await this.#mostrarToque(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await alvo.click();
    await this.pausa(depois);
  }

  /** Rola com suavidade até o alvo ficar no meio da tela, se ele ainda não estiver bem à vista. */
  async mostrar(alvo) {
    const caixa = await alvo.boundingBox();
    const margem = 90;
    if (caixa && caixa.y >= margem && caixa.y + caixa.height <= TELA.altura - margem) return;
    await alvo.evaluate((elemento) => elemento.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await this.pausa(800);
  }

  async digitar(alvo, texto, { depois = 600 } = {}) {
    await this.tocar(alvo, { depois: 250 });
    await alvo.fill('');
    await alvo.pressSequentially(texto, { delay: 70 });
    await this.pausa(depois);
  }

  /**
   * Para campos que não se digitam letra a letra (data, data e hora): mostra o toque e preenche de uma vez,
   * sem clicar, porque o clique abriria o seletor nativo do navegador, que não aparece na gravação.
   */
  async preencher(alvo, valor, { depois = 600 } = {}) {
    await this.#apontar(alvo);
    await alvo.fill(valor);
    await this.pausa(depois);
  }

  /** Escolhe uma opção numa lista (select), também sem abrir a lista nativa. */
  async escolher(alvo, opcao, { depois = 800 } = {}) {
    await this.#apontar(alvo);
    await alvo.selectOption(opcao);
    await this.pausa(depois);
  }

  async #apontar(alvo) {
    await this.mostrar(alvo);
    const caixa = await alvo.boundingBox();
    if (caixa) await this.#mostrarToque(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
  }

  async #mostrarToque(x, y) {
    await this.pagina.evaluate(({ x, y, cor }) => {
      const toque = document.createElement('div');
      toque.setAttribute('style', `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;
        background:${cor};opacity:.45;z-index:2147483646;pointer-events:none;transform:scale(.4);transition:transform .35s,opacity .6s`);
      document.body.appendChild(toque);
      requestAnimationFrame(() => { toque.style.transform = 'scale(1.1)'; });
      setTimeout(() => { toque.style.opacity = '0'; }, 380);
      setTimeout(() => toque.remove(), 1000);
    }, { x, y, cor: this.#tema.destaque });
    await this.pausa(380);
  }

  /**
   * Para a captura e grava <pasta>/<nome>.mp4, .webm, -poster.jpg, .vtt (legendas) e -capitulos.vtt.
   * @param {{ pasta: string, nome: string, posterNoSegundo: number }} destino
   */
  async salvar({ pasta, nome, posterNoSegundo }) {
    const fim = segundosAgora();
    this.#legendas.fechar(fim);
    this.#capitulos.fechar(fim);
    await this.#cdp.send('Page.stopScreencast');
    await this.navegador.close();
    if (this.#quadros.length === 0) throw new Error('Nenhum quadro capturado.');

    const origem = this.#quadros[0].instante;
    const temporaria = mkdtempSync(join(tmpdir(), 'tutorial-'));
    try {
      const lista = this.#quadros.map(({ dados, instante }, indice) => {
        const arquivo = join(temporaria, `q${String(indice).padStart(6, '0')}.jpg`).replace(/\\/g, '/');
        writeFileSync(arquivo, Buffer.from(dados, 'base64'));
        const proximo = this.#quadros[indice + 1]?.instante ?? fim;
        return `file '${arquivo}'\nduration ${Math.max(proximo - instante, 0.001).toFixed(4)}`;
      });
      const ultimo = lista.at(-1).split('\n')[0];
      const arquivoDaLista = join(temporaria, 'lista.txt');
      writeFileSync(arquivoDaLista, `${lista.join('\n')}\n${ultimo}\n`);

      mkdirSync(pasta, { recursive: true });
      const base = join(pasta, nome);
      const entrada = ['-f', 'concat', '-safe', '0', '-i', arquivoDaLista];
      // Os quadros JPEG vêm em faixa de cor "cheia" (pc); vídeo para a web precisa da faixa "tv", senão o Chrome e o
      // Edge não decodificam o WebM e alguns players mostram cores lavadas no MP4.
      const filtro = ['-vf', `fps=${QUADROS_POR_SEGUNDO},scale=720:-2:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p`,
        '-color_range', 'tv'];
      rodarFfmpeg([...entrada, ...filtro, '-c:v', 'libx264', '-preset', 'slow', '-crf', '27', '-tune', 'stillimage',
        '-movflags', '+faststart', '-an', `${base}.mp4`]);
      rodarFfmpeg([...entrada, ...filtro, '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1',
        '-deadline', 'good', '-an', `${base}.webm`]);
      rodarFfmpeg(['-ss', String(posterNoSegundo), '-i', `${base}.mp4`, '-frames:v', '1', '-q:v', '4', `${base}-poster.jpg`]);
    } finally {
      rmSync(temporaria, { recursive: true, force: true });
    }

    writeFileSync(join(pasta, `${nome}.vtt`), montarVtt(this.#legendas.relativaA(origem)));
    writeFileSync(join(pasta, `${nome}-capitulos.vtt`), montarVtt(this.#capitulos.relativaA(origem)));
    return { duracaoEmSegundos: fim - origem };
  }
}
