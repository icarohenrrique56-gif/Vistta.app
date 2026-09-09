import React from 'react';
import { ModalBase } from '../components/SharedUI';
import { FormCliente } from '../components/Forms/FormCliente';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Cliente } from '../types';

export function ClientesScreen() {
  const { clientes, salvarCliente, excluirCliente, vendas, ordensServico } = useAppContext();
  const [clienteEditando, setClienteEditando] = React.useState<Cliente | null>(null);
  const [modalAberto, setModalAberto] = React.useState(false);

  const salvar = async (data: Partial<Cliente>) => {
    await salvarCliente(data, clienteEditando?.id);
    setModalAberto(false);
    setClienteEditando(null);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Clientes & Receitas</h1>
          <p className="text-slate-500">Gestão de contatos e prontuários óticos.</p>
        </div>
        <button onClick={() => { setClienteEditando(null); setModalAberto(true); }} className="flex w-full items-center justify-center rounded-xl bg-[var(--vistta-plum)] px-6 py-3 font-semibold text-white shadow-md hover:bg-[var(--vistta-violet)] sm:w-auto">
          <Plus size={20} className="mr-2" /> Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[400px]">
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
              {clientes.map((c: Cliente) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="font-bold text-[14px]">{c.nome}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{c.cpf || 'Sem CPF'}</div>
                  </td>
                  <td className="py-4 px-6 text-[14px] font-medium text-slate-600"><a href={`https://wa.me/${(c.tel || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">{c.tel}</a><div className="text-[11px] text-slate-400 mt-1">{vendas.filter(venda => venda.cliId === c.id).length} compra(s) · {ordensServico.filter(os => os.clienteId === c.id).length} OS</div></td>
                  <td className="py-4 px-6">
                    <div className="text-[14px] font-medium text-slate-700">{c.prescricao?.medico || 'Não informado'}</div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex justify-center gap-2">
                       <button onClick={() => { setClienteEditando(c); setModalAberto(true); }} className="p-2 rounded-xl text-slate-400 hover:text-[var(--vistta-violet)] hover:bg-[var(--vistta-lavender)]"><Edit2 size={16} /></button>
                       <button aria-label={`Excluir cliente ${c.nome}`} onClick={() => { if (window.confirm(`Excluir o cliente ${c.nome}?`)) excluirCliente(c.id).catch((error: any) => alert(error.message)); }} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ModalBase open={modalAberto} onClose={() => { setModalAberto(false); setClienteEditando(null); }} title={clienteEditando ? 'Editar Cliente' : 'Novo Cliente'} width="max-w-4xl">
        <FormCliente data={clienteEditando} onSave={salvar} onClose={() => { setModalAberto(false); setClienteEditando(null); }} />
      </ModalBase>
    </div>
  );
}
