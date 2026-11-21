// Endereço do Supabase que recebe as inscrições das academias piloto. A chave publicável é pública por natureza: ela
// só permite chamar a função de inscrição, que valida tudo no banco. Vazio, o formulário fica escondido ("em breve").
export const SUPABASE = Object.freeze({
  url: '',
  chavePublicavel: '',
});
