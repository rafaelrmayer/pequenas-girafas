# Pequenas Girafas

**Grandes descobertas, pequenos passos.** Plataforma independente e gratuita de exploração de letras e palavras, para alfabetização inclusiva. Responsável: Rafael Ricardo Mayer. V0.1 experimental, de 26/11/2026.

A criança protagoniza: pode escolher palavras, pedir pistas, repetir, parar ou ignorar sugestões. Não há exigência de fala, cadastro, ranking, punição, cronômetro ou avaliação de capacidade. Conteúdo e critérios ainda aguardam validação pedagógica e testes com o público-alvo.

## Executar localmente

Requer Python 3.12+ (testado com 3.12). Node 24 é necessário somente para testes do motor e do navegador.

```sh
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --no-access-log
```

Abra http://127.0.0.1:8000. A mesma origem serve a interface, o catálogo e os recursos genéricos. Não são necessárias chaves, conta ou serviços pagos. Para outra porta/origem, o navegador mantém outro armazenamento. O modo offline funciona em localhost ou HTTPS, após o primeiro carregamento completo.

Alternativa Docker: `docker compose up --build`, também em http://127.0.0.1:8000. O contêiner não precisa de banco, rede de provedores ou volume de dados pessoais. **Não há implantação em produção nesta entrega.**

## Primeira demonstração

1. Escolha PEIXE no tema Fundo do mar; a ilustração é local e original.
2. Opcionalmente peça a leitura. As sete palavras e os 26 nomes de letras têm áudios sintéticos pt-BR empacotados, reproduzidos por clique mesmo sem voz instalada. Se um arquivo falhar, há tentativa de voz local e aviso próximo ao botão; não há chamada remota.
3. Selecione P, E, I, X, E por toque, clique ou foco + Enter/Espaço. Os dois E são peças independentes.
4. Use “Quero uma pista” se desejar. A pista completa a próxima posição correta; um modelo visível ou pista identifica a construção como apoiada.
5. Confira a palavra; ao acertar, ela é lida com o volume escolhido. A leitura ao acertar pode ser desligada em Apoios e preferências. Somente uma conclusão é registrada por rodada. Tente outra palavra ou repita.
6. Em “Escolher apoio”, experimente sem modelo. Duas sessões diferentes com construção sem pistas permitem sugerir esse modo; a sugestão é opcional e não é prova de domínio ou retenção. Repetir na mesma sessão não conta como sessões diferentes. Recarregar a página inicia uma sessão local nova.
7. A área de responsáveis permite desligar adaptação, ajustar o critério entre 2 e 10 sessões, ver registros, baixar uma cópia e apagá-los com confirmação. Cópias baixadas não são apagadas pelo aplicativo.

A demonstração inclui sete palavras (PEIXE, MAR, ÁGUA, POLVO, CONCHA, PRAIA, CARANGUEJO), alfabeto A–Z com maiúsculas/minúsculas, modelo opcional, pistas e relações semânticas explicáveis. Todas as palavras ficam disponíveis, independentemente da recomendação.

## Dados e funcionamento offline

IndexedDB mantém até 200 construções recentes e preferências somente neste perfil de navegador. Não há nomes, diagnósticos, fotos, telemetria ou treinamento com registros dos usuários. O servidor recebe pedidos dos arquivos genéricos; nunca recebe o progresso. O Service Worker guarda uma lista explícita de arquivos e catálogo, sem dados pessoais. Registros locais não são criptografados; outras pessoas no mesmo perfil podem acessá-los. Não há múltiplos perfis nesta versão.

Para usar offline, aguarde o aviso no rodapé depois do primeiro carregamento. Os áudios do catálogo também ficam disponíveis offline. Para atualizar o cache numa próxima versão, alterar o identificador de cache em `frontend/sw.js`; esta fundação usa cache versionado para impedir atualização parcial do catálogo durante uma sessão.

## Testes

```sh
python -m pip install -r requirements-dev.txt
python -m pytest -q
npm ci
npm test
# Em um computador normal/CI com navegador disponível, com a aplicação iniciada:
npx playwright install chromium
npm run test:browser
```

