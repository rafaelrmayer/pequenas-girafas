# Área de Histórias, cartões e desenho livre

Histórias passa a painel próprio da navegação inferior, com estado de edição, foco e posição preservados ao trocar de área. Há quatro links com ícones e texto: Atividades, Histórias, Apoios e Responsáveis. Links diretos continuam funcionando; trocar de área interrompe áudio sem descartar o trabalho.

Cada página pode usar frase pronta ou sequência livre de até 12 IDs do banco fixo de 49 palavras. Repetição, retirada e troca de ordem são permitidas, sem conferência linguística ou critérios de capacidade. A combinação exata de uma frase existente usa a gravação completa. Outras usam sequência de MP3 de palavras; stop, navegação e nova reprodução interrompem a sequência. Foram geradas previamente 25 gravações genéricas, preservando as 74 existentes. Não há texto de usuário enviado ao Edge TTS.

A imagem pode ser a dupla de figuras existente ou desenho próprio. Canvas 600×400 permite mouse, toque, caneta e teclado (setas, Enter/Espaço, Esc, Tab), cores fixas, três espessuras, borracha e dez passos de desfazer. Só o bitmap PNG final entra na página; coordenadas, pressão e tempo não são persistidos. A borracha remove pixels com destination-out. O cursor de teclado é uma sobreposição e não entra na imagem. Traços e desenhos não são avaliados ou classificados.

Rascunhos formatos 1 e 2 são aceitos; o modelo normaliza em memória para 2 sem regravar automaticamente. Páginas prontas mantêm seus IDs; novas páginas podem ter tokenIds e drawing. Drawing aceita somente data URL PNG, assinatura/dimensões fixas e até 1.400.000 caracteres. SVG e URL externa não são aceitos. Imagens são decodificadas antes da edição; falha preserva a página original. CSP permite img-src data: para essa exibição, mantendo scripts, mídia e conexões na própria origem.

Adicionar/Atualizar confirma a página; Salvar confirma o rascunho. São mantidas seis páginas e um rascunho por perfil. Cópia schemaVersion 7 inclui a última versão salva, inclusive PNGs, mas não escolhas ainda pendentes no editor. Global erase limpa canvas, imagens do leitor, cartões, desfazer e estado salvo. Não há novos eventos de aprendizagem, uso pelo planejador, upload, câmera, análise de imagem ou treino com desenhos. Cache v24 inclui os módulos e áudios genéricos; desenhos não entram no cache de recursos.

Biblioteca com várias histórias, digitação livre, exportação em livro e geração de recursos ficam para etapas posteriores. Interface e conteúdo seguem experimentais e pendentes de validação pedagógica/acessibilidade com o público-alvo.
