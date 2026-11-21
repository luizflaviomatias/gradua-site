# Gravação do tutorial

O vídeo da seção **Tutorial** (`../kimepro-tutorial.*`) sai destes scripts: o Playwright dirige o app web do KimePro
em modo demonstração, numa tela de celular, e o screencast do navegador vira MP4 (H.264 + AAC), WebM (VP9 + Opus),
poster e as legendas WebVTT (falas e capítulos). Cada legenda é narrada por voz neural feminina
(`pt-BR-FranciscaNeural`, via edge-tts), e a cena seguinte só começa quando a fala termina.

| Arquivo | O que faz |
| --- | --- |
| `gravador.mjs` | Abre o navegador, captura a tela, mostra o toque, cartelas, legendas, capítulos e o tempo das falas; gera os arquivos com o ffmpeg |
| `narrador.mjs` | Transforma as falas do roteiro em áudio antes de gravar (com cache) e mede a duração de cada uma |
| `roteiro-kimepro.mjs` | O roteiro: entrada sem senha, Evolua, Ensine e Administre; `PRONUNCIA` ajusta como a voz lê nomes |
| `gravar.mjs` | Roda um roteiro: `node gravar.mjs <roteiro> <pasta-de-saida> [--sem-narracao]` |
| `servidor-estatico.mjs` | Serve o app web exportado (com tipos de vídeo e de legenda e pedidos parciais) |
| `montar-secao.mjs` | Gera o HTML dos capítulos e da transcrição a partir das legendas |

## Regravar

Requisitos: Node, ffmpeg (`winget install Gyan.FFmpeg`), Microsoft Edge, Python com `edge-tts`
(`python -m pip install --user edge-tts`) e o repositório `kimepro-app` ao lado (o `playwright-core` vem dele).
O texto das falas vai para o serviço de voz da Microsoft: escreva no roteiro só texto do tutorial, nunca dados de alguém.

```bash
# 1. App web em modo demonstração (sem Supabase: qualquer e-mail, código 123456)
cd ../../../kimepro-app/apps/mobile
EXPO_PUBLIC_SUPABASE_URL= EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY= npx expo export --platform web --output-dir /tmp/kimepro-web
node ../../../kimepro-site/tutoriais/gravacao/servidor-estatico.mjs /tmp/kimepro-web 8099 &

# 2. Grava (FFMPEG e PLAYWRIGHT_CORE só se não estiverem no lugar padrão)
cd ../../../kimepro-site/tutoriais/gravacao
FFMPEG=ffmpeg PLAYWRIGHT_CORE=../../../kimepro-app/node_modules/playwright-core/index.mjs node gravar.mjs roteiro-kimepro.mjs ..

# 3. Capítulos e transcrição para colar na seção #tutorial do index.html
node montar-secao.mjs .. kimepro-tutorial
```

O cache das falas fica em `../.narracao/`: apague-o antes do commit. Os horários dos capítulos (`data-tempo`) no
`index.html` mudam a cada gravação: atualize-os com a saída do passo 3.
