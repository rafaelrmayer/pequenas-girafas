# Registros locais de conclusões de frases

V0.1.13 adiciona `phraseEvents` ao mesmo estado IndexedDB, separado de `events` (palavras). Estados antigos recebem lista vazia ao carregar, sem inventar histórico anterior e sem alterar a versão física do banco. Transações preservam ambas as listas e preferências; cada lista mantém até 200 conclusões recentes. Apagar registros e preferências limpa as duas.

Somente uma conclusão por rodada é registrada. Recomeçar permite nova rodada; remover e recolocar cartões depois da conclusão não duplica o registro. Não são armazenados erros, montagens incompletas, interrupções, duração, velocidade ou texto livre. O evento contém IDs do catálogo (frase, exemplo e tema), dia local, outcome completed e indicadores booleanos de modelo, pista e áudio solicitado antes da conclusão. Sem novo identificador pessoal ou de sessão.

Modelo inclui Mostrar frase de exemplo e a prévia completa da continuação ativa quando visível. Esse uso permanece marcado ao fechar o apoio. Pistas são solicitações explícitas; áudio é solicitação explícita antes da conclusão, mesmo se reprodução falhar. Narração automática após conferir não altera a evidência anterior. O resumo distingue campos não informados de false. Nenhuma contagem comprova aprendizagem, independência ou capacidade.

O resumo fica na área de responsáveis, separado das palavras, sem entrar no planejador adaptativo ou relatório de palavras. A cópia JSON passa a schemaVersion 5 e inclui phraseEvents. Não há restauração nesta etapa. Em falha do armazenamento, o evento permanece apenas na memória da página e a interface avisa; recarregar pode perdê-lo. Não é enviado ao servidor.

Durante a gravação, controles da área de frases são bloqueados e o aplicativo impede concorrência com conclusão de palavras, exclusão ou exportação incompleta. Transações e limites são testados com dados sintéticos. Cache v20 distribui o novo módulo. Esta decisão substitui a ausência de persistência descrita nas etapas anteriores de frases; conteúdo pedagógico permanece experimental.
