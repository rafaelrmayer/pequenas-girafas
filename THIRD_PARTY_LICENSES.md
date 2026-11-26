# Componentes e licenças

## Código próprio

Interface, SVGs e motores desta V0.1 foram criados para o projeto. O mantenedor ainda deve definir a licença de distribuição do código próprio antes de torná-lo público. Ausência de LICENSE não concede licença de software livre. O mantenedor criou o repositório público. Não há produção; nenhuma licença de distribuição do código próprio foi concedida ainda.

## Referências GIRAF

AAU GIRAF, Aalborg University: https://giraf.cs.aau.dk/students/ e https://github.com/aau-giraf.

GIRAF-ai e GIRAF-ai-v2: GNU GPL v3, commits e caminhos em `docs/GIRAF_REVIEW.md`. Nenhum fonte ou asset desses repositórios foi incorporado. Apenas contratos foram analisados. Qualquer distribuição futura de código derivado exige preservar licença, copyright, créditos e oferta de fonte aplicável. Microserviço separado não dispensa análise das obrigações. GIRAF-core-v2 não foi utilizado; verificar sua licença no commit se vier a ser integrado.

## Dependências diretas

- FastAPI: MIT — https://github.com/fastapi/fastapi
- Pydantic: MIT — https://github.com/pydantic/pydantic
- Uvicorn: BSD-3-Clause — https://github.com/encode/uvicorn
- pytest (testes): MIT — https://github.com/pytest-dev/pytest
- HTTPX (testes): BSD-3-Clause — https://github.com/encode/httpx
- fake-indexeddb (testes): Apache-2.0 — https://github.com/dumbmatter/fakeIndexedDB
- Playwright (testes): Apache-2.0 — https://github.com/microsoft/playwright

As distribuições mantêm os avisos próprios; dependências transitivas e a imagem Python têm licenças adicionais e precisam de inventário antes de distribuição estável. Fontes são do sistema operacional, sem download de webfont. Vozes são recursos instalados e suas condições dependem do fornecedor/SO. Não distribuímos modelo de voz. Ilustrações não são pictogramas ARASAAC ou assets GIRAF e não devem ser apresentadas como validadas por essas instituições.

## Áudio sintético do catálogo

Os 33 MP3 foram gerados offline com eSpeak NG 1.52.0 (voz `pt-br`, velocidade 145) e codificados com FFmpeg/libmp3lame. Fonte do sintetizador: https://github.com/espeak-ng/espeak-ng (GPL-3.0-or-later); pacotes oficiais Debian 1.52.0+dfsg-5 usados apenas na geração. Código, bibliotecas e bases de voz do sintetizador não foram incorporados ao aplicativo. São distribuídas somente as gravações de palavras genéricas e nomes de letras, com transcrições e comandos em `scripts/generate_audio.py`. Não há clonagem de voz ou gravação de usuários. Revisão de pronúncia e licença própria do projeto continuam pendentes.