GitHub Actions executa API, motor e navegador, incluindo persistência, exclusão, teclado, celular, ausência de transmissão do progresso, modo offline e indisponibilidade de armazenamento/voz. Capturas ficam como artefato temporário da CI. Neste ambiente gerenciado, não se inicia navegador nem servidor de prévia local quando não há ferramenta de navegador suportada.

## API desta versão

- `GET /health`: saúde e modo mock.
- `GET /api/v1/catalog`: vocabulário, tema e arestas semânticas.
- `GET /api/v1/rules`: regras editoriais experimentais.
- `GET /api/v1/resources/{word_id}`: adaptador mock de imagem/TTS para palavras conhecidas. É uma verificação de contrato; a atividade usa as ilustrações empacotadas diretamente. O mock de voz retorna `no_audio`, nunca finge ter sintetizado fala.
- `GET /openapi.json`: contratos da API. Não há endpoint de progresso ou cadastro.

## Integração GIRAF

O código público GIRAF-ai foi analisado em commit fixado, assim como a alternativa C#. A V0.1 implementa somente a fronteira mock e serialização dos contratos conhecidos. **Nenhum GIRAF-ai remoto é executado ou chamado, nem seu código GPL é incorporado.** Integração autenticada real e voz pt-BR no provedor dependem de revisão adicional. Veja [análise técnica](docs/GIRAF_REVIEW.md) e [licenças](THIRD_PARTY_LICENSES.md).

## Documentação

- [Escopo recebido](docs/SCOPE.md) e [roadmap](ROADMAP.md).
- [Arquitetura](ARCHITECTURE.md), [motor local](AI_DESIGN.md) e [ADRs](docs/adr/).
- [Privacidade](PRIVACY.md), [segurança](SECURITY.md), [acessibilidade](ACCESSIBILITY.md).
- [Diretrizes pedagógicas](PEDAGOGICAL_GUIDELINES.md) e [histórico](CHANGELOG.md).

Etapas posteriores ainda estão em desenvolvimento: desenho, histórias, frases livres, relatórios avançados, restauração de backup, reconhecimento de escrita, embeddings, RAG e modelos treinados ficam fora desta entrega. A Jornada de Bia e as outras APIs não foram modificadas.

## Ambientes separados

`main` para a principal e `develop` para testes; configuração preparada, sem hospedagem aplicada. Veja [ambientes](docs/ENVIRONMENTS.md). O repositório criado pelo mantenedor é público; nenhum dado pessoal ou segredo está incluído.

### Áudio do catálogo

As 7 palavras e os 26 nomes de letras usam MP3 gerados com **edge-tts 7.3.1**, voz **pt-BR-FranciscaNeural**, velocidade **-15%**. O aplicativo apenas reproduz os arquivos da própria origem; não depende de Edge TTS durante o uso e não envia progresso ou dados pessoais. Os arquivos entram no cache offline. A voz ainda precisa de revisão pedagógica de pronúncia; nomes de letras não são fonemas.

A geração é uma ferramenta opcional de desenvolvimento, separada das dependências do servidor:

```sh
python -m pip install -r requirements-audio.txt
python scripts/generate_audio.py
```

Esse comando precisa de internet e envia ao serviço Microsoft Edge **somente os 74 textos genéricos fixos do catálogo**. Não aceita texto livre ou histórico da criança. Não roda em inicialização, deploy ou CI de testes. Oferece também as vozes pt-BR Antonio e Thalita por `--voice`. A voz é validada contra o catálogo online antes de gerar. Os arquivos só são substituídos depois da geração completa; falha de rede preserva o catálogo anterior.

`frontend/assets/audio/manifest.json` registra provedor, versão, voz, taxa, transcrições e hashes de cada MP3. `scripts/generate_audio_espeak.py` preserva a alternativa antiga, de qualidade mais robótica; não é o padrão. Edge TTS usa um serviço online do Edge, não a API contratada do Azure Speech, e sua disponibilidade pode variar. Biblioteca e serviço têm condições próprias; ver [licenças](THIRD_PARTY_LICENSES.md).

Em redes gerenciadas que usam CA própria, `--ca-file /caminho/ca-confiavel.pem` acrescenta o certificado confiável ao verificador; a validação TLS nunca é desligada. Proxy HTTPS configurado no ambiente é reutilizado sem ser registrado nos logs.

