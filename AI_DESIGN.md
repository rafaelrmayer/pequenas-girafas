# Motores locais experimentais

V0.1 usa regras explicáveis, não rede neural, Random Forest ou diagnóstico. Nenhum dado de usuários alimenta treinamento, pesquisa ou recomendação global.

## Evidências

Evento mínimo: `wordId`, UUID da sessão, `support` (`assisted` ou `independent`) e `outcome: completed` e tipo de atividade (`build`, `missing`, `match`). Modelo visível e qualquer pista marcam apoio. Som por solicitação é um recurso de acesso; não é penalizado. Não guardamos erros, tempos de resposta, pausas, abandono, áudio ou métricas motoras. Uma conclusão sem pistas não comprova leitura: pode resultar de reconhecimento, memorização ou outras estratégias.

A ausência de eventos leva ao modelo disponível, com texto de falta de evidência; não recebe rótulo de dificuldade. Não há pontuação de capacidade.

## Apoio

Padrão: duas sessões locais distintas com construção sem modelo/pistas sugerem experimentar sem modelo. Repetições da mesma sessão contam uma vez. Critério configurável de 2 a 10; pode desligar. Habilidade aqui é evidência observada de ordenação de letras de uma palavra específica, não capacidade geral. A tela sempre permite mudar para modelo, pedir pista, escolher outra palavra ou repetir. Não há progressão obrigatória ou retirada automática de acesso ao apoio.

Uma construção com apoio mantém uma sugestão de modelo enquanto não há a quantidade configurada de evidências independentes. Isso não reduz uma classificação da criança. Janela local limitada a 200 eventos: apagamento e descarte de registros antigos também alteram a evidência disponível.

## Expansão semântica

Nós: palavra, imagem, categoria, habilidades e complexidade editorial provisória (não uma regra de comprimento universal). Arestas são revisáveis no catálogo. Ordenação: relações diretas primeiro, palavras ainda não exploradas, anotação de complexidade, ordem alfabética. Explicação apresenta a relação. Exemplo: MAR tende a aparecer antes de CARANGUEJO; nenhuma sugestão é automaticamente considerada adequada à criança e todas ficam disponíveis. V0.1 não estima compreensão de conceitos ou generalização.

## Futuro

Knowledge Tracing, embeddings, RAG e modelos neurais só após validação e necessidade demonstrada. Fontes licenciadas/sintéticas, avaliação pt-BR e execução no dispositivo. Históricos pessoais nunca integrarão uma base global. Não há cadastro nem identificação de crianças nesta fundação.

## Separação por atividade (0.1.4)

A sugestão de retirar opcionalmente o modelo considera exclusivamente `build`. Registros antigos sem `activity` são compatíveis e pertencem a esse tipo. `missing` evidencia apenas a escolha da letra no contexto parcialmente preenchido; `match` evidencia somente a escolha da palavra dentre alternativas. Nenhum é convertido em construção completa ou capacidade geral. Dicas em qualquer atividade contam como apoio; ouvir o alvo em associação/completar também conta como apoio. A leitura após uma resposta correta não altera a evidência já demonstrada.

Não há telemetria de arraste, duração do gesto, tentativas incorretas ou abandono. Botões e arraste produzem o mesmo tipo de evento de conclusão, sem inferir habilidade motora. Escolher outra atividade não gera evento negativo. A expansão de temas pode considerar que uma palavra foi explorada em qualquer atividade, sem afirmar aprendizagem.

## Planejador ampliado (0.1.5)

`planner.mjs` oferece no máximo duas recomendações, com ação, palavra, atividade e razão. Pode manter, reforçar por pistas, oferecer apoio, revisitar, explorar palavra relacionada, experimentar atividade, sugerir outra grafia ou variar após repetições. Não executa transições sem clique e não registra aceitação/recusa. Todas as atividades continuam livres.

`evidenceFor` separa conclusões por palavra e atividade, apoio, pistas solicitadas, sessões, dias locais e apresentações. Registros antigos sem data permanecem desconhecidos. Não existe estimativa de retenção, domínio ou generalização: dois dias diferentes são só observações do calendário local; duas apresentações podem ser apenas maiúsculas/minúsculas. A data é usada para organização de revisitas, nunca para inferir capacidade a partir de ausência ou velocidade.

`completion` aceita uma lista fechada de metadados genéricos; nome, diagnóstico, tempo de resposta e campos arbitrários não entram no evento. Uma conclusão pode conter `day`, `contextId`, `hintUsed`, `modelUsed`, `listenedBeforeAnswer`. Áudio após acerto não é confundido com pista antes da resposta. A janela continua limitada a 200 conclusões locais; descarte ou exclusão reduz a evidência disponível sem significar perda de aprendizagem.

O responsável pode escolher categoria de interesse, objetivo de exploração, atividade e intervalo de revisita. Sem preferências, usamos ordenação editorial equilibrada. Ao desligar personalização, o planejador não oferece recomendações individuais e a lista de palavras usa apenas relações genéricas. A interface não oculta conteúdo por dificuldade presumida.

O grafo agora diferencia palavras executáveis e conceitos não executáveis, como NADAR. Há metadados de apresentação, habilidades e pré-requisitos opcionais, com revisão marcada como pendente. Uma única ilustração por palavra continua sendo uma limitação explícita. Expansão para contextos realmente diferentes exige materiais e avaliação pedagógica adicionais.
