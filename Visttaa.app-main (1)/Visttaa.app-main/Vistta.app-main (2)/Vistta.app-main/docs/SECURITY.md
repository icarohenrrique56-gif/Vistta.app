# Segurança

Controles existentes:

- `.env` ignorado e `.env.example` sem valores.
- Regras de leitura/escrita por usuário, empresa e papel.
- Functions exigem autenticação e validam a empresa.
- `addCashEntry` exige administrador, alinhado às regras.
- Venda usa preço e custo do produto armazenados no servidor.
- Venda possui chave de idempotência por `requestId`.

Riscos e ações externas:

- Restringir a API key Web por domínio no Google Cloud.
- Configurar Authorized domains no Firebase Auth.
- Rotacionar qualquer chave que tenha sido exposta fora do `.env`.
- Revisar regras com dados reais e Firebase Emulator antes do deploy.
- Atualizar dependências vulneráveis em janela controlada.
