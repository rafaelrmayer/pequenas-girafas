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

V0.2–V1.0 não estão implementadas: frases, desenho, histórias, relatórios avançados, restauração de backup, reconhecimento de escrita, embeddings, RAG e modelos treinados ficam fora desta entrega. A Jornada de Bia e as outras APIs não foram modificadas. A licença de distribuição do código próprio ainda deverá ser definida; a ausência de LICENSE não concede uma licença de software livre.

## Ambientes separados

`main` para a principal e `develop` para testes; configuração preparada, sem hospedagem aplicada. Veja [ambientes](docs/ENVIRONMENTS.md). O repositório criado pelo mantenedor é público; nenhum dado pessoal ou segredo está incluído.

### Áudio do catálogo

As 7 palavras e os 26 nomes de letras usam MP3 gerados com **edge-tts 7.3.1**, voz **pt-BR-FranciscaNeural**, velocidade **-15%**. O aplicativo apenas reproduz os arquivos da própria origem; não depende de Edge TTS durante o uso e não envia progresso ou dados pessoais. Os arquivos entram no cache offline. A voz ainda precisa de revisão pedagógica de pronúncia; nomes de letras não são fonemas.

A geração é uma ferramenta opcional de desenvolvimento, separada das dependências do servidor:

```sh
python -m pip install -r requirements-audio.txt
python scripts/generate_audio.py
```

Esse comando precisa de internet e envia ao serviço Microsoft Edge **somente os 33 textos genéricos fixos do catálogo**. Não aceita texto livre ou histórico da criança. Não roda em inicialização, deploy ou CI de testes. Oferece também as vozes pt-BR Antonio e Thalita por `--voice`. A voz é validada contra o catálogo online antes de gerar. Os arquivos só são substituídos depois da geração completa; falha de rede preserva o catálogo anterior.

`frontend/assets/audio/manifest.json` registra provedor, versão, voz, taxa, transcrições e hashes de cada MP3. `scripts/generate_audio_espeak.py` preserva a alternativa antiga, de qualidade mais robótica; não é o padrão. Edge TTS usa um serviço online do Edge, não a API contratada do Azure Speech, e sua disponibilidade pode variar. Biblioteca e serviço têm condições próprias; ver [licenças](THIRD_PARTY_LICENSES.md).

Em redes gerenciadas que usam CA própria, `--ca-file /caminho/ca-confiavel.pem` acrescenta o certificado confiável ao verificador; a validação TLS nunca é desligada. Proxy HTTPS configurado no ambiente é reutilizado sem ser registrado nos logs.
