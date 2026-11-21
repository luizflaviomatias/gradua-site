# kimepro-site

Landing page pública do **KimePro** — app para academias e escolas de lutas.
*Administre. Ensine. Evolua.*

HTML e CSS estáticos, sem etapa de build, prontos para o GitHub Pages:
[luizflaviomatias.github.io/kimepro-site](https://luizflaviomatias.github.io/kimepro-site/), e depois no domínio
próprio [kimepro.com.br](https://kimepro.com.br).

*Kime* (極め / 決め) é o termo das artes marciais japonesas para o ponto máximo de foco, decisão e energia no
instante exato da execução: gestão precisa, evolução do aluno acompanhada de perto e decisão certeira. *Pro*, do
tatame ao financeiro. O site se chamava gradua-site até a F9; o guia de migração está no `MIGRACAO-KIMEPRO.md` do
kimepro-app. O `logo.svg` sai de `apps/mobile/assets/marca/logo.svg` do app.

| Arquivo | Conteúdo |
| --- | --- |
| `index.html` | Página principal: perfis, recursos, modalidades, planos e perguntas |
| `privacidade.html` | Política de privacidade (versão preliminar) |
| `termos.html` | Termos de uso (versão preliminar) |
| `instalar.html` | Passo a passo de instalação no Android (APK do site) e no iPhone (app web na tela de início) |
| `idioma.js` | Troca de idioma (pt-BR, es-ES, en-US) e a lista só de bandeiras no topo |
| `textos.js` | Textos em espanhol da Espanha e inglês dos EUA; o português fica no próprio HTML |
| `estilo.css` | Identidade visual: carvão, hinomaru, dourado e kimono; Bebas Neue e Inter |
| `logo.svg` | Marca e favicon |
| `versao.json` | Versão publicada do app: liga os botões de `instalar.html` e avisa o app Android de versão nova |
| `publicacao.js` | Lê o `versao.json` e libera os botões de instalação |
| `app/` | App web do iPhone, publicado pelo workflow *Publicar app web* do kimepro-app |

## Antes do lançamento

- [ ] Revisar a política de privacidade e os termos com um advogado e incluir a empresa responsável, o CNPJ e o canal do encarregado de dados.
- [ ] Publicar os preços dos planos.
- [ ] Publicar a primeira versão: anexar `kimepro.apk` a uma Release do kimepro-site e trocar `"publicado"` para `true` no `versao.json`.
- [ ] Trocar as telas desenhadas em CSS por capturas reais do app.
- [ ] Apontar o domínio próprio, quando registrado.