## Três formas de explorar

A área da atividade oferece escolha livre entre **Montar a palavra**, **Completar uma letra** e **Associar imagem e palavra**. Mudar de atividade não conta como erro nem exige concluir a anterior. As sete palavras do tema estão disponíveis em todas.

- Montar: clique nas letras ou arraste-as para posições específicas; letras colocadas podem ser retiradas por botão ou trocadas por arraste.
- Completar: as outras letras ficam fixas; escolha ou arraste uma entre quatro opções para o espaço. Repetir varia a posição ausente. Uma nova opção substitui a anterior, sem punição.
- Associar: observe a imagem, selecione uma entre três palavras e confira. A pista revela o modelo; ouvir a palavra também é registrado como apoio nesse contexto. As alternativas mudam de ordem ao repetir.

A leitura ao acertar funciona nas três atividades, respeitando a preferência local e o volume. No celular, segure uma letra por um instante e arraste; para rolar a página, use a área fora das peças. Arrastar nunca é obrigatório: botões, toque e teclado permanecem disponíveis. Não há conclusão automática ao soltar; o botão de conferir mantém o controle com a pessoa.

Os registros distinguem `build`, `missing` e `match`. Só as construções completas entram na regra que sugere experimentar sem modelo; acertar associação ou uma letra ausente não comprova construção independente. Eventos anteriores sem tipo continuam sendo interpretados como `build`. Exportações passam a `schemaVersion: 2`, com eventos anteriores preservados. Não há migração ou transmissão para servidor.

## Sugestões locais explicadas

A seção “Uma próxima descoberta” oferece até duas sugestões com motivo e botão para experimentar. Pode recomendar continuar com apoio, revisitar, explorar outra palavra/atividade ou outra grafia. “Continuar por aqui” preserva a rodada e as letras já colocadas. Nada é obrigatório e todas as palavras e atividades continuam disponíveis.

Na área de responsáveis, configure categoria de interesse, exploração equilibrada/revisita/novas palavras, atividade preferida e intervalo para sugerir revisita (3–30 dias). Desligar a personalização remove as sugestões individuais e a ordenação por histórico. Não há inferência automática de interesses pessoais.

O resumo da palavra separa as três atividades e informa conclusões sem pistas/com apoio, uso de pistas, sessões, dias com data e apresentações. Somente conclusões novas recebem data local sem horário e metadados genéricos de apresentação. **Sessões e dias diferentes não comprovam retenção; maiúsculas/minúsculas ou outra lacuna não comprovam generalização.** Registros antigos ficam identificados como sem data. Na versão 0.1.5 havia uma única ilustração por palavra; a 0.1.6 acrescenta variações de PEIXE, POLVO e ÁGUA, sem comprovar generalização.

O grafo adiciona conceitos explicativos como NADAR e FUNDO DO MAR, sem apresentá-los como atividades prontas. As sete palavras com imagem/áudio permanecem as mesmas. Tudo roda no navegador e offline; a API não recebe o histórico. Exportação schemaVersion 3 preserva eventos anteriores. Veja [ADR 0006](docs/adr/0006-local-evidence-and-advice.md).

## Imagens diferentes da mesma palavra

PEIXE, POLVO e ÁGUA agora têm três ilustrações cada: a original e duas novas. As demais quatro palavras mantêm a imagem original. Use “Imagem para explorar” ou “Outra imagem”; não há alternância automática, câmera ou upload. O áudio da palavra continua o mesmo e trocar a imagem não reproduz som sozinho.

- Antes de interagir na rodada, a escolha define a imagem daquela tentativa.
- Depois de começar a responder, mudar a imagem preserva as letras/opção escolhida e registra uma rodada com troca, sem atribuir a conclusão a uma imagem isolada.
- Depois de concluir, mudar a imagem abre uma nova rodada, preservando o registro anterior.
- Uma sugestão opcional pode propor a mesma palavra com outra ilustração, oferecendo modelo e pistas. Aceitar exige clique; não há bloqueio de imagens.

A área de responsáveis mostra conclusões com cada imagem, rodadas com troca e registros sem identificação. Contextos antigos que registraram explicitamente `image-v1` continuam ligados à original; eventos sem imagem registrada permanecem desconhecidos. Isso descreve o material disponível durante as interações, não o que a pessoa olhou ou reconheceu.

