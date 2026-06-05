import { supabase } from '../dbConecction/SupabaseConnection.js';
import { Cliente } from '../classes/Cliente.js';
import { ClienteUtils } from '../utils/ClienteUtils.js';

export class ClienteService {

    static async listarTodos() {
        try {
            const { data, error } = await supabase
                .from('cliente')
                .select('*')
                .order('clienteid', { ascending: true });

            if (error) throw error;

            // Retorna instâncias da classe Cliente com os dados vindos do banco
            return (data || []).map(c => new Cliente(
                c.tipo_cliente,
                c.cpf_cnpj_cliente, // Já virá formatado do banco
                c.nome_cliente,
                c.clienteid
            ));
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            throw new Error('Não foi possível carregar a lista de clientes.');
        }
    }

    static async salvar(clienteInstancia) {
        try {
            const documentoFormatado = ClienteUtils.formatarDocumento(clienteInstancia.cpfCnpjCliente);

            const { error } = await supabase
                .from('cliente')
                .insert([{
                    tipo_cliente: clienteInstancia.tipoCliente,
                    cpf_cnpj_cliente: documentoFormatado,
                    nome_cliente: clienteInstancia.nomeCliente
                }]);

            if (error) {
                if (error.code === '23505') { 
                    return { sucesso: false, mensagem: 'Este CPF/CNPJ já está cadastrado.' };
                }
                throw error;
            }

            return { sucesso: true, mensagem: 'Cliente cadastrado com sucesso!' };
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            return { sucesso: false, mensagem: 'Erro interno ao cadastrar o cliente.' };
        }
    }

    static async editar(clienteInstancia) {
        try {
            if (!clienteInstancia.clienteid) {
                return { sucesso: false, mensagem: 'ID do cliente inválido para edição.' };
            }

            const documentoFormatado = ClienteUtils.formatarDocumento(clienteInstancia.cpfCnpjCliente);

            const { error } = await supabase
                .from('cliente')
                .update({
                    tipo_cliente: clienteInstancia.tipoCliente,
                    cpf_cnpj_cliente: documentoFormatado,
                    nome_cliente: clienteInstancia.nomeCliente
                })
                .eq('clienteid', clienteInstancia.clienteid);

            if (error) throw error;

            return { sucesso: true, mensagem: 'Cliente atualizado com sucesso!' };
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            return { sucesso: false, mensagem: 'Erro interno ao atualizar o cliente.' };
        }
    }

    static async deletar(id) {
        try {
            if (!id) return { sucesso: false, mensagem: 'ID inválido.' };

            const { error } = await supabase
                .from('cliente')
                .delete()
                .eq('clienteid', id);

            if (error) throw error;

            return { sucesso: true, mensagem: 'Cliente removido com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar cliente:', error);
            return { sucesso: false, mensagem: 'Erro interno ao deletar o cliente.' };
        }
    }
}