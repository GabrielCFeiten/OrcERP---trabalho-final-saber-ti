import { ProdutoService } from '../services/ProdutoServices.js';
import { CategoriaService } from '../services/CategoriaService.js';
import { Produto } from '../classes/Produtos.js';

// Elementos do DOM Principal e Tabela
const tabelaCorpo = document.getElementById('corpoTabelaProdutos');
const campoPesquisa = document.getElementById('campoPesquisa');

// Modais existentes
const modal = document.getElementById('modalProduto');
const subModalCategoria = document.getElementById('subModalCategoria');
const formProduto = document.getElementById('formProduto');
const modalTitulo = document.getElementById('modalTituloProduto');

// Novo Modal de Filtros
const modalFiltros = document.getElementById('modalFiltros');
const formFiltros = document.getElementById('formFiltros');
const filtroCategoria = document.getElementById('filtroCategoria');
const filtroStatus = document.getElementById('filtroStatus');
const filtroPrecoMin = document.getElementById('filtroPrecoMin');
const filtroPrecoMax = document.getElementById('filtroPrecoMax');

// Elementos de Seleção de Categoria (Sub-modal)
const corpoTabelaSelecaoCategoria = document.getElementById('corpoTabelaSelecaoCategoria');
const btnBuscarCategoria = document.getElementById('btnBuscarCategoria');
const btnFecharSubModal = document.getElementById('btnFecharSubModal');

// Campos do Formulário de Cadastro
const inputId = document.getElementById('produtoId');
const inputDescricao = document.getElementById('descProduto');
const inputCategoriaId = document.getElementById('categoriaIdProduto');
const inputCategoriaNome = document.getElementById('categoriaNomeProduto');
const inputObservacao = document.getElementById('obsProduto');
const inputPreco = document.getElementById('precoProduto');
const inputStatus = document.getElementById('statusProduto');

// Botões de Abertura/Fechamento
const btnNovoProduto = document.getElementById('btnNovoProduto');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarProduto = document.getElementById('btnCancelarProduto');
const btnAbrirFiltros = document.getElementById('btnAbrirFiltros');
const btnFecharModalFiltros = document.getElementById('btnFecharModalFiltros');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');

// Variáveis de estado da aplicação
let listaProdutosGeral = []; 
let dataCadastroOriginal = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarCategoriasNoFiltro();
    configurarEventosGerais();
});

/* ==========================================
   RENDERIZAÇÃO E FILTRAGEM DE DADOS
   ========================================== */

async function carregarProdutos() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">Carregando produtos...</td></tr>';
        listaProdutosGeral = await ProdutoService.listarTodos();
        renderizarTabela(listaProdutosGeral);
    } catch (error) {
        console.error(error);
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Erro ao carregar dados.</td></tr>';
    }
}

