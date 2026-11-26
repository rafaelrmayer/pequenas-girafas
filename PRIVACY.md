# Privacidade V0.1

Projetado para minimizar dados. Não é uma declaração de conformidade jurídica já auditada; revisão de LGPD, segurança e proteção especial de crianças é etapa obrigatória antes da versão estável.

## Dados locais

IndexedDB guarda até 200 construções concluídas: identificador da palavra do catálogo, identificador aleatório de sessão, apoio utilizado e conclusão; também preferências de apresentação e adaptação. A sessão é recriada ao recarregar a página. Mesmo sem nome, esse histórico pode revelar informações sobre aprendizagem; é tratado como privado e não enviado ao servidor.

Sem banco central de crianças/familiares, nome, diagnóstico, foto, áudio, geolocalização, conta, telemetria pessoal, publicidade ou cookies. Nenhum uso para treinamento global, pesquisa própria ou comercialização. Projetos independentes não recebem esses dados. Não há transmissão para GIRAF ou provedores.

## Controle

A área de responsáveis mostra resumo, permite desligar adaptação e apagar registros e preferências com confirmação. A exclusão remove a chave de histórico lógico e a substitui por estado vazio; IndexedDB e cache podem continuar contendo estruturas técnicas e catálogo genérico, sem eventos anteriores acessíveis pela aplicação. Exclusão forense do disco depende do navegador/SO. Arquivos de backup baixados devem ser apagados separadamente. Exportação é local, voluntária e contém evidências de aprendizagem; não há importação nem backup Google nesta versão.

Sem proteção por senha ou perfis: pessoas que compartilham o navegador podem ler os registros. Use perfil separado quando necessário. Modo privado, limites de armazenamento ou limpar dados podem perder registros; a interface avisa quando salvar falha. Até 200 eventos recentes, sem retenção no servidor. Cache offline guarda somente arquivos genéricos de uma lista fixa.

## Rede e voz

Arquivos estáticos e catálogo exigem uma requisição inicial ao servidor. Infraestrutura pode receber IP e metadados técnicos. Comando de desenvolvimento/Docker desativa access logs; futura hospedagem exige política de logs e retenção revisada. Cabeçalhos desabilitam câmera, microfone e geolocalização e restringem conexões à própria origem.

O áudio principal usa 33 MP3 genéricos gerados offline, servidos pela própria origem e cacheados com as atividades; nenhum progresso é enviado para reproduzi-los. Somente se o arquivo falhar, a síntese alternativa usa vozes que Web Speech expõe como `localService=true` em português. A sinalização é do navegador/SO; não prova um fornecedor auditado. Sem voz, aviso explícito e atividade silenciosa. Nunca selecionamos uma voz remota como fallback. Catálogo e nomes de letras são textos genéricos fixos; não há entrada livre enviada para síntese.

## Próximas versões

Textos livres e histórias podem conter dados pessoais: não serão enviados automaticamente a provedores. Qualquer mudança de fluxo precisa de revisão prévia e documentação. Dados de crianças/familiares não serão usados para pesquisa ou treinamento. Questões devem ser encaminhadas ao mantenedor do repositório, sem incluir informações pessoais em issues ou capturas.

## Geração do catálogo de áudio

A ferramenta de desenvolvimento Edge TTS envia somente 33 palavras e nomes de letras genéricos fixos ao serviço Microsoft Edge. Isso ocorre na preparação do catálogo pelo mantenedor, não no dispositivo da criança, no servidor de produção ou nos testes comuns. Não aceita texto livre. O aplicativo recebe apenas os MP3 empacotados e não chama Microsoft para reproduzi-los; progresso, configurações e sessão local continuam fora da rede. A infraestrutura do serviço pode observar IP e metadados da máquina de geração; isso é diferente de processar dados da criança.
