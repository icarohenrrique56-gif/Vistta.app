# Firebase no VISTTA

## Estado atual

Projeto Firebase: `vistta-2e1df`.

O VISTTA usa atualmente:

- **Authentication**: e-mail/senha, Google Login por redirect, logout e recuperação de senha.
- **Realtime Database**: perfis, empresas, cadastros, estoque, caixa, vendas e isolamento multiempresa.
- **Hosting**: frontend Vite publicado em `https://vistta-2e1df.web.app`.
- **Analytics**: integração opcional e carregada sob demanda quando `VITE_FIREBASE_MEASUREMENT_ID` está configurado e o navegador suporta Analytics.

## Compatibilidade com Spark

| Recurso | Estado | Observação |
| --- | --- | --- |
| Authentication | Usado | Os provedores usados são compatíveis com a cota gratuita aplicável. |
| Realtime Database | Usado | Sujeito às cotas de armazenamento e transferência do plano. |
| Hosting | Usado | Sujeito à cota gratuita de armazenamento e transferência. |
| Analytics | Integrado opcionalmente | Não envia senhas, tokens, nomes, e-mails ou valores financeiros. |
| App Check | Não ativado | Requer registro de reCAPTCHA e rollout controlado para não bloquear desenvolvimento. |
| Storage | Não usado | O sistema ainda não possui fluxo de anexos/imagens que justifique ativá-lo. |
| Cloud Messaging | Não usado | Não há requisito de notificações push implementado nem service worker FCM. |
| Remote Config | Não usado | Não há parâmetros remotos não sensíveis necessários atualmente. |
| Performance Monitoring | Não usado | Deve ser avaliado depois de definir metas de performance; não é necessário para o ERP funcionar. |
| Crashlytics | Não usado | Não há integração web equivalente adotada neste projeto; erros críticos são registrados localmente de forma estruturada. |
| Firestore | Não usado | O Realtime Database permanece adequado aos fluxos atuais. |
| Extensions | Não instaladas | Nenhuma extensão é necessária para o funcionamento atual. |
| Firebase AI Logic | Não usado | Não há caso de uso aprovado nem orçamento para IA. |

## Recursos que exigem Blaze

- **Cloud Functions**: o projeto possui Functions integradas ao `firebase.json` para venda, caixa e gestão de vendedores; a compatibilidade de billing deve ser confirmada antes do deploy.
- Extensions que dependam de Cloud Functions, Billing ou serviços pagos.
- Recursos que ultrapassem as cotas gratuitas do produto.

Como Cloud Functions Gen2 exige APIs de build/Artifact Registry que não podem ser habilitadas no Spark, o `firebase.json` padrão não registra Functions. Assim, `firebase deploy` publica somente Hosting e Realtime Database e não tenta ativar billing. A configuração isolada `firebase.functions.json` é mantida apenas para análise futura; não deve ser usada no Spark.

## Política obrigatória de custo

O VISTTA deve permanecer no plano Spark e buscar custo de **R$ 0,00** sempre que tecnicamente possível. Nenhum agente, script ou automação pode habilitar billing, migrar para Blaze ou ativar recursos pagos sem autorização explícita.

Antes de qualquer alteração que envolva Cloud Functions, Cloud Run, Storage, Firestore, extensões, APIs pagas ou serviços externos:

1. Identificar o recurso e a possibilidade de cobrança.
2. Verificar uma alternativa compatível com o Spark.
3. Preferir a alternativa gratuita e reduzir leituras, gravações, listeners, chamadas, tráfego e armazenamento.
4. Não alterar plano, billing ou conta de faturamento.
5. Se não houver alternativa, interromper a implementação e informar: `ESTA FUNCIONALIDADE EXIGE BLAZE`.

Deploys devem ser revisados por serviço antes da execução. Não usar `firebase deploy` de forma ampla quando um deploy seletivo for suficiente.

O sistema usa Firebase Authentication, Cloud Functions e Realtime Database. As Functions processam operações críticas e o banco permanece Realtime Database; nenhuma migração para Firestore ou Data Connect foi feita.

## Eventos Analytics implementados

Quando Analytics está disponível, o frontend registra apenas eventos de produto:

- `login` com método (`password` ou `google`);
- `logout`;
- `login_google`;
- `empresa_criada`.

Não são enviados e-mails, nomes, UID, tokens, senhas, valores de venda ou dados de clientes.

## Segurança

- Claims de developer são definidas exclusivamente por Admin SDK.
- Frontend não decide autorização de banco.
- Realtime Database Rules isolam cada `empresaId`.
- Leitura global exige `role == developer` e `platformOwner == true` no token.
- App Check não deve ser ativado sem configurar reCAPTCHA e testar localhost/produção separadamente.
- Variáveis `VITE_*` são configuração pública do app Web; credenciais Admin SDK nunca devem ser colocadas no frontend.

## Configuração manual

1. Em Authentication, manter Google ativado e os domínios autorizados cadastrados.
2. Em produção, cadastrar `VITE_FIREBASE_MEASUREMENT_ID` se Analytics for desejado.
3. Aplicar claims de developer usando Admin SDK e renovar o token com logout/login.
4. Não ativar Blaze automaticamente. Fazer upgrade somente se Functions/Storage/recursos além das cotas forem necessários.

## Decisões não implementadas

Storage, FCM, Remote Config, Performance Monitoring, Firestore e Extensions não foram adicionados apenas para aumentar a lista de serviços. Cada um exige uma necessidade funcional, configuração externa ou estratégia de quota que ainda não existe no VISTTA.
