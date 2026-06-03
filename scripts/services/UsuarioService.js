import { supabase } from '../dbConecction/SupabaseConnection.js';
import { Usuario } from '../classes/Usuario.js';

export class UsuarioService {

    static async login(username, senha) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', username)
                .single();

            if (error && error.code === 'PGRST116') {
                return { autenticado: false, mensagem: 'Usuário não encontrado.' };
            }

            if (error) throw error;

            if (data) {
                const usuarioEncontrado = new Usuario(
                    data.usuario,
                    data.nome_completo,
                    data.senha,
                    data.id
                );

                if (usuarioEncontrado.validarSenha(senha)) {
                    return {
                        autenticado: true,
                        mensagem: `Bem-vindo, ${usuarioEncontrado.nomeCompleto}!`,
                        usuario: usuarioEncontrado
                    };
                } else {
                    return { autenticado: false, mensagem: 'Senha incorreta.' };
                }
            }

            return { autenticado: false, mensagem: 'Usuário não cadastrado.' };

        } catch (error) {
            console.error('Erro no login:', error);
            return { autenticado: false, mensagem: 'Erro ao conectar com o servidor.' };
        }
    }

    static async listarTodos() {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            return (data || []).map(u => new Usuario(
                u.usuario,
                u.nome_completo,
                u.senha,
                u.id
            ));
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            throw new Error('Não foi possível carregar a lista de usuários.');
        }
    }

    static async salvar(usuarioInstancia) {
        try {
            const { error } = await supabase
                .from('usuarios')
                .insert([{
                    usuario: usuarioInstancia.usuario,
                    nome_completo: usuarioInstancia.nomeCompleto,
                    senha: usuarioInstancia.senha
                }]);

            if (error) {
                if (error.code === '23505') {
                    return { sucesso: false, mensagem: 'Este nome de usuário já está em uso.' };
                }
                throw error;
            }

            return { sucesso: true, mensagem: 'Usuário cadastrado com sucesso!' };
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            return { sucesso: false, mensagem: 'Erro interno ao cadastrar o usuário.' };
        }
    }

    static async editar(usuarioInstancia) {
        try {
            if (!usuarioInstancia.id) {
                return { sucesso: false, mensagem: 'ID do usuário inválido para edição.' };
            }

            const { error } = await supabase
                .from('usuarios')
                .update({
                    usuario: usuarioInstancia.usuario,
                    nome_completo: usuarioInstancia.nomeCompleto,
                    senha: usuarioInstancia.senha
                })
                .eq('id', usuarioInstancia.id);

            if (error) {
                if (error.code === '23505') {
                    return { sucesso: false, mensagem: 'Este nome de usuário já está sendo usado.' };
                }
                throw error;
            }

            return { sucesso: true, mensagem: 'Usuário atualizado com sucesso!' };
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            return { sucesso: false, mensagem: 'Erro interno ao atualizar o usuário.' };
        }
    }

    static async deletar(id) {
        try {
            if (!id) return { sucesso: false, mensagem: 'ID inválido.' };

            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { sucesso: true, mensagem: 'Usuário removido com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            return { sucesso: false, mensagem: 'Erro interno ao deletar o usuário.' };
        }
    }
}