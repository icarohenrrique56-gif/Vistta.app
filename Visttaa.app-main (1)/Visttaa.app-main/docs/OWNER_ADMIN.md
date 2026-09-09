# Owner e administração global

## Modelo de autoridade

O proprietário da plataforma não usa `role` empresarial. O acesso global é concedido por um custom claim do Firebase Auth:

```text
platformOwner: true
```

O frontend usa o claim apenas para navegação. As Callable Functions validam o claim no token antes de executar métricas, listagem global ou bloqueios.

## Bootstrap do primeiro OWNER

Não existe senha master nem cadastro público de OWNER. O primeiro claim deve ser aplicado por uma operação administrativa fora do navegador:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json \\
node functions/scripts/set-owner-claim.mjs UID_DO_USUARIO
```

Nunca versionar a service account ou colocar suas credenciais em `.env` do frontend. Depois de aplicar o claim, faça logout/login para renovar o ID token.

## Functions protegidas

- `getPlatformOverview`: métricas reais agregadas de empresas, usuários, cadastros recentes, logins conhecidos e auditoria.
- `listPlatformCompanies`: empresas e quantidade de usuários.
- `setCompanyStatus`: bloqueia ou desbloqueia uma empresa.
- `setUserStatus`: bloqueia ou desbloqueia usuário no Auth e no perfil RTDB.

As ações globais registram eventos em `platformAudit` pelo Admin SDK.

## Limitações atuais

- 2FA/MFA do OWNER ainda precisa ser habilitado no Firebase Authentication e configurado por provedor.
- Planos, assinaturas, pagamentos e receita do produto não existem no modelo atual; o painel informa `Não configurado` e não inventa valores.
- `empresaId` continua sendo o campo de compatibilidade do modelo atual. Memberships múltiplas devem ser migradas em uma etapa própria.
