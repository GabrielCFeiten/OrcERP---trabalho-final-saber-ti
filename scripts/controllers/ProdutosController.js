import { ProdutoService } from '../services/ProdutoServices.js';
import { CategoriaService } from '../services/CategoriaService.js';
import { Produto } from '../classes/Produtos.js';

// Elementos do DOM Principal
const tabelaCorpo = document.getElementById('corpoTabelaProdutos');
const modal = document.getElementById('modalProduto');
const formProduto = document.getElementById('formProduto');
const modalTitulo = document.getElementById('modalTituloProduto');

// Elementos do Sub-Modal de Categorias
const subModalCategoria = document.getElementById('subModalCategoria');
const corpoTabelaSelecaoCategoria = document.getElementById('corpoTabelaSelecaoCategoria');
const btnBuscarCategoria = document.getElementById('btnBuscarCategoria');
const btnFecharSubModal = document.getElementById('btnFecharSubModal');

// Campos do Formulário
const inputId = document.getElementById('produtoId');
const inputDescricao = document.getElementById('descProduto');
const inputCategoriaId = document.getElementById('categoriaIdProduto');
const inputCategoriaNome = document.getElementById('categoriaNomeProduto');
const inputObservacao = document.getElementById('obsProduto');
const inputPreco = document.getElementById('precoProduto');
const inputStatus = document.getElementById('statusProduto');

// Botões de Controle Geral
const btnNovoProduto = document.getElementById('btnNovoProduto');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarProduto = document.getElementById('btnCancelarProduto');

// Variável global para armazenar a data original em caso de edição
let dataCadastroOriginal = null;

document.addEventListener('DOMContentLoaded', carregarProdutos);

/* ==========================================
   FUNÇÕES DE RENDERIZAÇÃO DA TABELA
   ========================================== */

async function carregarProdutos() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando produtos...</td></tr>';
        const produtos = await ProdutoService.listarTodos();
        tabelaCorpo.innerHTML = '';

        if (produtos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado.</td></tr>';
            return;
        }

        produtos.forEach(prod => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${prod.produtoid}</td>
                <td>${prod.dsProduto}</td>
                <td>${prod.descCategoria}</td>
                <td>R$ ${parseFloat(prod.vlVendaProduto).toLocaleString('pt-BR', { minimumFractionDigits:           2, maximumFractionDigits: 2 })}</td>
                <td>${prod.statusProduto}</td>
                <td class="acoes">
                    <div class="botoes-acoes">
                        <button class="btn btn-secondary btn-tab btn-editar" 
                            data-id="${prod.produtoid}" 
                            data-desc="${prod.dsProduto}" 
                            data-catid="${prod.categoriaProdutoId}"
                            data-catnome="${prod.descCategoria}"
                            data-obs="${prod.obsProduto || ''}"
                            data-preco="${prod.vlVendaProduto}"
                            data-status="${prod.statusProduto}"
                            data-data="${prod.dtCadastroProduto}">Editar</button>
                        <button class="btn btn-success btn-tab btn-deletar" data-id="${prod.produtoid}          ">Excluir</button>
                    </div>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();
    } catch (error) {
        console.error(error);
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Erro ao carregar dados.</td></tr>';
    }
}

function configurarEventosTabela() {
    document.querySelectorAll('.btn-editar').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = botao.getAttribute('data-id');
            const desc = botao.getAttribute('data-desc');
            const catId = botao.getAttribute('data-catid');
            const catNome = botao.getAttribute('data-catnome');
            const obs = botao.getAttribute('data-obs');
            const preco = botao.getAttribute('data-preco');
            const status = botao.getAttribute('data-status');
            const dataCad = botao.getAttribute('data-data');

            abrirModalParaEdicao(id, desc, catId, catNome, obs, preco, status, dataCad);
        });
    });

    document.querySelectorAll('.btn-deletar').forEach(botao => {
        botao.addEventListener('click', async () => {
            const id = botao.getAttribute('data-id');
            if (confirm('Deseja realmente excluir este produto?')) {
                const resultado = await ProdutoService.deletar(id);
                alert(resultado.mensagem);
                if (resultado.sucesso) carregarProdutos();
            }
        });
    });
}

/* ==========================================
   GERENCIAMENTO DOS MODAIS
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Produto';
    formProduto.reset();
    inputId.value = '';
    inputCategoriaId.value = '';
    dataCadastroOriginal = null;
    modal.style.display = 'flex';
}

function abrirModalParaEdicao(id, desc, catId, catNome, obs, preco, status, dataCad) {
    modalTitulo.textContent = 'Editar Produto';
    inputId.value = id;
    inputDescricao.value = desc;
    inputCategoriaId.value = catId;
    inputCategoriaNome.value = catNome;
    inputObservacao.value = obs;
    inputPreco.value = preco;
    inputStatus.value = status;
    dataCadastroOriginal = dataCad;
    modal.style.display = 'flex';
}

function fecharModal() {
    modal.style.display = 'none';
    formProduto.reset();
}

/* ==========================================
   SUB-MODAL: CONTROLE E SELEÇÃO DE CATEGORIAS
   ========================================== */

btnBuscarCategoria.addEventListener('click', async () => {
    corpoTabelaSelecaoCategoria.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';
    subModalCategoria.style.display = 'flex';

    const categorias = await CategoriaService.listarTodos();
    corpoTabelaSelecaoCategoria.innerHTML = '';

    if(categorias.length === 0) {
        corpoTabelaSelecaoCategoria.innerHTML = '<tr><td colspan="2" style="text-align:center;">Nenhuma categoria encontrada.</td></tr>';
        return;
    }

    categorias.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cat.id}</strong></td>
            <td>${cat.descricao}</td>
        `;
        
        // Evento de seleção da linha da categoria
        tr.addEventListener('click', () => {
            inputCategoriaId.value = cat.id;
            inputCategoriaNome.value = cat.descricao;
            subModalCategoria.style.display = 'none';
        });

        corpoTabelaSelecaoCategoria.appendChild(tr);
    });
});

btnFecharSubModal.addEventListener('click', () => {
    subModalCategoria.style.display = 'none';
});

/* ==========================================
   EVENTO SUBMIT (SALVAR / ATUALIZAR)
   ========================================== */

formProduto.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = inputId.value;
    const desc = inputDescricao.value.trim();
    const categoriaId = inputCategoriaId.value;
    const obs = inputObservacao.value.trim();
    const preco = parseFloat(inputPreco.value);
    const status = inputStatus.value;

    // Instancia o objeto respeitando o constructor da classe Produto
    const produtoInstancia = new Produto(
        categoriaId,
        desc,
        obs || null,
        preco,
        id ? dataCadastroOriginal : new Date().toISOString(),
        status,
        id ? id : null
    );

    let resposta;
    if (id) {
        resposta = await ProdutoService.editar(produtoInstancia);
    } else {
        resposta = await ProdutoService.salvar(produtoInstancia);
    }

    alert(resposta.mensagem);
    if (resposta.sucesso) {
        fecharModal();
        carregarProdutos();
    }
});

// Eventos de clique para fechar e abrir modais comuns
btnNovoProduto.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarProduto.addEventListener('click', fecharModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
    if (e.target === subModalCategoria) subModalCategoria.style.display = 'none';
});