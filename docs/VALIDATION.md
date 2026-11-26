# Verificação da fundação — 26/11/2026

## Executado

- 6 testes Python/FastAPI: catálogo e grafo consistentes, recursos mock, rotas somente leitura, segurança, assets offline e caminhos independentes do diretório de execução.
- 9 testes Node: evidência desconhecida, sessões distintas, apoio e critério configurável, formato mínimo de evento, ordenação semântica, acentos/letras repetidas, vozes locais/fallback silencioso e persistência transacional com limite/exclusão. IndexedDB é emulado por fake-indexeddb nesses testes.
- Sintaxe JavaScript, compilação Python, XML dos SVGs, JSONs, comando JSON do Docker, IDs da interface e referências locais da documentação.

Resultado: 15 testes passaram. O TestClient emite um aviso de depreciação sobre HTTPX/HTTPX2 na versão atual da Starlette; os contratos testados passaram. Não silenciamos esse aviso; revisar a migração de dependências em atualização futura.

## Preparado, ainda não executado

5 cenários Playwright na CI: atividade/persistência/exclusão/exportação; teclado/pistas/celular; adaptação opcional entre sessões; recarga offline; armazenamento/voz indisponíveis. Ainda não executados porque este ambiente não dispõe do navegador de prévia suportado e a conexão GitHub não permite criar o repositório (`createRepository` recusado). Após o mantenedor criar um repositório privado vazio, enviar as branches e executar o workflow. Não instalar ou improvisar outro navegador local neste ambiente gerenciado.

Não houve inspeção visual de screenshot ou confirmação manual em TalkBack/voz pt-BR real nesta entrega. Não houve build/execução Docker, integração real GIRAF, testes da suíte upstream ou publicação em produção. TestClient exercitou a aplicação em processo, sem iniciar servidor de prévia.

## Antes de apresentar como V0.1 validada

Executar a CI do repositório, revisar capturas e testar em dispositivo real. Confirmar localmente PEIXE por toque/teclado, voz portuguesa instalada ou aviso explícito, recarga/offline, exclusão e preferências. Validação pedagógica, auditoria AA e licença própria de distribuição continuam pendentes e não são comprovadas por testes técnicos.
