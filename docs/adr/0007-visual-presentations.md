# ADR 0007 — Variações visuais sem inferir generalização

Status: experimental, 26/11/2026.

O mantenedor autorizou explorar PEIXE, POLVO e ÁGUA com novas imagens. Mantemos as originais e acrescentamos duas SVGs por palavra, sem mudar o áudio ou enviar imagens pessoais. As demais palavras seguem com uma imagem.

Um select e um botão permitem escolher livremente. Não há alternância aleatória, temporal ou forçada. A escolha não toca áudio e não salva progresso por si só. Antes da primeira interação da rodada, define o contexto; após começar, preserva a resposta e registra as imagens disponibilizadas. Após concluir, a troca abre uma nova rodada sem reescrever a conclusão anterior.

`visualIds` contém IDs genéricos (até três). `image-mixed` identifica rodadas com troca, que não entram na contagem de uma imagem isolada. Eventos antigos com `contextId:image-v1` são compatíveis; eventos sem identificação continuam desconhecidos. O que foi apresentado não é o que a pessoa necessariamente olhou ou reconheceu.

O planejador pode propor outra ilustração da mesma palavra, oferecendo modelo e pistas, sem afirmar generalização ou avaliar capacidade. A revisão pedagógica deve examinar representatividade, contraste, ambiguidade de recipientes com água e associação ao conceito. Não há modelo de visão, câmera, upload ou análise de olhar. Cache v10 disponibiliza os recursos offline; exportação schemaVersion 4 preserva eventos anteriores.