function renderizarTabela(produtos) {
    tabelaCorpo.innerHTML = '';

    if (produtos.length === 0) {
        tabelaCorpo.innerHTML = '<tr><td colspan="6" style="text-align:center;">Nenhum produto encontrado com os filtros aplicados.</td></tr>';
        return;
    }

    produtos.forEach(prod => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prod.produtoid}</td>
            <td>${prod.dsProduto}</td>
            <td>${prod.descCategoria}</td>
            <td>R$ ${parseFloat(prod.vlVendaProduto).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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
                    <button class="btn btn-success btn-tab btn-deletar" data-id="${prod.produtoid}">Excluir</button>
                </div>
            </td>
        `;
        tabelaCorpo.appendChild(tr);
    });

    configurarEventosTabela();
}

async function carregarCategoriasNoFiltro() {
    try {
        const categorias = await CategoriaService.listarTodos();
        filtroCategoria.innerHTML = '<option value="">Todas as Categorias</option>';
        categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.descricao; // Filtragem baseada na descrição exibida na tabela
            opt.textContent = cat.descricao;
            filtroCategoria.appendChild(opt);
        });
    } catch (e) {
        console.error("Erro ao popular select de filtros de categoria", e);
    }
}

// Aplica todos os filtros de forma combinada (Pesquisa por Nome + Modal Filtros)
function aplicarFiltrosCombinados() {
    const termoPesquisa = campoPesquisa.value.toLowerCase().trim();
    const categoriaSelecionada = filtroCategoria.value;
    const statusSelecionado = filtroStatus.value;
    const precoMin = parseFloat(filtroPrecoMin.value) || 0;
    const precoMax = parseFloat(filtroPrecoMax.value) || Infinity;

    const produtosFiltrados = listaProdutosGeral.filter(prod => {
        const atendeNome = prod.dsProduto.toLowerCase().includes(termoPesquisa);
        const atendeCategoria = categoriaSelecionada === "" || prod.descCategoria === categoriaSelecionada;
        const atendeStatus = statusSelecionado === "" || prod.statusProduto === statusSelecionado;
        const precoProd = parseFloat(prod.vlVendaProduto) || 0;
        const atendePreco = precoProd >= precoMin && precoProd <= precoMax;

        return atendeNome && atendeCategoria && atendeStatus && atendePreco;
    });

    renderizarTabela(produtosFiltrados);
}

/* ==========================================
   GERENCIAMENTO DOS MODAIS E AÇÕES
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Produto';
    formProduto.reset();
    inputId.value = '';
    inputCategoriaId.value = '';
    dataCadastroOriginal = null;
    modal.style.display = 'flex';
}

function abrirModalParaEdicao(dados) {
    modalTitulo.textContent = 'Editar Produto';
    inputId.value = dados.id;
    inputDescricao.value = dados.desc;
    inputCategoriaId.value = dados.catId;
    inputCategoriaNome.value = dados.catNome;
    inputObservacao.value = dados.obs;
    inputPreco.value = dados.preco;
    inputStatus.value = dados.status;
    dataCadastroOriginal = dados.dataCad;
    modal.style.display = 'flex';
}

function fecharModais() {
    modal.style.display = 'none';
    modalFiltros.style.display = 'none';
    formProduto.reset();
}

/* ==========================================
   CONFIGURAÇÃO DE EVENTOS
   ========================================== */

function configurarEventosGerais() {
    // Escuta em tempo real para a pesquisa por Nome do Produto
    campoPesquisa.addEventListener('input', aplicarFiltrosCombinados);

    // Botões de abertura e controle dos Modais
    btnNovoProduto.addEventListener('click', abrirModalParaCadastro);
    btnFecharModal.addEventListener('click', fecharModais);
    btnCancelarProduto.addEventListener('click', fecharModais);
    
    btnAbrirFiltros.addEventListener('click', () => modalFiltros.style.display = 'flex');
    btnFecharModalFiltros.addEventListener('click', fecharModais);

    // Submissão do Modal de Filtros Avançados
    formFiltros.addEventListener('submit', (e) => {
        e.preventDefault();
        aplicarFiltrosCombinados();
        modalFiltros.style.display = 'none';
    });

    // Limpar filtros do modal
    btnLimparFiltros.addEventListener('click', () => {
        formFiltros.reset();
        aplicarFiltrosCombinados();
        modalFiltros.style.display = 'none';
    });

    // Fechar modais ao clicar fora deles
    window.addEventListener('click', (e) => {
        if (e.target === modal || e.target === modalFiltros) fecharModais();
        if (e.target === subModalCategoria) subModalCategoria.style.display = 'none';
    });

    // Eventos do Sub-Modal de Seleção de Categorias
    btnBuscarCategoria.addEventListener('click', abrirSubModalCategorias);
    btnFecharSubModal.addEventListener('click', () => subModalCategoria.style.display = 'none');

    // Submit de Cadastro/Edição
    formProduto.addEventListener('submit', salvarProduto);
}

function configurarEventosTabela() {
    document.querySelectorAll('.btn-editar').forEach(botao => {
        botao.addEventListener('click', () => {
            abrirModalParaEdicao({
                id: botao.getAttribute('data-id'),
                desc: botao.getAttribute('data-desc'),
                catId: botao.getAttribute('data-catid'),
                catNome: botao.getAttribute('data-catnome'),
                obs: botao.getAttribute('data-obs'),
                preco: botao.getAttribute('data-preco'),
                status: botao.getAttribute('data-status'),
                dataCad: botao.getAttribute('data-data')
            });
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

async function abrirSubModalCategorias() {
    corpoTabelaSelecaoCategoria.innerHTML = '<tr><td colspan="2" style="text-align:center;">Buscando...</td></tr>';
    subModalCategoria.style.display = 'flex';

    const categorias = await CategoriaService.listarTodos();
    corpoTabelaSelecaoCategoria.innerHTML = '';

    if (categorias.length === 0) {
        corpoTabelaSelecaoCategoria.innerHTML = '<tr><td colspan="2" style="text-align:center;">Nenhuma categoria encontrada.</td></tr>';
        return;
    }

    categorias.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${cat.id}</strong></td><td>${cat.descricao}</td>`;
        tr.addEventListener('click', () => {
            inputCategoriaId.value = cat.id;
            inputCategoriaNome.value = cat.descricao;
            subModalCategoria.style.display = 'none';
        });
        corpoTabelaSelecaoCategoria.appendChild(tr);
    });
}

async function salvarProduto(event) {
    event.preventDefault();

    const id = inputId.value;
    const produtoInstancia = new Produto(
        inputCategoriaId.value,
        inputDescricao.value.trim(),
        inputObservacao.value.trim() || null,
        parseFloat(inputPreco.value),
        id ? dataCadastroOriginal : new Date().toISOString(),
        inputStatus.value,
        id ? id : null
    );

    const resposta = id ? await ProdutoService.editar(produtoInstancia) : await ProdutoService.salvar(produtoInstancia);

    alert(resposta.mensagem);
    if (resposta.sucesso) {
        fecharModais();
        carregarProdutos();
    }
}