# Primeira etapa de frases simples

O módulo independente `frontend/phrases` permite organizar oito frases fixas por seleção sequencial de cartões, com remoção e reinserção para mudar a ordem. Mouse, toque e teclado usam os mesmos botões nativos. Não exige arrastar, falar ou concluir palavras antes.

Catálogo genérico revisável: duas frases por tema, imagem de referência ao substantivo, palavras funcionais e ações escritas nos cartões. A imagem não é pictograma da frase inteira. Modelo opcional, pista apenas textual da primeira posição divergente e verificação da ordem do exemplo. Outras ordens não recebem diagnóstico de erro linguístico: o recurso não avalia expressão livre. Não há sorteio, tempo, notas ou níveis obrigatórios.

As oito narrações são MP3 locais gerados previamente por Edge TTS, com manifesto de origem/hash. Em uso não há chamada ao provedor. A preferência compartilhada de áudio ao conferir e o volume são respeitados; ao trocar de exemplo a reprodução é interrompida. A voz local é uma alternativa se o MP3 falhar, com mensagem quando indisponível. Catálogo/módulos/áudios entram no cache v18.

Escolhas ficam somente na memória da página, não são gravadas nem exportadas, e não entram no motor adaptativo ou nos relatórios existentes. Os eventos de palavra possuem semântica própria; não registrar frase como acerto de palavra. Persistência, relatórios específicos, continuidade semântica e expressão aberta exigem implementação posterior. Sem modelo treinado ou transferência entre projetos.

Validação pedagógica e testes com o público-alvo seguem pendentes. O número da versão do software não representa a conclusão integral da etapa V0.3 do roteiro.
