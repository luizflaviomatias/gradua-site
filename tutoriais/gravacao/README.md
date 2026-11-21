# Gravação do tutorial

O vídeo da seção **Tutorial** (`../kimepro-tutorial.*`) sai destes scripts: o Playwright dirige o app web do KimePro
em modo demonstração, numa tela de celular, e o screencast do navegador vira MP4 (H.264), WebM (VP9), poster e as
legendas WebVTT (falas e capítulos). Não tem som: o texto está nas legendas.

| Arquivo | O que faz |
| --- | --- |
| `gravador.mjs` | Abre o navegador, captura a tela, mostra o toque, cartelas, legendas e capítulos; gera os arquivos com o ffmpeg |
| `roteiro-kimepro.mjs` | O roteiro: entrada sem senha, Evolua, Ensine e Administre |
| `gravar.mjs` | Roda um roteiro: `node gravar.mjs <roteiro> <pasta-de-saida>` |
| `servidor-estatico.mjs` | Serve o app web exportado (com tipos de vídeo e de legenda) |
| `montar-secao.mjs` | Gera o HTML dos capítulos e da transcrição a partir das legendas |

## Regravar

Requisitos: Node, ffmpeg (`winget install Gyan.FFmpeg`), Microsoft Edge e o repositório `kimepro-app` ao lado
(o `playwright-core` vem dele).

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

Os horários dos capítulos (`data-tempo`) no `index.html` mudam a cada gravação: atualize-os com a saída do passo 3.
