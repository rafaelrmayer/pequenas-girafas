# ADR 0004 — Edge TTS na preparação do catálogo

Status: adotada para testes, 26/11/2026, a pedido do mantenedor após avaliação da voz eSpeak.

A reprodução MP3 resolveu a indisponibilidade de vozes do navegador, mas o mantenedor considerou a voz robótica inadequada. Escolhemos gerar o catálogo com edge-tts 7.3.1, voz pt-BR-FranciscaNeural e taxa -15%. As vozes brasileiras foram verificadas no catálogo online e os 33 arquivos foram gerados com sucesso. Não se trata de integração com GIRAF ou Azure Speech.

A síntese ocorre somente na ferramenta de desenvolvimento, com textos fixos de palavras e nomes de letras. Não há entrada livre, dados pessoais, treinamento ou geração durante sessões. O runtime e a imagem Docker não incluem edge-tts. A aplicação distribui MP3 na mesma origem, com reprodução por botão e cache offline.

A ferramenta usa TLS verificado, proxy configurado no ambiente e, opcionalmente, CA confiável adicional. O serviço depende da disponibilidade do Edge; falhas de geração preservam o catálogo anterior. Não alegamos SLA, acesso permanente gratuito ou licença do serviço equivalente à licença LGPL da biblioteca.

O manifesto registra versão, voz, taxa, transcrições e hashes. A voz ainda deve ser avaliada pelo mantenedor e revisada pedagogicamente. O gerador eSpeak permanece como alternativa histórica, sem substituir automaticamente o catálogo escolhido.
