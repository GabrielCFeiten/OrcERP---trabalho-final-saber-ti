import { supabase } from './SupabaseConnection.js';
import { Usuario } from './Usuario.js';

export class UsuarioService {
    
    static async salvar(usuarioObj) {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([
                { 
                    usuario: usuarioObj.usuario, 
                    nome_completo: usuarioObj.nomeCompleto,
                    senha: usuarioObj.senha 
                }
            ])
            .select();

        if (error) throw new Error(`Erro ao salvar usuário: ${error.message}`);
        
        return new Usuario(data[0].usuario, data[0].nome_completo, data[0].senha, data[0].id);
    }

    static async buscarTodos() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*');

        if (error) throw new Error(`Erro ao buscar usuários: ${error.message}`);

        return data.map(u => new Usuario(u.usuario, u.nome_completo, u.senha, u.id));
    }

    static async editar(id, novosDados) {
        const dadosParaAtualizar = {};
        
        if (novosDados.usuario) dadosParaAtualizar.usuario = novosDados.usuario;
        if (novosDados.nomeCompleto) dadosParaAtualizar.nome_completo = novosDados.nomeCompleto;
        if (novosDados.senha) dadosParaAtualizar.senha = novosDados.senha;

        const { data, error } = await supabase
            .from('usuarios')
            .update(dadosParaAtualizar)
            .eq('id', id)
            .select();

        if (error) throw new Error(`Erro ao editar usuário: ${error.message}`);
        return data.length > 0;
    }

    static async deletar(id) {
        const { error } = await supabase
            .from('usuarios')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Erro ao deletar usuário: ${error.message}`);
        return true;
    }

    static async login(username, senha) {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('usuario', username)
            .single();

        // Se der erro ou não encontrar o usuário
        if (error || !data) {
            console.log('Usuário não encontrado ou erro na busca.');
            return { autenticado: false, mensagem: 'Usuário ou senha incorretos.' };
        }

        const usuarioEncontrado = new Usuario(data.usuario, data.nome_completo, data.senha, data.id);

        if (usuarioEncontrado.validarSenha(senha)) {
            return { 
                autenticado: true, 
                mensagem: 'Login realizado com sucesso!',
                usuario: usuarioEncontrado 
            };
        } else {
            return { autenticado: false, mensagem: 'Usuário ou senha incorretos.' };
        }
    }
}