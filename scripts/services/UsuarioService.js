import { supabase } from '../dbConecction/SupabaseConnection.js'; 
import { Usuario } from '../classes/Usuario.js'; 

export class UsuarioService {
    
    /**
     * Método responsável por autenticar o usuário no banco de dados Supabase
     * @param {string} username 
     * @param {string} senha 
     * @returns {Promise<{autenticado: boolean, mensagem: string, usuario?: Usuario}>}
     */
    static async login(username, senha) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('usuario', username)
                .single();

            if (error && error.code === 'PGRST116') {
                return { 
                    autenticado: false, 
                    mensagem: 'Usuário não encontrado.' 
                };
            }

            if (error) {
                console.error('Erro retornado pelo Supabase:', error);
                throw error;
            }

            if (data) {
                const usuarioEncontrado = new Usuario(
                    data.id,
                    data.usuario,
                    data.senha,
                    data.nome_completo || data.nome_complete 
                );

                if (usuarioEncontrado.validarSenha(senha)) {
                    return {
                        autenticado: true,
                        mensagem: `Bem-vindo, ${usuarioEncontrado.nomeCompleto}!`,
                        usuario: usuarioEncontrado
                    };
                } else {
                    return { 
                        autenticado: false, 
                        mensagem: 'Senha incorreta.' 
                    };
                }
            }

            return { autenticado: false, mensagem: 'Usuário não cadastrado.' };

        } catch (error) {
            console.error('Erro crítico dentro de UsuarioService.login:', error);
            
            return { 
                autenticado: false, 
                mensagem: 'Erro ao conectar com o servidor. Verifique o console do F12.' 
            };
        }
    }
}