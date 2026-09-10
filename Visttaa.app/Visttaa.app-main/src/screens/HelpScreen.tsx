import React from 'react';
import { BookOpen, Wallet, ShoppingCart, Users, Boxes, ClipboardList, BarChart3, Mail, Linkedin, Instagram, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { CreatorLogo, ScreenHeader } from '../components/SharedUI';

const treinamentos = [
  { icon: Wallet, titulo: '1. Comece pelo caixa', passos: ['Acesse Caixa Diário.', 'Informe o fundo inicial e clique em Abrir Caixa.', 'Registre entradas, saídas e sangrias durante o dia.', 'Feche o caixa ao final da operação e confira o saldo.'] },
  { icon: ShoppingCart, titulo: '2. Registre uma venda', passos: ['Abra o PDV com o caixa aberto.', 'Pesquise e selecione os produtos do estoque.', 'Vincule o cliente, escolha a forma de pagamento e aplique descontos.', 'Clique em Vender para baixar o estoque e registrar a venda.'] },
  { icon: Users, titulo: '3. Cadastre clientes e receitas', passos: ['Abra Clientes e clique em Novo Cliente.', 'Preencha dados pessoais, endereço e contato.', 'Registre a receita de longe e perto com médico, CRM e data.', 'Use o WhatsApp e o histórico do cliente para acompanhar o atendimento.'] },
  { icon: Boxes, titulo: '4. Organize o estoque', passos: ['Cadastre produtos por categoria.', 'Informe custo, venda, estoque mínimo e fornecedor.', 'Use os alertas de estoque crítico para planejar reposições.', 'Mantenha tratamentos e especificações preenchidos para o laboratório.'] },
  { icon: ClipboardList, titulo: '5. Acompanhe uma OS', passos: ['Crie uma OS ou converta um orçamento aprovado.', 'Selecione armação, lentes e tratamentos.', 'Atualize o status: montagem, laboratório, pronto ou entregue.', 'Informe previsão de entrega e observações para a equipe.'] },
  { icon: BarChart3, titulo: '6. Controle o financeiro', passos: ['Lance contas a pagar e receber.', 'Vincule despesas aos fornecedores quando aplicável.', 'Acompanhe faturamento, CMV, lucro e fluxo de caixa.', 'Use o DRE para conferir o resultado da operação.'] }
];

const tutorialIntro = [
  { step: '1', title: 'Faça o primeiro login', text: 'Entre com seu e-mail e senha ou use o Google para entrar rapidamente.' },
  { step: '2', title: 'Abra o caixa', text: 'Antes de vender, abra o caixa diário para registrar entradas, saídas e fechamento.' },
  { step: '3', title: 'Cadastre clientes e produtos', text: 'Registre clientes, tratamentos, estoque mínimo e preços de venda para operar sem retrabalho.' },
  { step: '4', title: 'Acompanhe as metas', text: 'Use dashboard, financeiro e ordens de serviço para monitorar performance e evitar atrasos.' }
];

export function HelpScreen() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 sm:gap-6 md:gap-8 px-0 pb-8 sm:px-1">
      <ScreenHeader eyebrow="Suporte / Central de treinamento" title="Ajuda e treinamento" description="Aprenda o fluxo recomendado para operar a VISTTA com segurança e manter os dados da ótica organizados." />

      <section className="rounded-3xl border border-[#e9e2ff] bg-[#f7f3ff] p-4 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6d4aff] text-white"><Sparkles size={20} /></div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#6d4aff]">Tutorial de introdução</p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Primeiros passos no VISTTA</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tutorialIntro.map((item) => (
            <div key={item.step} className="rounded-2xl border border-[#e7ddff] bg-white p-4 shadow-sm">
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#efe7ff] text-sm font-black text-[#6d4aff]">{item.step}</div>
              <h3 className="mb-2 text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {treinamentos.map(({ icon: Icon, titulo, passos }) => <article key={titulo} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#4A3AFF] dark:bg-indigo-900/30"><Icon size={20} /></div><h2 className="font-bold text-slate-900 dark:text-white">{titulo}</h2></div>
          <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">{passos.map(passo => <li key={passo} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />{passo}</li>)}</ol>
        </article>)}
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 dark:border-indigo-900/50 dark:bg-indigo-950/30">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#080a12] p-1.5"><CreatorLogo className="h-full w-full" solidWhite={false} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6d4aff]">Atendimento corporativo</p><h2 className="text-lg font-bold text-slate-900 dark:text-white">Suporte VISTTA · AXXIS7</h2></div></div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Envie sua dúvida com o nome da ótica, usuário e uma descrição do que aconteceu. Nossa central cobre acesso, dados, fluxo e operação do sistema.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a href="mailto:icaroprojetos7@gmail.com" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#4A3AFF] shadow-sm hover:bg-slate-50 dark:bg-slate-800"><Mail size={18} /> icaroprojetos7@gmail.com</a>
          <a href="https://www.linkedin.com/in/7icaaro" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0A66C2] px-4 py-3 text-sm font-bold text-white hover:bg-[#0959a8]"><Linkedin size={18} /> LinkedIn de suporte</a>
          <a href="https://www.instagram.com/aaxxis7?stkn=MWsxMXo2cWRsdDN6cw==" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#30204d] px-4 py-3 text-sm font-bold text-white hover:bg-[#241638]"><Instagram size={18} /> Instagram da AXXIS7</a>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#d8cdf7] bg-white/60 p-4 text-sm text-slate-700">
          <ShieldCheck size={18} className="text-[#6d4aff]" />
          Central de suporte: acesso, login, fluxo de operação, dados, cadastros, relatórios e deploy.
        </div>
        <div className="mt-5 border-t border-indigo-100 pt-4 dark:border-indigo-900/50"><p className="text-xs font-semibold text-slate-600 dark:text-slate-300">AXXIS7 · Desenvolvimento e manutenção do sistema VISTTA</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">A VISTTA é propriedade intelectual da AXXIS7. Todos os direitos reservados.</p></div>
      </section>
    </div>
  );
}
