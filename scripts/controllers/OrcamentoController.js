import { supabase } from '../dbConecction/SupabaseConnection.js';
import { OrcamentoService } from '../services/OrcamentoService.js';
import { ClienteService } from '../services/ClienteService.js';
import { ProdutoService } from '../services/ProdutoServices.js';
import { Orcamento, OrcamentoItem } from '../classes/Orcamento.js';

// ==========================================================================
// ELEMENTOS DO DOM - TELA PRINCIPAL E HISTÓRICO
// ==========================================================================
const tabelaCorpo = document.getElementById('corpoTabelaOrcamentos');
const modalOrcamento = document.getElementById('modalOrcamento');
const formOrcamento = document.getElementById('formOrcamento');

// ==========================================================================
// ELEMENTOS DO DOM - MODAL DE RESUMO DOS ITENS
// ==========================================================================
const modalResumo = document.getElementById('modalResumoOrcamento');
const resumoTitulo = document.getElementById('resumoTitulo');
const resumoCliente = document.getElementById('resumoCliente');
const resumoData = document.getElementById('resumoData');
const resumoTotalGeral = document.getElementById('resumoTotalGeral');
const corpoTabelaResumo = document.getElementById('corpoTabelaResumo');

// ==========================================================================
// ELEMENTOS DO DOM - SUB-MODAIS DE SELEÇÃO RÁPIDA
// ==========================================================================
const subModalCliente = document.getElementById('subModalCliente');
const subModalProduto = document.getElementById('subModalProduto');
const txtBuscaCliente = document.getElementById('txtBuscaCliente');
const txtBuscaProduto = document.getElementById('txtBuscaProduto');

// ==========================================================================
// ELEMENTOS DO DOM - CAMPOS DO FORMULÁRIO MESTRE
// ==========================================================================
const inputClienteId = document.getElementById('orcClienteId');
const inputClienteNome = document.getElementById('orcClienteNome');
const inputDiasValidade = document.getElementById('orcDiasValidade');
const labelValorTotalGeral = document.getElementById('orcValorTotalGeral');

// ==========================================================================
// ELEMENTOS DO DOM - CAMPOS TEMPORÁRIOS DE PRODUTOS (ADICIONAR AO CARRINHO)
// ==========================================================================
const inputProdId = document.getElementById('tmpProdId');
const inputProdDesc = document.getElementById('tmpProdDesc');
const inputProdPreco = document.getElementById('tmpProdPreco');
const inputProdQtd = document.getElementById('tmpProdQtd');
const btnAdicionarItem = document.getElementById('btnAdicionarItem');
const tabelaItensAdicionados = document.getElementById('corpoItensAdicionados');

// ==========================================================================
// VARIÁVEIS DE CACHE E CONTROLE DE ESTADO (MEMÓRIA)
// ==========================================================================
let cacheClientes = [];
let cacheProdutos = [];
let itensCarrinho = [];

// Inicialização da Tela
document.addEventListener('DOMContentLoaded', () => {
    carregarOrcamentos();
    configurarFiltrosBusca();
});

// ==========================================================================
// HISTÓRICO PRINCIPAL: CARREGAMENTO E RENDERIZAÇÃO
// ==========================================================================
async function carregarOrcamentos() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align:center;">Carregando orçamentos...</td></tr>';
        const orcamentos = await OrcamentoService.listarTodos();
        tabelaCorpo.innerHTML = '';

        if (orcamentos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align:center;">Nenhum orçamento gerado.</td></tr>';
            return;
        }

        orcamentos.forEach(o => {
            const tr = document.createElement('tr');
            const dataFormatada = new Date(o.dtOrcamento).toLocaleDateString('pt-BR');
            const validadeFormatada = new Date(o.dtValidadeOrcamento).toLocaleDateString('pt-BR');
            const totalFormatado = `R$ ${parseFloat(o.vlTotalOrcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            tr.innerHTML = `
                <td>${o.orcamentoid}</td>
                <td>${o.nomeCliente}</td>
                <td>${dataFormatada}</td>
                <td>${validadeFormatada}</td>
                <td><strong>${totalFormatado}</strong></td>
                <td>
                    <button class="btn btn-info btn-tab btn-ver-itens" 
                        data-id="${o.orcamentoid}" 
                        data-cliente="${o.nomeCliente}" 
                        data-data="${dataFormatada}" 
                        data-total="${totalFormatado}">Ver</button>
                </td>
                <td class="acoes">
                    <button class="btn btn-success btn-tab btn-deletar" data-id="${o.orcamentoid}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();
    } catch (e) {
        console.error(e);
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Erro ao carregar dados dos orçamentos.</td></tr>';
    }
}

