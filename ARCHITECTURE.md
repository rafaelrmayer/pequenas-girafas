# Arquitetura V0.1

Aplicação independente, sem autenticação compartilhada ou transferência entre projetos. Uma origem FastAPI serve HTML/CSS/ES modules sem compilação, SVGs originais e catálogo JSON versionado. Python 3.12; dependências fixadas. Docker usa usuário sem privilégios, logs de acesso desativados e um processo Uvicorn. Compose expõe apenas localhost.

## Fronteiras

- `frontend/app.mjs`: interação por botões nativos, estados da rodada, configuração e acessibilidade.
- `frontend/ai/adaptive-learning/engine.mjs`: regras puras, sem rede, relógio ou identificadores pessoais.
- `frontend/ai/semantic-expansion/graph.mjs`: relações locais e recomendações ordenadas.
- `frontend/storage/store.mjs`: transações IndexedDB no object store `local`, banco `pequenas-girafas-v1`. Guarda chave `state` com eventos limitados e preferências. Sem localStorage, cookies ou transmissão.
- `frontend/accessibility/speech.mjs`: 33 MP3 pt-BR genéricos empacotados, com voz local portuguesa somente como alternativa em falha de arquivo; nunca reproduz automaticamente.
- `knowledge/vocabulary/fundo-do-mar.json`: catálogo de nós e arestas em um contrato. Regras ficam em `knowledge/pedagogical-rules/v0.1.json`.
- `backend/app/integrations/giraf.py`: adaptador mock independente. Converte exclusivamente palavras do catálogo nos contratos upstream. Não aceita texto livre ou dados pessoais.
- `frontend/sw.js`: cache explícito de recursos genéricos. Não intercepta outros hosts, consultas ou métodos diferentes de GET.

Fluxo: escolha e interação → motor local → sugestão opcional; conclusão → IndexedDB. Rede: download de arquivos e catálogo genéricos. Não há fluxo de eventos para o backend.

## Decisões e limites

Sem SQLite: não há catálogo editável ou dados centralizados nesta versão. Nenhuma chamada externa, token JWT, chave de IA ou treinamento. GIRAF será processo/repositório separado se integrado; REST por si só não resolve licenciamento. A análise C# é comparativa, não uma migração.

A sessão usa UUID efêmero somente local para distinguir conclusões em páginas carregadas separadamente. Não comprova que sessões ocorreram em dias diferentes ou que a criança reteve uma habilidade. As recomendações nunca determinam domínio.

Storage pode ser bloqueado ou apagado pelo navegador. A interface avisa quando uma conclusão não foi salva. Transações serializam as alterações locais para evitar perda em gravações simultâneas. Ao apagar registros, o estado da aplicação também é reiniciado. Cache continua contendo só recursos genéricos. Contas e múltiplos perfis não existem nesta versão.

Offline exige primeiro carregamento e Service Worker instalado em localhost/HTTPS. O identificador de cache deve mudar a cada conjunto de recursos novo. Não há sincronização de dados, infraestrutura de produção ou garantia de quota do dispositivo.
