// Roteiro do tutorial do KimePro: entrada, visão do aluno, do professor e do administrador (pt-BR).
// Usa o app web exportado em modo demonstração (sem Supabase: qualquer e-mail, código 123456) servido em ENDERECO.
const ENDERECO = process.env.KIMEPRO_URL ?? 'http://localhost:8099/';
const CODIGO_DA_DEMONSTRACAO = '123456';

export const NOME = 'kimepro-tutorial';
export const TEMA = { fundo: '#141414', texto: '#f4f1ea', destaque: '#c8102e' };
export const POSTER_NO_SEGUNDO = 1.2;

/** Autenticador virtual do navegador: faz o papel da digital ou do rosto que destrava as visões protegidas. */
async function ligarTravaDoAparelho(pagina) {
  const sessao = await pagina.context().newCDPSession(pagina);
  await sessao.send('WebAuthn.enable');
  await sessao.send('WebAuthn.addVirtualAuthenticator', {
    options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true },
  });
}

export async function roteiro(g) {
  const p = g.pagina;
  const alvo = (nome) => p.getByRole('button', { name: nome, exact: true })
    .or(p.getByRole('checkbox', { name: nome, exact: true }))
    .or(p.getByRole('tab', { name: nome, exact: true })).first();
  const texto = (conteudo) => p.getByText(conteudo, { exact: true }).first();

  await ligarTravaDoAparelho(p);
  await p.goto(ENDERECO);
  await p.getByPlaceholder('seu@email.com').waitFor();
  await g.comecar();

  await g.cartela({ titulo: 'KimePro', texto: 'Tutorial: a academia de lutas na palma da mão, para aluno, professor e administrador', ms: 3800 });

  g.capitulo('Entre sem senha');
  g.legenda('Para entrar, digite seu e-mail e peça o código. Não tem senha para lembrar.');
  await g.digitar(p.getByPlaceholder('seu@email.com'), 'ana@exemplo.com');
  await g.tocar(alvo('Receber código'), { depois: 1200 });
  g.legenda('O código chega no seu e-mail. Digite e toque em Entrar.');
  await g.digitar(p.getByPlaceholder('Código'), CODIGO_DA_DEMONSTRACAO);
  await g.tocar(alvo('Entrar'), { depois: 1500 });
  g.legenda('No primeiro acesso, leia e aceite os Termos de Uso e a Política de Privacidade.');
  await texto('Termos e privacidade').waitFor();
  await g.pausa(2200);
  await g.tocar(alvo('Li e aceito'), { depois: 700 });
  await g.tocar(alvo('Continuar'), { depois: 1500 });

  g.capitulo('Escolha a academia');
  g.legenda('Treina em mais de uma academia? Escolha qual abrir. Cada uma mostra o seu papel nela.');
  await texto('Escolha a academia').waitFor();
  await g.pausa(3200);
  await g.tocar(texto('Academia Força'), { depois: 1800 });

  g.capitulo('Evolua: a visão do aluno');
  g.legenda('Na aba Evolua, o aluno acompanha a jornada: faixa atual e quanto falta para a próxima.');
  await texto('Minha jornada').waitFor();
  await g.mostrar(texto('Minha jornada'));
  await g.pausa(4200);
  g.legenda('Logo abaixo, as aulas da semana em cada modalidade.');
  await g.mostrar(p.getByRole('radio', { name: 'Semana', exact: true }));
  await g.pausa(3200);
  g.legenda('Em Minhas faturas: o que vence, o Pix copia e cola e a cópia para o ContaCerta.');
  await g.mostrar(texto('Minhas faturas'));
  await g.pausa(2000);
  await g.mostrar(alvo('Copiar Pix copia e cola'));
  await g.pausa(3000);

  g.capitulo('Ensine: a visão do professor');
  g.legenda('Professor? Na aba Ensine, o app pede a trava do celular antes de abrir.');
  await g.tocar(alvo('Ensine'), { depois: 2000 });
  g.legenda('Ali ficam as aulas para dar, quem está pronto para graduar e o registro da graduação.');
  await g.mostrar(texto('Graduação'));
  await g.pausa(4200);
  g.legenda('E os repasses: o extrato do mês, com o fixo e o valor por aula dada.');
  await g.mostrar(texto('Meus repasses'));
  await g.pausa(3800);

  g.capitulo('Administre: a gestão da academia');
  g.legenda('Na aba Administre fica a gestão: alunos ativos, professores e a cobrança do dia.');
  await g.tocar(alvo('Administre'), { depois: 2200 });
  await g.mostrar(texto('Cobrança de hoje'));
  await g.pausa(3000);
  g.legenda('Fatura vencida? Cobre pelo WhatsApp com um toque.');
  await g.mostrar(alvo('Cobrar no WhatsApp'));
  await g.pausa(3200);
  g.legenda('Agenda das turmas, graduação, faturas, despesas, repasses e o fechamento do mês.');
  await g.mostrar(alvo('Fechamento do mês'));
  await g.pausa(4200);
  g.legenda('E posts para o Instagram com a marca da academia, respeitando a autorização de imagem de cada aluno.');
  await g.mostrar(alvo('Abrir Instagram'));
  await g.pausa(4200);
  g.semLegenda();

  g.capitulo('Pronto!');
  await g.cartela({
    titulo: 'Pronto!',
    texto: 'Experimente grátis e leve a sua academia para o KimePro.<br><br>luizflaviomatias.github.io/kimepro-site',
    ms: 4500,
  });
}