function configurarEventosTabela() {
    // Cliques no botão "Ver Itens" (Abre o resumo dinâmico)
    document.querySelectorAll('.btn-ver-itens').forEach(b => {
        b.addEventListener('click', () => {
            const id = b.getAttribute('data-id');
            const cliente = b.getAttribute('data-cliente');
            const data = b.getAttribute('data-data');
            const total = b.getAttribute('data-total');
            
            abrirResumoOrcamento(id, cliente, data, total);
        });
    });

    // Cliques no botão "Excluir" (CRUD Delete)
    document.querySelectorAll('.btn-deletar').forEach(b => {
        b.addEventListener('click', async () => {
            if (confirm('Deseja realmente cancelar/excluir este orçamento definitivamente?')) {
                const res = await OrcamentoService.deletar(b.getAttribute('data-id'));
                alert(res.mensagem);
                if (res.sucesso) carregarOrcamentos();
            }
        });
    });
}

// ==========================================================================
// LÓGICA DO MODAL DE RESUMO (CONSULTA DINÂMICA DE ITENS NO BANCO)
// ==========================================================================
async function abrirResumoOrcamento(id, nomeCliente, dataEmissao, valorTotal) {
    try {
        resumoTitulo.textContent = `Itens do Orçamento #${id}`;
        resumoCliente.textContent = nomeCliente;
        resumoData.textContent = dataEmissao;
        resumoTotalGeral.textContent = valorTotal;
        corpoTabelaResumo.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando itens...</td></tr>';
        
        modalResumo.style.display = 'flex';

        // Consulta direto na tabela de itens usando o ID da linha clicada
        const { data: itens, error } = await supabase
            .from('orcamento_item')
            .select('*')
            .eq('orcamentoid', id);

        if (error) throw error;

        corpoTabelaResumo.innerHTML = '';

        if (!itens || itens.length === 0) {
            corpoTabelaResumo.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum produto encontrado neste orçamento.</td></tr>';
            return;
        }

        itens.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.produtodesc || 'Produto Sem Descrição'}</td>
                <td>${parseFloat(item.qt_produto)}</td>
                <td>R$ ${parseFloat(item.vl_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>R$ ${parseFloat(item.vl_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            `;
            corpoTabelaResumo.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao processar resumo dos itens:', error);
        corpoTabelaResumo.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Erro ao recuperar itens do banco.</td></tr>';
    }
}

// ==========================================================================
// SUB-MODAIS: DINÂMICA DE FILTROS E BUSCAS EM TEMPO REAL
// ==========================================================================
function configurarFiltrosBusca() {
    // Filtro instantâneo de clientes (por ID ou por Nome)
    txtBuscaCliente.addEventListener('input', () => {
        const termo = txtBuscaCliente.value.toLowerCase().trim();
        const filtrados = cacheClientes.filter(c => 
            c.clienteid.toString().includes(termo) || c.nomeCliente.toLowerCase().includes(termo)
        );
        renderizarListaSelecaoCliente(filtrados);
    });

    // Filtro instantâneo de produtos (por ID ou por Descrição)
    txtBuscaProduto.addEventListener('input', () => {
        const termo = txtBuscaProduto.value.toLowerCase().trim();
        const filtrados = cacheProdutos.filter(p => 
            p.produtoid.toString().includes(termo) || p.dsProduto.toLowerCase().includes(termo)
        );
        renderizarListaSelecaoProduto(filtrados);
    });
}

// Gatilho e renderização do Sub-Modal de Clientes
document.getElementById('btnBuscarClienteOrc').addEventListener('click', async () => {
    subModalCliente.style.display = 'flex';
    txtBuscaCliente.value = '';
    cacheClientes = await ClienteService.listarTodos();
    renderizarListaSelecaoCliente(cacheClientes);
});

function renderizarListaSelecaoCliente(lista) {
    const corpo = document.getElementById('corpoSelecaoCliente');
    corpo.innerHTML = '';
    lista.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${c.clienteid}</strong></td><td>${c.nomeCliente}</td>`;
        tr.addEventListener('click', () => {
            inputClienteId.value = c.clienteid;
            inputClienteNome.value = c.nomeCliente;
            subModalCliente.style.display = 'none';
        });
        corpo.appendChild(tr);
    });
}

// Gatilho e renderização do Sub-Modal de Produtos
document.getElementById('btnBuscarProdutoOrc').addEventListener('click', async () => {
    subModalProduto.style.display = 'flex';
    txtBuscaProduto.value = '';
    cacheProdutos = await ProdutoService.listarTodos();
    renderizarListaSelecaoProduto(cacheProdutos);
});

function renderizarListaSelecaoProduto(lista) {
    const corpo = document.getElementById('corpoSelecaoProduto');
    corpo.innerHTML = '';
    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${p.produtoid}</strong></td><td>${p.dsProduto}</td><td>R$ ${parseFloat(p.vlVendaProduto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>`;
        tr.addEventListener('click', () => {
            inputProdId.value = p.produtoid;
            inputProdDesc.value = p.dsProduto;
            inputProdPreco.value = p.vlVendaProduto;
            inputProdQtd.value = 1; // Quantidade inicial sugerida
            subModalProduto.style.display = 'none';
        });
        corpo.appendChild(tr);
    });
}

// ==========================================================================
// CONTROLE DO CARRINHO DE PRODUTOS DO ORÇAMENTO
// ==========================================================================
btnAdicionarItem.addEventListener('click', () => {
    const pId = inputProdId.value;
    const desc = inputProdDesc.value;
    const preco = parseFloat(inputProdPreco.value);
    const qtd = parseFloat(inputProdQtd.value);

    if (!pId || !qtd || qtd <= 0) {
        alert('Escolha um produto através do botão Buscar e insira uma quantidade válida!');
        return;
    }

    const itemTotal = preco * qtd;
    const novoItem = new OrcamentoItem(pId, desc, qtd, preco, itemTotal);
    
    itensCarrinho.push(novoItem);
    atualizarTabelaCarrinho();

    // Limpa os campos de inserção temporária
    inputProdId.value = '';
    inputProdDesc.value = '';
    inputProdPreco.value = '';
    inputProdQtd.value = '';
});

function atualizarTabelaCarrinho() {
    tabelaItensAdicionados.innerHTML = '';
    let totalGeral = 0;

    itensCarrinho.forEach((item, index) => {
        totalGeral += item.vlTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.produtoDesc}</td>
            <td>${item.qtProduto}</td>
            <td>R$ ${item.vlUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>R$ ${item.vlTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td><button type="button" class="btn btn-tab" style="background-color:#d9534f; color:#fff;" data-index="${index}">&times;</button></td>
        `;

        // Remove item específico do carrinho rodando recalque visual
        tr.querySelector('button').addEventListener('click', () => {
            itensCarrinho.splice(index, 1);
            atualizarTabelaCarrinho();
        });

        tabelaItensAdicionados.appendChild(tr);
    });

    labelValorTotalGeral.textContent = `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// ==========================================================================
// EVENTO SUBMIT - PERSISTÊNCIA FINAL MESTRE-DETALHE
// ==========================================================================
formOrcamento.addEventListener('submit', async (e) => {
    e.preventDefault();

    const cId = inputClienteId.value;
    const diasValidade = parseInt(inputDiasValidade.value);

    if (!cId) {
        alert('Identificação do cliente ausente. Selecione um cliente válido.');
        return;
    }
    if (itensCarrinho.length === 0) {
        alert('Operação travada: Adicione pelo menos um produto ao carrinho antes de salvar.');
        return;
    }

    // Processamento matemático de datas solicitado (Atual vs Escolha em dias)
    const dtAtual = new Date();
    const dtVencimento = new Date();
    dtVencimento.setDate(dtAtual.getDate() + diasValidade);

    const totalGeral = itensCarrinho.reduce((sum, item) => sum + item.vlTotal, 0);

    const novoOrcamento = new Orcamento(
        cId,
        dtAtual.toISOString(),
        dtVencimento.toISOString(),
        totalGeral
    );
    novoOrcamento.itens = itensCarrinho;

    const res = await OrcamentoService.salvar(novoOrcamento);
    alert(res.mensagem);

    if (res.sucesso) {
        modalOrcamento.style.display = 'none';
        formOrcamento.reset();
        itensCarrinho = [];
        atualizarTabelaCarrinho();
        carregarOrcamentos();
    }
});

// ==========================================================================
// OUVINTES GERAIS DE INTERAÇÃO DOS MODAIS (ABRIR / FECHAR)
// ==========================================================================
document.getElementById('btnNovoOrcamento').addEventListener('click', () => {
    formOrcamento.reset();
    itensCarrinho = [];
    atualizarTabelaCarrinho();
    modalOrcamento.style.display = 'flex';
});

// Fechamentos simples de janelas
document.getElementById('btnFecharModal').addEventListener('click', () => modalOrcamento.style.display = 'none');
document.getElementById('btnCancelarOrcamento').addEventListener('click', () => modalOrcamento.style.display = 'none');
document.getElementById('btnFecharSubCli').addEventListener('click', () => subModalCliente.style.display = 'none');
document.getElementById('btnFecharSubProd').addEventListener('click', () => subModalProduto.style.display = 'none');
document.getElementById('btnFecharModalResumo').addEventListener('click', () => modalResumo.style.display = 'none');
document.getElementById('btnFecharResumoJanela').addEventListener('click', () => modalResumo.style.display = 'none');

// Fecha clicando no plano de fundo escuro externo dos modais
window.addEventListener('click', (e) => {
    if (e.target === modalOrcamento) modalOrcamento.style.display = 'none';
    if (e.target === modalResumo) modalResumo.style.display = 'none';
});