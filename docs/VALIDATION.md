# Verificação da fundação — 26/11/2026

## Executado

- 6 testes Python/FastAPI: catálogo e grafo consistentes, recursos mock, rotas somente leitura, segurança, assets offline e caminhos independentes do diretório de execução.
- 9 testes Node: evidência desconhecida, sessões distintas, apoio e critério configurável, formato mínimo de evento, ordenação semântica, acentos/letras repetidas, vozes locais/fallback silencioso e persistência transacional com limite/exclusão. IndexedDB é emulado por fake-indexeddb nesses testes.
- Sintaxe JavaScript, compilação Python, XML dos SVGs, JSONs, comando JSON do Docker, IDs da interface e referências locais da documentação.

Resultado: 15 testes passaram. O TestClient emite um aviso de depreciação sobre HTTPX/HTTPX2 na versão atual da Starlette; os contratos testados passaram. Não silenciamos esse aviso; revisar a migração de dependências em atualização futura.

## Navegador na CI

Os 5 cenários Playwright passaram na execução 45861483368: atividade/persistência/exclusão/exportação; teclado/pistas/celular; adaptação opcional entre sessões; recarga offline; armazenamento/voz indisponíveis. As capturas de computador e celular foram inspecionadas. A inspeção identificou herança incorreta de cor no modo escuro; a correção inclui uma verificação de contraste de texto e deve passar novamente na CI.

Não houve confirmação manual em TalkBack/voz pt-BR real. Não houve build/execução Docker, integração real GIRAF, testes da suíte upstream ou publicação em produção. TestClient exercitou a aplicação em processo; o navegador rodou somente na CI, sem servidor de prévia local neste ambiente gerenciado.

## Antes de apresentar como V0.1 validada

Executar a CI do repositório, revisar capturas e testar em dispositivo real. Confirmar localmente PEIXE por toque/teclado, voz portuguesa instalada ou aviso explícito, recarga/offline, exclusão e preferências. Validação pedagógica, auditoria AA e licença própria de distribuição continuam pendentes e não são comprovadas por testes técnicos.
