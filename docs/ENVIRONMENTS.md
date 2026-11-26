# Principal e testes

O repositório é único. `main` recebe versões revisadas; `develop` recebe integração de novidades. Fluxo: branch de trabalho → PR para develop → CI e revisão no ambiente de testes → PR develop para main. A primeira fundação tem uma PR direta para main para inicializar o projeto; develop parte do mesmo conteúdo.

`render.yaml` prepara dois serviços Free separados, com branches e `APP_ENV` diferentes. Não foi aplicado e não autoriza publicação automática nesta entrega. Depois da autorização, conectar cada serviço ao repositório, Docker, raiz vazia, health `/health`, APP_ENV `principal` ou `testes`. Revisar disponibilidade/cotas Free antes de confirmar. Os nomes/URLs finais são definidos pelo Render.

Cada ambiente exibe sua identificação. A versão principal continua experimental até validação. O ambiente de testes não deve receber dados reais de crianças. URLs/origens distintas isolam IndexedDB e Service Worker; nunca colocar os dois ambientes só em caminhos da mesma origem. Sem transferência, migração ou sincronização automática do progresso. Portas diferentes também são origens diferentes em desenvolvimento.

Não renomear URL/origem sem avisar: os registros continuam no navegador vinculados à origem anterior. Apagar registros ou baixar cópias é decisão local do responsável. Publicar nova versão não apaga os registros do outro ambiente.

O cache offline precisa de versão nova quando os arquivos mudarem. APP_ENV é validado (`local`, `principal`, `testes`) no início. É metadado público, não segredo; não há chaves de provedores.
