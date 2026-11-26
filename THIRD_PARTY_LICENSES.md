# Componentes e licenças

## Código próprio

O código próprio, a interface e os SVGs originais são disponibilizados sob a PolyForm Noncommercial 1.0.0, conforme [LICENSE](LICENSE). Preservar o aviso de autoria em [NOTICE](NOTICE) ao redistribuir. A licença cobre somente os direitos do titular sobre esses materiais; não relicencia dependências, ferramentas, vozes ou outros componentes de terceiros.

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

Os 33 MP3 foram gerados offline com eSpeak NG 1.52.0 (voz `pt-br`, velocidade 145) e codificados com FFmpeg/libmp3lame. Fonte do sintetizador: https://github.com/espeak-ng/espeak-ng (GPL-3.0-or-later); pacotes oficiais Debian 1.52.0+dfsg-5 usados apenas na geração. Código, bibliotecas e bases de voz do sintetizador não foram incorporados ao aplicativo. São distribuídas somente as gravações de palavras genéricas e nomes de letras, com transcrições e comandos em `scripts/generate_audio.py`. Não há clonagem de voz ou gravação de usuários. Revisão de pronúncia continua pendente; a licença do código próprio está em LICENSE.

## Atualização do catálogo — Edge TTS

O catálogo atual substitui os áudios eSpeak por gravações geradas com `edge-tts==7.3.1`, voz Microsoft `pt-BR-FranciscaNeural`, taxa -15%. [Projeto upstream](https://github.com/rany2/edge-tts): LGPLv3 para a biblioteca e MIT apenas para `srt_composer.py`; nenhuma cópia ou modificação de fontes upstream foi incorporada. A ferramenta é dependência opcional de geração, ausente do runtime Docker. Não atribuir a licença da biblioteca aos direitos do serviço Microsoft ou às vozes. Esses termos devem ser revisados antes da distribuição estável. Não há contratação de Azure, chave paga ou treinamento/clonagem de voz nesta entrega.

O manifesto ao lado dos MP3 contém transcrições genéricas e hashes. A geração usa o serviço online uma vez por catálogo; o aplicativo distribuído toca somente os arquivos locais. O script eSpeak foi mantido como alternativa histórica, mas os MP3 atuais não foram produzidos por ele.

As seis variações SVG de PEIXE, POLVO e ÁGUA da versão 0.1.6 foram desenhadas para este projeto com formas vetoriais originais. Não são fotos, pictogramas de bibliotecas externas nem assets GIRAF/ARASAAC. As imagens originais foram preservadas. Revisão pedagógica continua pendente. Os SVGs originais estão cobertos pela licença do código próprio em LICENSE.