As seis ilustrações novas são SVGs locais originais e entram no cache offline. Não há serviço de visão, rastreamento ocular ou análise de imagem. Conclusões em imagens diferentes são observações, não prova de generalização. Exportação schemaVersion 4 inclui `visualIds`, preservando registros antigos.


## Licença e reutilização

O código próprio, a interface e os SVGs originais do Pequenas Girafas estão disponíveis sob a [PolyForm Noncommercial 1.0.0](LICENSE). É permitido usar, copiar, modificar e redistribuir para os fins permitidos nessa licença, preservando os termos e o aviso de autoria de [NOTICE](NOTICE).

A licença permite fins não comerciais e contempla expressamente usos por instituições educacionais, beneficentes e outras organizações descritas no texto, independentemente da origem do financiamento. Não é uma proibição geral de qualquer uso por uma instituição que receba receitas. Usos comerciais fora dessas permissões exigem autorização específica do titular.

Descrição pública: **código disponível para reutilização não comercial**. A restrição comercial impede apresentá-lo como software livre ou open source. Este resumo não substitui a licença integral.

Dependências, ferramentas de geração e áudios de fornecedores têm condições próprias; esta licença não substitui nem amplia direitos sobre componentes de terceiros. Consulte [Componentes e licenças](THIRD_PARTY_LICENSES.md), especialmente os termos do serviço de voz. A demonstração atual permanece experimental, sem validação pedagógica.


## Astronomia — V0.1.7

O seletor **Escolha um tema** permite alternar entre Fundo do mar (sete palavras) e Astronomia (**LUA, SOL, ESTRELA, CÉU e PLANETA**). A escolha é explícita e fica nas preferências locais. Cada palavra nova tem uma ilustração SVG original e áudio pt-BR local, com as três atividades já existentes. ESTRELA começa no singular; o desenho de cinco pontas é uma representação simbólica.

A seleção muda palavras, sugestões e exemplos do alfabeto. As recomendações ficam no tema escolhido; não há migração automática entre temas. O resumo e a exportação preservam os registros dos dois temas, usando IDs distintos. Apagar dados retorna ao Fundo do mar e mantém a exclusão explícita já existente. O banco local e os registros antigos não são substituídos.

O grafo inclui relações como SOL → é uma → ESTRELA e LUA → pode ser vista no → CÉU. A complexidade continua editorial e provisória; sem novas inferências sobre aprendizagem. São regras locais, não um modelo treinado ou conteúdo validado pedagogicamente.

Os cinco MP3 novos usam a mesma voz Francisca e taxa -15%; os 33 arquivos anteriores foram preservados. Para gerar somente os novos áudios sem substituir os existentes:

```bash
python scripts/generate_audio.py --only lua sol estrela ceu planeta
```

A geração parcial exige manifesto anterior compatível e verifica seus hashes. O comando envia somente esses textos genéricos ao serviço, não registros de aprendizagem. O cache v13 inclui todas as palavras e mídias para uso offline após sua atualização. A publicação continua em `develop` no ambiente de testes; não promove a versão principal.

O botão **Próxima palavra**, junto de Ouvir a palavra, percorre a ordem do tema escolhido e retorna à primeira após a última. Preserva a atividade escolhida, interrompe o áudio anterior e não reproduz outro automaticamente. Rodadas incompletas não geram registro de erro ou dificuldade; conclusões anteriores continuam salvas. Atualização de cache v14.


## Natureza e Frutas — V0.1.8

Dois temas adicionais usam as três atividades existentes:

- **Natureza:** FLOR, GRAMA, FOLHA, ÁRVORE, SEMENTE e JARDIM.
- **Frutas:** MAÇÃ, PERA, LARANJA, ABACAXI, MANGA e PÊSSEGO.

As 12 ilustrações são SVGs originais e os 12 áudios são MP3 locais pt-BR, com a mesma voz e taxa do catálogo anterior. As 38 gravações anteriores foram preservadas. Os quatro temas somam 24 palavras e 26 nomes de letras, totalizando 50 gravações. A grafia preserva acentos e cedilha; PERA segue a grafia sem acento. MANGA é representada como fruta.

