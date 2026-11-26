# ADR 0002 — GIRAF mock e voz local opcional

Status: adotada na V0.1, 26/11/2026.

Python GIRAF tem limites por rota e JWT, mas voz pt-BR não foi comprovada; C# usa fila persistente da/en. Escolhemos mock próprio de contratos e assets originais. Nenhum código GPL incorporado, token ou chamada externa. Leitura somente com Web Speech local em português e por botão. Ausência de voz é explicitada, sem fallback remoto. Integração real é uma revisão posterior; separar via REST não dispensa licenças e privacidade.
