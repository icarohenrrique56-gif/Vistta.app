# WhatsApp e lembretes óticos

## Implementação sem custo

O cadastro de clientes possui telefone, consentimento e datas de lembrete para óculos e lentes. A tela de clientes identifica lembretes vencidos e abre o WhatsApp com uma mensagem pré-preenchida usando `wa.me`.

Esse fluxo é manual: o atendente revisa a mensagem e envia. O link não dispara mensagens automaticamente e não exige API, servidor ou upgrade do Firebase.

## Disparo automático

Para envio automático, há três caminhos:

1. **WhatsApp Business Platform / Cloud API**: opção oficial da Meta. Exige Business Manager, número configurado, token protegido e templates aprovados. O envio fora da janela de atendimento depende de template e pode gerar cobrança conforme a política vigente da Meta.
2. **Provedor oficial, como Twilio ou Zenvia**: reduz parte da integração, mas adiciona custo por mensagem/conversa e dependência do fornecedor.
3. **Evolution API**: projeto open source que mantém uma sessão do WhatsApp e expõe uma API. O software pode ser gratuito, mas ainda exige hospedagem, manutenção, armazenamento de sessão e gestão de risco de bloqueio. Não é equivalente à API oficial.

Não usar automação por WhatsApp Web, Selenium ou credenciais de usuário em GitHub Actions. Isso expõe a conta e pode provocar bloqueio.

## Agendador compatível com o projeto

Como o projeto está no plano Spark, Cloud Functions não pode ser usado para o agendador. Uma opção posterior é um worker externo ou GitHub Actions agendado, com acesso somente leitura ao Realtime Database e um provedor de WhatsApp. O worker deve:

- selecionar clientes com `whatsappConsent == true` e lembrete vencido;
- registrar uma chave de deduplicação por cliente e tipo de lembrete;
- nunca enviar CPF, receita ou dados financeiros;
- limitar frequência e permitir opt-out;
- manter tokens apenas em secrets;
- gravar o resultado em um caminho dedicado somente depois que a integração estiver definida.

O esquema de lembrete foi mantido no cadastro atual para permitir essa evolução sem migrar o Realtime Database ou criar coleções especulativas.

## GlitchTip

A automação atual do GlitchTip continua separada do WhatsApp: ela analisa Issues, propõe patches e cria PR draft. O webhook para `repository_dispatch` depende da Function existente, que não pode ser publicada no Spark. Enquanto isso, o workflow pode ser disparado manualmente pelo GitHub Actions. Não misturar reparos de código com disparos de mensagens a clientes.