O grafo local contém relações como FOLHA → faz parte de → ÁRVORE e FLOR → pode ser encontrada em → JARDIM. Categorias Plantas e Frutas podem ser explicitamente escolhidas nas preferências; a seleção não bloqueia outras palavras. As sugestões permanecem no tema atual. Não há modelo treinado, inferência automática de interesses ou validação pedagógica das classificações de complexidade.

O botão Próxima palavra percorre cada tema e retorna à primeira após a última. Os registros dos temas anteriores permanecem no dispositivo e na exportação. Cache v15 inclui os novos recursos para uso offline após atualização. Cadastro de palavras permanece para uma etapa futura.

Geração parcial dos novos áudios (apenas para manutenção, não para executar o aplicativo):

```bash
python scripts/generate_audio.py --only flor grama folha arvore semente jardim maca pera laranja abacaxi manga pessego
```


## Revisitas explicáveis — V0.1.9

A área de responsáveis inclui **Revisitas neste tema**, com até cinco opções opcionais, ordenadas pelo último registro datado. A lista separa intervalo atingido, registro recente, ausência de data e datas a conferir. Usa somente conclusões da mesma palavra e atividade, dentro do tema escolhido.

Revisitar mantém a atividade registrada: uma conclusão de associação não vira evidência de construção porque outra atividade foi marcada como preferida. Registros com datas futuras não geram indicação por intervalo; registros sem data são preservados e não recebem data inventada. Uma nova conclusão atualiza somente a palavra/atividade realizada. Clicar em Revisitar, ignorar, trocar de palavra ou ajustar o intervalo não cria uma conclusão.

O intervalo de 3 a 30 dias (padrão 7) é uma preferência de organização, não prazo, avaliação pedagógica ou indicador de esquecimento. Com personalização desligada não é produzida lista personalizada; palavras e atividades continuam disponíveis. O módulo roda no dispositivo, inclusive offline após atualização do cache v16. Não há modelo treinado, novas categorias de dados ou mudança do banco local. Veja [regras de revisita](docs/ADAPTIVE_RULES.md).

## Relatório local de exploração

Na área de responsáveis, filtre tema e período, gere e confira a prévia e use Imprimir / salvar PDF. O documento separa atividades, apoio e informações desconhecidas; registros sem data têm seção própria. Não gera notas nem comprova aprendizagem. Funciona no dispositivo, inclusive offline após atualizar o cache v17. PDFs salvos não são apagados ao excluir registros no aplicativo. Veja [funcionamento e limites](docs/LOCAL_REPORT.md).

## Construindo frases — primeira etapa

Oito frases fixas (duas por tema) podem ser organizadas por cartões de palavras, usando toque, mouse ou teclado. Modelo e pista são opcionais, a ordem pode ser corrigida removendo cartões e não há trilha obrigatória, tempo ou pontuação. Ouvir reproduz a frase de exemplo completa, com MP3 local; a preferência de áudio ao conferir também se aplica às frases corretas.

Esta etapa não avalia expressão livre, não salva as escolhas e não as inclui em recomendações ou relatórios de palavras. As imagens existentes são referências ao substantivo principal, sem representar toda a ação. O catálogo contém palavras funcionais e verbos adicionais para essas frases, sem ampliar as atividades de palavras isoladas.

Cache v18 inclui catálogo, módulos e oito gravações novas, totalizando 58. As 50 anteriores foram preservadas. Conteúdo experimental, pendente de revisão pedagógica. Veja [decisão de arquitetura](docs/adr/0008-frases-simples.md).

## Continuações de frases

Em cada exemplo, abra **Explorar ações e complementos**, escolha uma ação/relação e um complemento e confira a prévia. **Montar esta frase** reinicia os cartões com a opção escolhida; apenas mudar os seletores preserva a montagem atual. Recomeçar mantém a continuação ativa.

São 24 combinações preparadas (8 originais e 16 continuações), com áudio completo local. Não há geração livre, modelo treinado ou armazenamento de escolhas. Cache v19, catálogo de 74 gravações; as 58 anteriores foram preservadas. Conteúdo aguarda revisão pedagógica. Veja [decisão e limites](docs/adr/0009-continuacoes-frases.md).
