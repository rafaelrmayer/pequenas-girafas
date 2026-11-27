# Sugestões locais e explicáveis de frases

O planejador puro `frontend/phrases/planner.mjs` oferece até duas opções do tema da frase atual. Usa somente phraseEvents, o catálogo de 24 frases e as preferências explícitas adapt, exploration e reviewAfterDays. Eventos de palavras, temas anteriores, velocidade, erros, pausas e ausência de fala não definem capacidade ou interesses.

Opções: continuar a frase atual, retomar com apoios disponíveis, explorar outra frase/continuação ou revisitar uma registrada. Novidades priorizam o mesmo exemplo e, depois, a quantidade de palavras como ordem de apresentação, sem afirmar adequação pedagógica. Nenhuma conclusão é pré-requisito para acessar as demais frases. Uso de modelo/pista é descrito como contagem, não evidência de dificuldade. Informações ausentes não viram ausência de apoio.

Revisitas usam o último dia válido e o intervalo escolhido (3–30 dias, padrão 7). Data futura impede a organização de revisita daquela frase; dias desconhecidos não permitem calcular intervalo. A preferência explícita Revisitar pode oferecer frase registrada sem intervalo atingido ou sem data, com motivo correspondente. Relógio inválido não produz revisita por intervalo. Esquecimento, retenção ou domínio não são inferidos.

A seção Sugestões para explorar frases começa fechada. Abrir ou ignorar preserva os cartões. Escolher esta sugestão é a confirmação explícita para reiniciar os cartões, oferecer o modelo e focar o banco. Não grava evento nem inicia áudio. Somente concluir a nova rodada cria registro. Ver uma sugestão com a frase atual completa conta como modelo; a exposição permanece marcada ao fechar ou ignorar. A sugestão escolhida também oferece o modelo explicitamente. Não é gravada uma nova categoria de metadado.

Continuar nesta frase esconde as opções até recomeçar, trocar frase ou mudar as preferências relevantes. Personalização desligada remove sugestões personalizadas sem remover frases/apoios. Preferências, exclusão e novas conclusões atualizam o planejador. Funciona offline após cache v22, sem provedor remoto, modelo treinado ou treinamento global. Conteúdo e critérios experimentais, pendentes de revisão pedagógica.
