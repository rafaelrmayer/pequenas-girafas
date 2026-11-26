# Componentes e licenças

## Código próprio

Interface, SVGs e motores desta V0.1 foram criados para o projeto. O mantenedor ainda deve definir a licença de distribuição do código próprio antes de torná-lo público. Ausência de LICENSE não concede licença de software livre. Repositório privado para revisão; não há produção.

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
