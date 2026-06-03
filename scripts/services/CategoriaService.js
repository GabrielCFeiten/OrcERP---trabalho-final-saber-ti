import { supabase } from '../dbConecction/SupabaseConnection.js';
import { Categoria } from '../classes/Categoria.js';

export class CategoriaService {

    static async listarTodos() {
        try {
            const { data, error } = await supabase
                .from('categoria_produto')
                .select('*').order('categoriaprodutoid', { ascending: true });

            if (error) throw error;

            return (data || []).map(c => new Categoria(
                c.categoriaprodutoid,
                c.ds_categoria_produto
            )
            );

        } catch (error) {
            console.error('Erro ao listar categorias:', error);
            throw new Error('Não foi possível carregar a lista de categorias.');
        }
    }

    static async salvar(categoriaInstancia) {
        try {
            const { error } = await supabase
                .from('categoria_produto')
                .insert([{
                    ds_categoria_produto: categoriaInstancia.descricao
                }]);

            if (error) throw error;

            return { sucesso: true, mensagem: 'Categoria cadastrada com sucesso!' };
        } catch (error) {
            console.error('Erro ao salvar categoria:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar cadastrar a categoria.' };
        }
    }

    static async editar(categoriaInstancia) {
        try {
            if (!categoriaInstancia.id) {
                return { sucesso: false, mensagem: 'ID da categoria inválido para edição.' };
            }
            const { error } = await supabase
                .from('categoria_produto')
                .update({ ds_categoria_produto: categoriaInstancia.descricao })
                .eq('categoriaprodutoid', categoriaInstancia.id);

            if (error) throw error;

            return { sucesso: true, mensagem: 'Categoria atualizada com sucesso!' };
        } catch (error) {
            console.error('Erro ao editar categoria:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar editar a categoria.' };
        }
    }

    static async deletar(id) {
        try {
            if (!id) return { sucesso: false, mensagem: 'ID inválido.' };

            const { error } = await supabase
                .from('categoria_produto')
                .delete()
                .eq('categoriaprodutoid', id);

            if (error) throw error;
            return { sucesso: true, mensagem: 'Categoria deletada com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar deletar a categoria.' };
        }
    }
}
