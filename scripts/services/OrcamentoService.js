import { supabase } from '../dbConecction/SupabaseConnection.js';
import { Orcamento, OrcamentoItem } from '../classes/Orcamento.js';

export class OrcamentoService {

    static async listarTodos() {
        try {
            // Traz o orçamento fazendo JOIN com o nome do cliente
            const { data, error } = await supabase
                .from('orcamento')
                .select(`
                    *,
                    cliente ( nome_cliente )
                `)
                .order('orcamentoid', { ascending: false });

            if (error) throw error;

            return (data || []).map(o => {
                const orc = new Orcamento(
                    o.clienteid,
                    o.dt_orcamento,
                    o.dt_validade_orcamento,
                    o.vl_total_orcamento,
                    o.orcamentoid
                );
                // Injeta o nome do cliente dinamicamente para exibição na tabela principal
                orc.nomeCliente = o.cliente ? o.cliente.nome_cliente : 'Cliente não encontrado';
                return orc;
            });
        } catch (error) {
            console.error('Erro ao listar orçamentos:', error);
            throw new Error('Não foi possível carregar os orçamentos.');
        }
    }

    static async salvar(orcamentoInstancia) {
        try {
            // 1. Inserir o Cabeçalho do Orçamento
            const { data: novoOrcamento, error: errorOrcamento } = await supabase
                .from('orcamento')
                .insert([{
                    clienteid: orcamentoInstancia.clienteId,
                    dt_orcamento: orcamentoInstancia.dtOrcamento,
                    dt_validade_orcamento: orcamentoInstancia.dtValidadeOrcamento,
                    vl_total_orcamento: orcamentoInstancia.vlTotalOrcamento
                }])
                .select('orcamentoid')
                .single();

            if (errorOrcamento) throw errorOrcamento;

            const idGerado = novoOrcamento.orcamentoid;

            // 2. Preparar os Itens com o ID do orçamento gerado
            const itensParaInserir = orcamentoInstancia.itens.map(item => ({
                orcamentoid: idGerado,
                produtoid: item.produtoId,
                produtodesc: item.produtoDesc,
                qt_produto: item.qtProduto,
                vl_unitario: item.vlUnitario,
                vl_total: item.vlTotal
            }));

            // 3. Inserir todos os itens em lote (Bulk Insert)
            const { error: errorItens } = await supabase
                .from('orcamento_item')
                .insert(itensParaInserir);

            if (errorItens) throw errorItens;

            return { sucesso: true, mensagem: `Orçamento #${idGerado} gerado com sucesso!` };
        } catch (error) {
            console.error('Erro ao salvar orçamento completo:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar salvar o orçamento.' };
        }
    }

    static async deletar(id) {
        try {
            if (!id) return { sucesso: false, mensagem: 'ID inválido.' };

            // 1. Primeiro deleta os itens vinculados (por conta da integridade referencial)
            const { error: errorItens } = await supabase
                .from('orcamento_item')
                .delete()
                .eq('orcamentoid', id);

            if (errorItens) throw errorItens;

            // 2. Depois deleta o cabeçalho do orçamento
            const { error: errorOrcamento } = await supabase
                .from('orcamento')
                .delete()
                .eq('orcamentoid', id);

            if (errorOrcamento) throw errorOrcamento;

            return { sucesso: true, mensagem: 'Orçamento removido com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar orçamento:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar deletar o orçamento.' };
        }
    }
}