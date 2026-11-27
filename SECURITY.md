# Segurança V0.1

Aplicação local experimental; sem credenciais, endpoints de gravação, autenticação de crianças ou integrações externas. API somente leitura de catálogo validado editorialmente. Recursos mock aceitam somente IDs conhecidos; não recebem prompts livres nem URLs. Nenhuma chave em navegador, Git, logs ou `.env.example`.

CSP restringe scripts, estilos e conexões à própria origem; frames, formulários e origens externas bloqueados. Imagens SVG originais estáticas. Conteúdo dinâmico inserido por `textContent`, sem HTML de usuário. Sem CORS amplo; mesmo servidor/origem. `nosniff`, `no-referrer` e Permissions-Policy para câmera/microfone/geolocalização. Sem acesso a esses dispositivos.

Docker usa usuário sem privilégios e Compose read-only, tmpfs e no-new-privileges. Pacotes fixados. A revisão de vulnerabilidades e atualização de dependências deve ocorrer antes da produção. A V0.1 não implementa controle de tráfego global; sem providers e sem rotas caras de geração. Não é um gateway público endurecido para abuso.

Dados locais não são criptografados; quem usa o perfil de navegador pode ler/exportar. Não tratar área de responsáveis como autenticação. Computador/dispositivo deve ser protegido pelo responsável. Cache genérico não guarda progresso. Registrar dados em backups locais não elimina a responsabilidade de protegê-los.

## Integração real futura

GIRAF Python requer JWT secreto forte. Validar expiração obrigatória, issuer/audience, algoritmo permitido, emissão segura e rotação; manter token no servidor, nunca no frontend. Adotar limite global de custos e concorrência, timeouts, limite total de corpo/resposta, origem exata, logs sem payload, mensagens sanitizadas e revisão de retenção/licença dos provedores. Limite por IP do upstream não é teto de gastos. Somente conteúdo genérico validado, nunca histórico ou texto pessoal.

Relate falhas de forma privada ao mantenedor no GitHub; não publique segredos ou dados pessoais em issues. Ainda não há canal de suporte público dedicado ou produção publicada.

Desde V0.1.17, img-src permite data: para exibir PNGs criados no editor local. O modelo valida prefixo PNG, tamanho, assinatura e dimensões 600×400; URLs externas e SVGs de usuário não são aceitos. script-src, connect-src e media-src continuam restritos à própria origem. Não há importação/upload de desenhos nem execução de conteúdo do rascunho como HTML.
