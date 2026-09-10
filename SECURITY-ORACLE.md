# Segurança da Oracle Worker

## Objetivo

A Oracle Worker é um serviço auxiliar do Vistta para automação sem Blaze. Ela deve operar com menor privilégio possível e sem comprometer a segurança do Firebase Spark.

## Principais regras

### 1. Não substituir as regras do Firebase

A Oracle Worker não é uma “bypass” para as regras e permissões do Realtime Database.

Ela deve:

- processar somente eventos válidos
- ler somente caminhos específicos e necessários
- não abrir acesso administrativo à aplicação
- não criar endpoint público sem autenticação

### 2. Service account e credenciais

NUNCA:

- incluir JSON de credencial no Git
- armazenar arquivo público em repositório
- colocar credencial no frontend
- usar credenciais de produção em ambiente local sem isolamento

Recomendado:

- `env`/`secret manager` no host Oracle
- arquivo protegido fora do repositório
- rotação periódica de chaves
- permissões limitadas ao mínimo necessário

### 3. Menor privilégio

A Oracle Worker deve ter:

- acesso somente aos path minimamente necessários
- leitura de eventos e armazenamento de fila
- escrita em histórico/logs apenas no escopo definido
- sem powers irrestritos sobre toda a base

### 4. Rede e host

Recomendações:

- firewall restritivo
- bloqueio de portas desnecessárias
- SSH somente via chave pública
- usuário `non-root` para execução do serviço
- update do sistema periódica
- logs de conexão, falha e login

### 5. Arquivo de ambiente

O arquivo de ambiente deve ficar fora do Git e fora do diretório público do projeto.

Exemplo de política:

```text
/etc/vistta/.env
/root/.config/vistta/.env
```

Sempre com permissão restrita e sem versionamento.

### 6. Backups

A configuração da Oracle deve ser salva e restaurada com segurança:

- `.env`
- certificados
- scripts de deploy
- configuração do serviço
- logs relevantes

### 7. Tratamento de falhas

- reinicialização da VM: tentar reprocessar pendentes
- queda de rede: manter fila local
- falha de provedor: retry controlado
- evento duplicado: ignorar

### 8. Observabilidade

O serviço deve registrar:

- evento recebido
- evento validado
- operação iniciada
- operação concluída
- erro com `eventId`/`operationId`
- retry e contagem de tentativas

### 9. Segurança por design

A Oracle Worker deve ser tratada como um serviço "confiável", mas separada do cliente. A interface do usuário nunca pode ser a origem da decisão final de automação. O backend e a fila precisam validar e registrar tudo.

## Checklist mínimo de hardening

- [ ] firewall
- [ ] usuário não-root
- [ ] SSH seguro
- [ ] atualizações do sistema
- [ ] logs
- [ ] secrets fora do Git
- [ ] backup da configuração
- [ ] filas persistentes
- [ ] retry controlado
- [ ] logs de auditoria
- [ ] endpoint público sem autenticação proibido

## Limites importantes

A Oracle Worker não substitui:

- Realtime Database Rules do Firebase
- autenticação do app
- validação de usuário e empresa no cliente
- qualquer camada de autorização do backend do Vistta

Ela apenas executa automações confiáveis e separadas, respeitando o Spark e mantendo o custo sob controle.
