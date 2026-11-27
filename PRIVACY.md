# Privacidade V0.1

Projetado para minimizar dados. Não é uma declaração de conformidade jurídica já auditada; revisão de LGPD, segurança e proteção especial de crianças é etapa obrigatória antes da versão estável.

## Dados locais

IndexedDB guarda até 200 atividades de palavras concluídas: identificador da palavra do catálogo, identificador aleatório de sessão, apoio utilizado, conclusão e tipo de atividade; também preferências de apresentação e adaptação. A sessão é recriada ao recarregar a página. Mesmo sem nome, esse histórico pode revelar informações sobre aprendizagem; é tratado como privado e não enviado ao servidor.

Sem banco central de crianças/familiares, nome, diagnóstico, foto, áudio, geolocalização, conta, telemetria pessoal, publicidade ou cookies. Nenhum uso para treinamento global, pesquisa própria ou comercialização. Projetos independentes não recebem esses dados. Não há transmissão para GIRAF ou provedores.

## Controle

A área de responsáveis mostra resumo, permite desligar adaptação e apagar registros e preferências com confirmação. A exclusão remove a chave de histórico lógico e a substitui por estado vazio; IndexedDB e cache podem continuar contendo estruturas técnicas e catálogo genérico, sem eventos anteriores acessíveis pela aplicação. Exclusão forense do disco depende do navegador/SO. Arquivos de backup baixados devem ser apagados separadamente. Exportação é local, voluntária e contém evidências de aprendizagem; não há importação nem backup Google nesta versão.

Sem proteção por senha ou perfis: pessoas que compartilham o navegador podem ler os registros. Use perfil separado quando necessário. Modo privado, limites de armazenamento ou limpar dados podem perder registros; a interface avisa quando salvar falha. Até 200 eventos de palavras e 200 de frases recentes, sem retenção no servidor. Cache offline guarda somente arquivos genéricos de uma lista fixa.

## Rede e voz

Arquivos estáticos e catálogo exigem uma requisição inicial ao servidor. Infraestrutura pode receber IP e metadados técnicos. Comando de desenvolvimento/Docker desativa access logs; futura hospedagem exige política de logs e retenção revisada. Cabeçalhos desabilitam câmera, microfone e geolocalização e restringem conexões à própria origem.

O áudio principal usa 74 MP3 genéricos gerados offline, servidos pela própria origem e cacheados com as atividades; nenhum progresso é enviado para reproduzi-los. Somente se o arquivo falhar, a síntese alternativa usa vozes que Web Speech expõe como `localService=true` em português. A sinalização é do navegador/SO; não prova um fornecedor auditado. Sem voz, aviso explícito e atividade silenciosa. Nunca selecionamos uma voz remota como fallback. Catálogo e nomes de letras são textos genéricos fixos; não há entrada livre enviada para síntese.

## Próximas versões

Textos livres e histórias podem conter dados pessoais: não serão enviados automaticamente a provedores. Qualquer mudança de fluxo precisa de revisão prévia e documentação. Dados de crianças/familiares não serão usados para pesquisa ou treinamento. Questões devem ser encaminhadas ao mantenedor do repositório, sem incluir informações pessoais em issues ou capturas.

## Geração do catálogo de áudio

A ferramenta de desenvolvimento Edge TTS envia somente 33 palavras e nomes de letras genéricos fixos ao serviço Microsoft Edge. Isso ocorre na preparação do catálogo pelo mantenedor, não no dispositivo da criança, no servidor de produção ou nos testes comuns. Não aceita texto livre. O aplicativo recebe apenas os MP3 empacotados e não chama Microsoft para reproduzi-los; progresso, configurações e sessão local continuam fora da rede. A infraestrutura do serviço pode observar IP e metadados da máquina de geração; isso é diferente de processar dados da criança.

## Metadados locais da versão 0.1.5

Conclusões novas acrescentam o dia do calendário local (sem horário), apresentação genérica (atividade, grafia e posição da lacuna), se houve pista/modelo e se o áudio foi solicitado antes da resposta. O objetivo é distinguir observações e organizar revisitas opcionais. A data depende do relógio do dispositivo e não comprova retenção. Não salvamos datas inventadas nos registros antigos, tempo de resposta, inatividade, abandono ou gestos.

Preferências explícitas de categoria, objetivo, atividade e intervalo também ficam somente no IndexedDB. Desativar personalização para as sugestões não apaga os registros de progresso; exclusão continua disponível. Não registramos aceitação ou recusa de recomendação nem enviamos evidências para o servidor. Exportação local passa a schemaVersion 3, preservando eventos antigos sem metadados. Cópias exportadas contêm observações de aprendizagem e precisam de proteção pelo responsável.

## Identificadores visuais locais (0.1.6)

Conclusões novas podem incluir `visualIds` (até três IDs como `image-v1`), indicando quais ilustrações do catálogo estavam disponíveis durante as interações da rodada. Não há fotografia da criança, captura de câmera, upload de imagens, análise de olhar ou gravação de movimentos. Trocar uma imagem sem concluir não cria evento de progresso. Rodadas com troca são separadas das conclusões com uma só imagem; registros antigos sem essa informação continuam desconhecidos.

Os arquivos SVG são genéricos, distribuídos e cacheados na própria origem. Nenhum ID visual ou histórico é enviado ao servidor. Exclusão local continua removendo esses registros. Exportação passa a schemaVersion 4 e contém esses metadados opcionais, mantendo os eventos anteriores.

Para alternar as ilustrações entre visitas, o navegador guarda somente o último ID de imagem de cada palavra com mais de uma ilustração. A escolha fica no armazenamento local, sem horário nem histórico de visitas, e não faz parte da exportação. Apagar registros e preferências reinicia a sequência.

## Conclusões de frases (V0.1.13)

`phraseEvents` guarda separadamente até 200 conclusões: IDs de frase/exemplo/tema do catálogo, dia local, conclusão e uso de modelo, pista e áudio solicitado antes da conclusão. Não contém identificador pessoal, novo identificador de sessão ou texto livre. Prévia completa visível conta como modelo; o áudio automático após o acerto não altera a evidência anterior. Interromper ou não concluir não gera registro.

Frases aparecem em resumo separado e na cópia JSON schemaVersion 5; entram no relatório em seção separada das palavras e não entram no planejador adaptativo. Ausência de metadados não é interpretada como ausência de apoio. Excluir registros limpa ambas as listas. Falha de armazenamento mantém a conclusão somente na memória com aviso. Pessoas no mesmo perfil podem acessar esses registros; sem identificação individual ou sincronização.

Sugestões de frases (V0.1.15) usam apenas phraseEvents e preferências já existentes, localmente. Não geram registros antes da conclusão nem novas categorias de dados. Ver um cartão com a frase atual completa também conta como modelo no registro já existente. Ignorar não envia informação nem cria evento; desligar personalização remove essas sugestões.
