# Análise GIRAF — 26/11/2026

Inspeção do código, não teste de produção dos provedores. Nenhum segredo foi usado, nenhum provedor contratado e nenhuma voz paga acionada. Repositórios públicos clonados apenas para análise, fora deste projeto.

## Fontes fixadas

- Python: https://github.com/aau-giraf/giraf-ai/tree/d1070783a26a92d0935edf3173936f79b5dc7200
- C#: https://github.com/aau-giraf/giraf-ai-v2/tree/9a1db1bde782499324196a3b38984003b2f779c9

Ambos apresentam GNU GPL v3. Nada do código foi copiado/incorporado; somente contratos públicos foram analisados. Preservar avisos e analisar obrigações antes de distribuir derivação ou microserviço modificado. Não afirmar que REST resolve GPL. GIRAF-core-v2 não foi incorporado ou auditado nesta entrega; validar a licença se houver uso futuro.

## Python: contratos confirmados

- `GET /api/v1/health`: sem JWT; verifica provedores; 200 healthy / 503 degraded.
- `POST /api/v1/generate/image`: JWT; `prompt` 1–500 caracteres, `style` pictogram/realistic/cartoon, `size` duas dimensões >0 e <=4096, `format` png/webp; resposta `image_base64`, `format`, `provider`.
- `POST /api/v1/tts`: JWT; `text` 1–2000, `language` string (padrão da), `voice` opcional e `format` mp3/wav/ogg; adapter Gemini aceita apenas wav. Resposta `audio_base64`, `format`, `duration_ms`, `provider`.
- `GET /api/v1/tts/voices?language=...`: JWT; `id`, `name`, `language`, `gender`.

Fontes: `api/image.py`, `api/tts.py`, `api/health.py`, `api/schemas.py`.

## Rate limiting real

`config/rate_limit.py` instancia SlowAPI com `get_remote_address`; `main.py` atribui `app.state.limiter` e handler 429. Decoradores reais: imagem `@limiter.limit("10/minute")`, TTS `@limiter.limit("20/minute")`. `tests/test_api.py` inclui cenário da 11ª imagem com 429. Logo, não é somente uma dependência declarada. Não executamos a suíte upstream nesta entrega; executamos testes do nosso adaptador e aplicação. Não identificamos limite equivalente nas rotas de health/voices. Limite em memória por IP não comprova proteção distribuída, limite global de concorrência ou teto financeiro.

## JWT e rede

`config/auth.py`: HTTPBearer, `jwt.decode` com algoritmo configurado (padrão HS256); segredo em Settings tem mínimo 32 caracteres. Não exige `exp` por `require` nem valida issuer/audience explicitamente. Endurecer para integração real, não emitir token no navegador. `settings.cors_allowed_origins` controla CORS; não está aberto por padrão. Imagens têm timeout 60/120s e TTS 30/60/120s conforme adapter. Strings têm tamanho limitado, mas isso não equivale a limite total de bytes de upload nem a orçamento. Erros de provider podem conter mensagens brutas; revisar sanitização antes de produção.

## Português brasileiro

Não confirmado ponta a ponta. Mock só lista da/en; Plapre marca da; Gemini lista oito vozes estáticas marcadas en. O filtro `language=pt-BR` nesse catálogo não retorna uma voz. No adapter Gemini, `request.language` não é convertido em parâmetro explícito na chamada; não presumir que aceitar a string pt-BR comprova síntese adequada. Um health check de modelo também não comprova voz portuguesa. Necessário revisar documentação atual do provedor, licença, custo, retenção e validar áudio autorizado antes de ativar.

Na V0.1 usamos voz local que Web Speech identifica como portuguesa (`localService=true`), preferindo pt-BR. A disponibilidade depende do SO/navegador. Quando ausente, não geramos áudio e avisamos. A compatibilidade real deve ser conferida no dispositivo do usuário, sem envio de dados pessoais.

## Comparação C#

`Giraf-AI/Controllers/TtsController.cs` usa `/api/tts`, retorna Accepted e escreve texto/pedido na fila PostgreSQL antes de processar. Aceita apenas da/en; `OriginApp` obrigatório. Difere do contrato síncrono/base64 Python e do objetivo sem histórico remoto do projeto. Exige adaptação e revisão de retenção; não é substituto direto. Não executado nesta análise.

## Decisão

V0.1: mock próprio e sem rede externa. `MockGiraf.image_request/tts_request` serializam os contratos Python com palavras genéricas do catálogo; o mock de imagem entrega a ilustração original empacotada e não finge responder com PNG gerado. O mock de TTS retorna `status=no_audio` e `audio_base64=null`. Isso testa a fronteira sem simular uma integração autenticada funcionando. Integração real, JWT e providers permanecem desativados e fora desta entrega.
