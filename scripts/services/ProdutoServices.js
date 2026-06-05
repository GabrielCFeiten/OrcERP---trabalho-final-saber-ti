import { supabase } from '../dbConecction/SupabaseConnection.js';
import { Produto } from '../classes/Produtos.js';

export class ProdutoService {

    static async listarTodos() {
        try {
            const { data, error } = await supabase
                .from('produto')
                .select(`
                    *,
                    categoria_produto (
                        ds_categoria_produto
                    )
                `)
                .order('produtoid', { ascending: true });

            if (error) throw error;

            return (data || []).map(p => {
                const produtoInstancia = new Produto(
                    p.categoriaprodutoid,
                    p.ds_produto,
                    p.obs_produto,
                    p.vl_venda_produto,
                    p.dt_cadastro_produto,
                    p.status_produto,
                    p.produtoid
                );

                produtoInstancia.descCategoria = p.categoria_produto ? p.categoria_produto.ds_categoria_produto : 'Sem Categoria';
                return produtoInstancia;
            });
        } catch (error) {
            console.error('Erro ao listar produtos:', error);
            throw new Error('Não foi possível carregar a lista de produtos.');
        }
    }

    static async salvar(produtoInstancia) {
        try {
            const { error } = await supabase
                .from('produto')
                .insert([{
                    categoriaprodutoid: produtoInstancia.categoriaProdutoId,
                    ds_produto: produtoInstancia.dsProduto,
                    obs_produto: produtoInstancia.obsProduto,
                    vl_venda_produto: produtoInstancia.vlVendaProduto,
                    dt_cadastro_produto: produtoInstancia.dtCadastroProduto || new Date().toISOString(),
                    status_produto: produtoInstancia.statusProduto
                }]);

            if (error) throw error;
            return { sucesso: true, mensagem: 'Produto cadastrado com sucesso!' };
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar cadastrar o produto.' };
        }
    }

    static async editar(produtoInstancia) {
        try {
            if (!produtoInstancia.produtoid) {
                return { sucesso: false, mensagem: 'ID do produto inválido para edição.' };
            }
            const { error } = await supabase
                .from('produto')
                .update({
                    categoriaprodutoid: produtoInstancia.categoriaProdutoId,
                    ds_produto: produtoInstancia.dsProduto,
                    obs_produto: produtoInstancia.obsProduto,
                    vl_venda_produto: produtoInstancia.vlVendaProduto,
                    status_produto: produtoInstancia.statusProduto
                })
                .eq('produtoid', produtoInstancia.produtoid);

            if (error) throw error;
            return { sucesso: true, mensagem: 'Produto editado com sucesso!' };
        } catch (error) {
            console.error('Erro ao editar produto:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar editar o produto.' };
        }
    }

    static async deletar(id) {
        try {
            if (!id) return { sucesso: false, mensagem: 'ID inválido.' };
            const { error } = await supabase
                .from('produto')
                .delete()
                .eq('produtoid', id);
            if (error) throw error;
            return { sucesso: true, mensagem: 'Produto deletado com sucesso!' };
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            return { sucesso: false, mensagem: 'Erro interno ao tentar deletar o produto.' };
        }
    }
}