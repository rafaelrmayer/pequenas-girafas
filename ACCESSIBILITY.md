# Acessibilidade V0.1

Referência: WCAG 2.2 AA. Não declaramos conformidade concluída: faltam auditoria manual, leitores de tela reais e testes com usuários e profissionais.

Implementado: botões nativos com área mínima próxima de 48px; letras em botões e seleção por toque/clique/Enter/Espaço; retirada de letras por botão; nenhum arrastar obrigatório; sem fala, câmera ou microfone; modelos e pistas opcionais; sem cronômetro, ranking, sons automáticos ou animações; foco visível; título e grupos nomeados; mensagens de status; texto alternativo em imagens de atividade; ilustrações de recomendações decorativas; modo visual reduzido, fundo escuro, letras minúsculas e volume ajustável; preferência por movimento reduzido respeitada. Fontes locais de sistema, corpo 16px e metadados usuais 14px.

O alfabeto mostra maiúsculas/minúsculas, nomes lidos apenas por solicitação e exemplos nas palavras. Nomes de letras não equivalem a fonemas. Há MP3 pt-BR para todas as palavras e nomes de letras; não é preciso instalar voz. Se arquivo e alternativa local falharem, há mensagem junto ao botão; som não é requisito de conclusão. A reprodução pode ser interrompida e é cancelada ao trocar de palavra/sair.

Testes automatizados de navegador cobrem teclado, largura de celular, mensagens, persistência e offline. Não substituem TalkBack, NVDA/VoiceOver, contraste calculado, zoom 200–400%, acionadores alternativos, distração visual e validação motora/pedagógica. Leituras de ÁGUA e nomes de letras devem ser revistas com vozes locais pt-BR em dispositivos reais.

Próxima revisão: contraste em todos os estados, comportamento de foco durante edição e erro, leitura de letras repetidas, clareza de pictogramas, tamanhos de toque, uso sem som, com baixa visão e diferentes idades. Estética não infantilizadora configurável é etapa futura.

A leitura ao acertar ocorre somente após clicar/acionar “Conferir palavra” numa construção correta; é informada ao lado da ação e pode ser desligada nos ajustes locais. Respeita volume zero; não toca ao abrir a página, pedir pistas ou conferir uma construção incompleta/incorreta. O botão de ouvir continua disponível independentemente dessa preferência.

## Atividades e arraste opcionais

Três opções nativas de atividade, sem desbloqueios ou tempo de resposta. Letras em espaços vazios continuam acionáveis por teclado; letras predefinidas da atividade de completar ficam identificadas como já preenchidas. Letras repetidas têm chaves distintas, acentos são preservados e o tamanho motor do gesto nunca é usado como evidência de aprendizagem.

Mouse usa arraste nativo; toque/caneta usam segurar brevemente antes de mover. O limiar do gesto não é um tempo de atividade, não é medido ou salvo e pode ser evitado inteiramente pelo toque simples/teclado. A região das peças usa `touch-action:none`; o restante da página continua rolável. Soltar fora de um espaço ou cancelar não altera a atividade nem cria registro. Trocas entre espaços são permitidas, salvo as posições já preenchidas no exercício de letra ausente.

A associação usa descrição alternativa da imagem para acesso sem visão. Essa descrição pode nomear o conceito; o exercício não é uma prova de leitura ou capacidade. Pistas e escuta na associação contam como apoio, sem penalização. Revisão com leitores de tela e toque físico permanece necessária; a CI cobre ponteiro por eventos emulados e arraste de mouse nos navegadores.

As sugestões usam títulos, razões textuais e botões nativos com nome acessível específico. Aceitar leva o foco ao título da atividade; ignorar preserva a rodada e devolve o foco sem apagar letras. As preferências ficam na área de responsáveis, com selects e número limitado por validação nativa. O resumo distingue ausência de registro de observação com apoio. A paleta marrom/amarelo pastel e os recursos existentes de áudio, teclado e arraste foram preservados; a seção nova usa os mesmos estilos e contraste. Testes com leitores de tela e público-alvo continuam necessários.

As apresentações visuais são escolhidas por select nativo ou botão “Outra imagem”, sem animação, limite de tempo ou reprodução automática. Cada SVG tem título e texto alternativo descritivo próprio. O controle fica desativado quando a palavra tem apenas uma imagem. Trocar durante a rodada preserva letras e seleção; uma mensagem informa a troca e como será registrada. O áudio da palavra permanece disponível em qualquer imagem. As ilustrações de água em recipientes e animais em cenas exigem revisão pedagógica de clareza/ambiguidade; não são instrumentos de avaliação. A paleta e os recursos de teclado, contraste e arraste foram preservados.
