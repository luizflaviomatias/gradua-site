// Liga os botões de instalação quando a versão estiver publicada. O versao.json é a única fonte: o app Android lê o
// mesmo arquivo para avisar sobre versão nova. Sem ele (ou com "publicado": false), a página continua "em breve".
async function lerPublicacao() {
  try {
    const resposta = await fetch('versao.json', { cache: 'no-store' });
    if (!resposta.ok) return undefined;
    const publicacao = await resposta.json();
    return publicacao.publicado === true && publicacao.apk && publicacao.web ? publicacao : undefined;
  } catch {
    return undefined;
  }
}

function mostrarPublicado({ apk, web }) {
  for (const elemento of document.querySelectorAll('[data-em-breve]')) elemento.hidden = true;
  for (const elemento of document.querySelectorAll('[data-publicado]')) elemento.hidden = false;
  document.querySelector('[data-link="apk"]').href = apk;
  document.querySelector('[data-link="web"]').href = web;
}

const publicacao = await lerPublicacao();
if (publicacao) mostrarPublicado(publicacao);
