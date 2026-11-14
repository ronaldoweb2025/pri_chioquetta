// Edite o conteúdo aqui e execute `npm run build`. Sem dependências externas.
export default {
  brand: { name: 'Pri Chioquetta', subtitle: 'Corretora de Imóveis em Itapema', tagline: 'Atendimento pessoal, onde você estiver.' },
  seo: {
    title: 'Imóveis em Itapema | Pri Chioquetta',
    description: 'Conheça o Galileu Residence e converse com Priscila Charlise Chioquetta sobre férias, moradia e seus planos de ter um imóvel em Itapema, Santa Catarina.',
    // Endereço pretendido. Não houve configuração de domínio.
    siteUrl: 'https://prichioquetta.com.br',
    allowIndexing: false,
    ogImage: 'assets/images/compartilhamento-itapema.jpg'
  },
  cta: { label: 'Quero conhecer as oportunidades', href: '#interesse' },
  hero: {
    location: 'ITAPEMA · SANTA CATARINA',
    title: 'Seu próximo capítulo no Brasil pode começar em Itapema.',
    desktopTitleLines: ['Seu próximo', 'capítulo no Brasil', 'pode começar', 'em Itapema.'],
    description: 'Para suas férias, seus planos de morar ou investir em um imóvel no Brasil.',
    note: 'Mora fora do Brasil? Vamos conversar.',
    image: {
      name: 'itapema-santa-catarina', widths: [640, 1280, 1920], width: 6875, height: 4583,
      alt: 'Panorama da orla de Itapema, com praia, edifícios e mar.',
      position: '50% 55%'
    }
  },
  motivations: [
    { eyebrow: 'Férias à beira-mar', title: 'Descanso', text: 'Férias e momentos à beira-mar.' },
    { eyebrow: 'Planos para o patrimônio', title: 'Patrimônio', text: 'Planos alinhados ao seu objetivo.' },
    { eyebrow: 'Um endereço no Brasil', title: 'Um lugar no Brasil', text: 'Para quem hoje vive no exterior.' }
  ],
  broker: {
    name: 'Priscila Charlise Chioquetta', role: 'Corretora de Imóveis', creci: 'CRECI-SC 78854F',
    // Sem número fornecido: não gerar um link de WhatsApp fictício.
    whatsapp: '',
    eyebrow: 'Conheça a Pri',
    title: 'Uma conversa com quem vai acompanhar seus planos.',
    text: 'Sou Priscila Charlise Chioquetta, corretora de imóveis em Itapema. Quero entender o que você procura e apresentar oportunidades que façam sentido para seus planos, seja para aproveitar férias, investir ou ter um endereço especial no Brasil, mesmo que hoje você esteja em outro país.',
    image: {
      name: 'priscila-chioquetta-retrato', widths: [480, 960], width: 1254, height: 1254,
      alt: 'Retrato de Priscila Charlise Chioquetta.', position: '50% 40%'
    },
    commercialImagePermissionConfirmed: false
  },
  property: {
    eyebrow: 'Empreendimento em destaque', name: 'Galileu Residence',
    description: 'Um empreendimento para conhecer com calma. Explore as perspectivas de arquitetura e ambientes e converse com a Pri sobre os próximos passos.',
    highlights: ['Arquitetura', 'Ambientes', 'Lazer'],
    image: {
      name: 'galileu-externa-diurna-rf', widths: [640, 1280, 1920], width: 5600, height: 8000,
      alt: 'Perspectiva ilustrativa da fachada diurna do Galileu Residence.', position: '50% 50%'
    },
    imageCaption: 'Perspectiva ilustrativa.',
    // Inserir apenas link de vídeo revisado e aprovado. Sem player ou MP4 no carregamento inicial.
    videoUrl: ''
  },
  gallery: {
    title: 'Espaços para imaginar seus próximos dias.',
    disclaimer: 'Perspectivas ilustrativas. Imagens e especificações sujeitas à confirmação nos materiais oficiais vigentes.',
    // Adicione, remova ou reordene os objetos abaixo e execute npm run build.
    // Os arquivos são os derivados reais já existentes no acervo otimizado.
    items: [
      { title: 'Piscina', caption: 'Perspectiva de lazer com piscina e espreguiçadeiras.', image: { name: 'piscina-a-02', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de piscina e espreguiçadeiras.' } },
      { title: 'Living', caption: 'Perspectiva do ambiente de estar e sua decoração.', image: { name: 'living-a-01', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de living com sofá e painel de televisão.' } },
      { title: 'Sacada', caption: 'Perspectiva da sacada com mesa e cadeiras.', image: { name: 'sacada-02-a-01', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de sacada com mesa, cadeiras e paisagem urbana.' } },
      { title: 'Suíte', caption: 'Perspectiva do dormitório e sua ambientação.', image: { name: 'suite-a-01', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de suíte com cama e cabeceira.' } },
      { title: 'Salão de festas', caption: 'Perspectiva do espaço de convivência e celebrações.', image: { name: 'salao-de-festas-a-02', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de salão de festas com mesas e área de apoio.' } },
      { title: 'Sala de jogos', caption: 'Perspectiva do ambiente de jogos e convivência.', image: { name: 'sala-de-jogos-a-02', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de sala de jogos com mesa e poltronas.' } },
      { title: 'Brinquedoteca', caption: 'Perspectiva do espaço infantil e seus elementos lúdicos.', image: { name: 'brinquedoteca-a-02', widths: [640, 1280, 1920], width: 5000, height: 2813, alt: 'Perspectiva ilustrativa de brinquedoteca com cabana e brinquedos.' } }
    ]
  },
  regionTitle: 'O que aproxima você de Itapema?',
  form: {
    title: 'Conte à Pri o que você procura.',
    text: 'Compartilhe seus planos de moradia, férias ou investimento para preparar uma conversa com a Pri.',
    mode: 'live',
    endpoint: 'https://script.google.com/macros/s/AKfycbxB2wrY8YYlaxiyjaI9UYWTg7-lpuL7Xj8cUI1XeDUX79F0FQGAPhV37rndaAyLeaal/exec',
    // Alterar para live somente com secrets, Apps Script e publicação autorizados.
    liveNote: 'Seus dados serão usados para atender ao interesse informado.',
    successMessage: 'Recebemos seu interesse. A Pri fará contato pelo WhatsApp informado.',
    errorMessage: 'Não foi possível confirmar o envio agora. Seus dados continuam preenchidos. Tente novamente em instantes.',
    sendingLabel: 'Enviando…',
    countries: ['Portugal', 'Brasil', 'Itália', 'Espanha', 'França', 'Alemanha', 'Reino Unido', 'Irlanda', 'Suíça', 'Estados Unidos', 'Canadá', 'Outro país'],
    objectives: ['Moradia', 'Férias', 'Investimento', 'Ainda estou avaliando'],
    // Definir faixas reais com a Pri antes da captação. Sem valores comerciais inventados.
    investmentRanges: ['Prefiro conversar com a Pri', 'Ainda estou definindo'],
    interests: ['Galileu Residence', 'Outras opções em Itapema', 'Ainda estou avaliando'],
    consent: 'Autorizo o contato sobre meu interesse em imóveis e o tratamento dos dados para essa finalidade.',
    consentVersion: 'rascunho-2026-11-13',
    previewNote: 'Prévia para aprovação: este formulário ainda não envia nem armazena dados.',
    previewResult: 'Preenchimento validado nesta prévia. Nenhum dado foi enviado ou armazenado. O envio será ativado somente após a aprovação da integração.'
  }
};
