# Changelog

## 0.1.13 — 2026-11-27

- Registros próprios de conclusões de frases, separados de palavras, com modelo, pistas e áudio solicitado antes da conclusão.
- Resumo local, limite independente de 200, exclusão conjunta e cópia JSON schemaVersion 5.
- Preserva estados antigos, evita duplicação por rodada e avisa quando apenas em memória. Cache v20.

## 0.1.12 — 2026-11-27

- Continuações opcionais por ações e complementos: 24 frases preparadas em quatro temas.
- Prévia preserva os cartões atuais; troca da frase exige escolha explícita.
- 16 gravações locais adicionais, cache v19, sem persistência de escolhas ou modelos treinados.

## 0.1.11 — 2026-11-27

- Construção de oito frases de exemplo em quatro temas, com cartões por toque ou teclado, modelo, pistas e correção livre.
- Narração completa com oito MP3 locais; preferências de volume, minúsculas e áudio ao conferir preservadas.
- Exploração sem persistência, separada dos registros e relatórios de palavras. Cache v18.

## 0.1.10 — 2026-11-27

- Prévia local de relatório por tema e período, com apoio, pistas, áudio e campos desconhecidos separados por atividade.
- Impressão/PDF pelo navegador, validação dos registros antes de imprimir e exclusão de prévias desatualizadas.
- Sem envio de históricos, identificação individual ou notas. Cache offline v17.

## 0.1.9 — 2026-11-27

- Lista opcional de revisitas por tema, com explicação de intervalo e datas desconhecidas/futuras.
- Preserva atividade de origem nas revisitas; preferências não fabricam evidências de outras atividades.
- Atualiza a lista somente com novas conclusões; personalização desligada não gera fila. Cache v16.

## 0.1.8 — 2026-11-27

- Temas Natureza e Frutas com seis palavras, imagens originais e áudios locais cada.
- Grafia com acentos e cedilha preservada nas atividades; categorias Plantas e Frutas nas preferências.
- Preserva temas e registros existentes. Cache offline v15.

## 0.1.7 — 2026-11-27

- Tema Astronomia com cinco palavras, imagens originais e áudios locais.
- Seleção explícita de tema, sugestões no tema atual e resumo dos registros de ambos os temas.
- Preserva os registros locais, as mídias anteriores e o tema Fundo do mar. Cache offline v13.
- Geração incremental dos áudios com manifesto e hashes; sem síntese em runtime.

## 0.1.6 — 2026-11-26

Três apresentações visuais para PEIXE, POLVO e ÁGUA, com escolha livre e novas sugestões opcionais. Trocar durante a rodada preserva a resposta e registra contexto misto; registros antigos sem imagem identificada continuam desconhecidos. Seis SVGs locais adicionais, cache offline e exportação schemaVersion 4. Sem análise de imagem ou inferência de generalização.

## 0.1.5 — 2026-11-26

Planejador local explicável, preferências explícitas e resumo por atividade. Datas de dia local e apresentações novas distinguem observações sem alegar retenção/generalização; registros antigos permanecem sem data. Conceitos explicativos no grafo, sugestões opcionais e revisita configurável. Sem envio do histórico ou modelos treinados.

## 0.1.4 — 2026-11-26

Associação entre imagem e palavra e completar uma letra, com escolha livre e registros separados. Arraste opcional por mouse e toque/caneta, posições fixas, troca de letras e cancelamento sem registro. Mantidos clique, teclado, áudio, dados locais e uso offline. Exportação schemaVersion 2 compatível com eventos antigos. Crédito de autoria no rodapé: Desenvolvido por Rafael Ricardo Mayer.

## 0.1.3 — 2026-11-26

Leitura da palavra ao confirmar uma construção correta, iniciada no clique antes de salvar o registro. Preferência local para desligar, volume respeitado e botão manual preservado. Sem som em erro, pista ou abertura de página.

## 0.1.2 — 2026-11-26

Substitui a voz eSpeak pelo catálogo gerado com Edge TTS/Francisca Neural pt-BR, mantendo reprodução e cache locais. Ferramenta de geração separada do runtime, com catálogo fixo, staging, manifesto e hashes. Nenhuma chamada de voz durante o uso da criança.

## 0.1.1 — 2026-11-26

Correção de áudio: catálogo MP3 pt-BR empacotado (palavras e nomes de letras), mensagens junto aos botões, volume zero explícito, cancelamento seguro e cache offline atualizado. CI cobre Chromium e Firefox, incluindo decodificação e reprodução sem vozes instaladas. A reprodução observada nos testes não comprova saída audível do dispositivo do usuário; revisão humana de pronúncia segue pendente.

## 0.1.0 — 2026-11-26

Fundação independente do Pequenas Girafas: exploração de letras e sete palavras do fundo do mar; PEIXE por botões acessíveis; pistas/modelo opcionais; regras e grafo locais; IndexedDB com resumo, exclusão e exportação; cache offline; apresentação configurável; leitura local opcional; backend de catálogo e GIRAF mock; Docker e testes automatizados. Sem produção, serviços pagos, dados reais de crianças ou alteração na Jornada de Bia.
