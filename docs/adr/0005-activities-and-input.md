# ADR 0005 — Atividades distintas e entradas equivalentes

Status: experimental, 26/11/2026.

O mantenedor pediu associação imagem–palavra, completar uma letra e arraste opcional. Mantemos escolha livre, sem trilha rígida. As atividades têm tipos explícitos (`build`, `missing`, `match`); apenas construir a palavra inteira alimenta a sugestão de apoio dessa habilidade. Registros antigos sem tipo são interpretados como build e preservados sem migração destrutiva. Exportações passam a versão 2.

O estado de letras usa posições fixas e chaves únicas, evitando colapso de espaços e duplicação das letras repetidas. Posições pré-preenchidas são imutáveis na atividade missing. Arraste entre posições troca as peças; uma peça do banco pode substituir a letra de uma posição editável. Dropar fora ou cancelar não registra erro ou progresso.

Mouse usa HTML drag-and-drop; toque/caneta usam Pointer Events com segurar por 250 ms. Não medimos ou salvamos duração, precisão ou velocidade. Toque simples e teclado são alternativas completas. Nenhuma soltura conclui a atividade automaticamente: a confirmação e a leitura ao acertar continuam sob ação do usuário.

A associação não mostra o modelo textual até uma pista; o alt da imagem continua descritivo, mesmo que ajude a identificar o alvo. Isso garante acesso e reforça que não estamos avaliando capacidade. Escolhas variam em ordem ao repetir; todas as palavras permanecem disponíveis. Sem dependências, rede externa ou mudança de provedor de áudio.
