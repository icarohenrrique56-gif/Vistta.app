import React from 'react';
import { ModalBase, ScreenHeader } from '../components/SharedUI';
import { FormCliente } from '../components/Forms/FormCliente';
import { Plus, Edit2, Search, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Cliente } from '../types';

export function ClientesScreen() {
  const { clientes, salvarCliente, excluirCliente, vendas, ordensServico } = useAppContext();
  const [clienteEditando, setClienteEditando] = React.useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [formDirty, setFormDirty] = React.useState(false);

  const fecharModal = () => {
    if (formDirty && !window.confirm('Você possui alterações não salvas. Deseja descartar?')) return;
    setFormDirty(false);
    setModalAberto(false);
    setClienteEditando(null);
  };
  const clientesFiltrados = clientes.filter(cliente => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [cliente.nome, cliente.cpf, cliente.tel, cliente.email].some(value => String(value || '').toLowerCase().includes(query));
  });
  const hoje = new Date().toISOString().slice(0, 10);
  const lembretesVencidos = (cliente: Cliente) => [
    cliente.lembreteOculosEm && cliente.lembreteOculosEm <= hoje ? 'óculos' : '',
    cliente.lembreteLenteEm && cliente.lembreteLenteEm <= hoje ? 'lentes' : ''
  ].filter(Boolean);
  const whatsappUrl = (cliente: Cliente) => {
    const itens = lembretesVencidos(cliente);
    const mensagem = itens.length ? `Olá, ${cliente.nome}! Está na hora de revisar suas ${itens.join(' e ')}. Podemos agendar seu atendimento?` : `Olá, ${cliente.nome}! Podemos ajudar com sua próxima revisão ótica?`;
    return `https://wa.me/${(cliente.tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
  };

  const salvar = async (data: Partial<Cliente>) => {
    await salvarCliente(data, clienteEditando?.id);
    setFormDirty(false);
    setModalAberto(false);
    setClienteEditando(null);
  };
  
  return (
    <div className="flex flex-col h-full">
      <ScreenHeader eyebrow="Cadastros" title="Clientes & Receitas" description="Gestão de contatos e prontuários óticos." action={<button onClick={() => { setClienteEditando(null); setModalAberto(true); }} className="flex w-full items-center justify-center rounded-xl bg-[var(--vistta-plum)] px-6 py-3 font-semibold text-white shadow-md hover:bg-[var(--vistta-violet)] sm:w-auto">
          <Plus size={20} className="mr-2" /> Novo Cliente
        </button>} />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
        <div className="border-b border-slate-100 p-4"><div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="search" aria-label="Buscar clientes" placeholder="Buscar nome, CPF, telefone ou e-mail..." value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none focus:border-[var(--vistta-violet)]" /></div></div>
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] text-slate-400 uppercase tracking-wider font-semibold sticky top-0 bg-white">
                <th className="py-4 px-6">Cliente / CPF</th>
                <th className="py-4 px-6">Contato</th>
                <th className="py-4 px-6">Médico Responsável</th>
                <th className="py-4 px-6 text-center w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientesFiltrados.map((c: Cliente) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-[14px]">{c.nome}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{c.cpf || 'Sem CPF'}</div>
                  </td>
                  <td className="py-4 px-6 text-[14px] font-medium text-slate-600"><a href={whatsappUrl(c)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{c.tel}</a><div className="text-[11px] text-slate-400 mt-1">{vendas.filter(venda => venda.cliId === c.id).length} compra(s) · {ordensServico.filter(os => os.clienteId === c.id).length} OS</div>{lembretesVencidos(c).length > 0 && <div className="mt-1 text-[11px] font-bold text-amber-600">Revisão vencida: {lembretesVencidos(c).join(' e ')}</div>}{c.whatsappConsent && <div className="text-[11px] text-emerald-600">WhatsApp autorizado</div>}</td>
                  <td className="py-4 px-6">
                    <div className="text-[14px] font-medium text-slate-700">{c.prescricao?.medico || 'Não informado'}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                       <button aria-label={`Editar cliente ${c.nome}`} onClick={() => { setClienteEditando(c); setModalAberto(true); }} className="p-2 rounded-xl text-slate-400 hover:text-[var(--vistta-violet)] hover:bg-[var(--vistta-lavender)]"><Edit2 size={16} /></button>
                       <button aria-label={`Excluir cliente ${c.nome}`} onClick={() => { if (window.confirm(`Excluir o cliente ${c.nome}?`)) excluirCliente(c.id).catch((error: any) => alert(error.message)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!clientesFiltrados.length && <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">{clientes.length ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <ModalBase open={modalAberto} onClose={fecharModal} title={clienteEditando ? 'Editar Cliente' : 'Novo Cliente'} width="max-w-4xl">
        <FormCliente data={clienteEditando} onSave={salvar} onDirtyChange={setFormDirty} onClose={fecharModal} />
      </ModalBase>
    </div>
  );
}
