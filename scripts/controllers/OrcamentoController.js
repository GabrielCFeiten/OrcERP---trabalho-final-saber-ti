import { supabase } from '../dbConecction/SupabaseConnection.js';
import { OrcamentoService } from '../services/OrcamentoService.js';
import { ClienteService } from '../services/ClienteService.js';
import { ProdutoService } from '../services/ProdutoServices.js';
import { Orcamento, OrcamentoItem } from '../classes/Orcamento.js';


const tabelaCorpo = document.getElementById('corpoTabelaOrcamentos');
const campoPesquisaNome = document.getElementById('campoPesquisa');

const modalFiltros = document.getElementById('modalFiltrosAvancados');
const formFiltrosAvancados = document.getElementById('formFiltrosAvancados');
const filtroStatus = document.getElementById('filtroStatus');
const filtroValorMin = document.getElementById('filtroValorMin');
const filtroValorMax = document.getElementById('filtroValorMax');
const filtroDataEmissao = document.getElementById('filtroDataEmissao');
const btnAbrirFiltrosAvancados = document.getElementById('btnAbrirFiltrosAvancados');
const btnFecharFiltros = document.getElementById('btnFecharFiltros');
const btnLimparFiltros = document.getElementById('btnLimparFiltros');
const btnImprimirOrcamento = document.getElementById('btnImprimirOrcamento');

// Modais Principais
const modalOrcamento = document.getElementById('modalOrcamento');
const formOrcamento = document.getElementById('formOrcamento');
const modalResumo = document.getElementById('modalResumoOrcamento');

// Elementos de Resumo Visual
const resumoTitulo = document.getElementById('resumoTitulo');
const resumoCliente = document.getElementById('resumoCliente');
const resumoData = document.getElementById('resumoData');
const resumoTotalGeral = document.getElementById('resumoTotalGeral');
const corpoTabelaResumo = document.getElementById('corpoTabelaResumo');

// Submodais de Seleção Celular
const subModalCliente = document.getElementById('subModalCliente');
const subModalProduto = document.getElementById('subModalProduto');
const txtBuscaCliente = document.getElementById('txtBuscaCliente');
const txtBuscaProduto = document.getElementById('txtBuscaProduto');

// Inputs Mestre do Formulário
const inputClienteId = document.getElementById('orcClienteId');
const inputClienteNome = document.getElementById('orcClienteNome');
const inputDiasValidade = document.getElementById('orcDiasValidade');
const labelValorTotalGeral = document.getElementById('orcValorTotalGeral');

// Inputs de Adicionar Item ao Carrinho Temporário
const inputProdId = document.getElementById('tmpProdId');
const inputProdDesc = document.getElementById('tmpProdDesc');
const inputProdPreco = document.getElementById('tmpProdPreco');
const inputProdQtd = document.getElementById('tmpProdQtd');
const btnAdicionarItem = document.getElementById('btnAdicionarItem');
const tabelaItensAdicionados = document.getElementById('corpoItensAdicionados');

// Botões Auxiliares Globais
const btnNovoOrcamento = document.getElementById('btnNovoOrcamento');

// VARIÁVEIS DE CONTROLE DE CONFIGURAÇÃO DE ESTADO GLOBAL

let cacheClientes = [];
let cacheProdutos = [];
let itensCarrinho = [];

// Estado local dos Filtros Avançados ativos
let filtrosAtivos = {
    status: 'TODOS',
    valorMin: null,
    valorMax: null,
    dataEmissao: ''
};

document.addEventListener('DOMContentLoaded', () => {
    carregarOrcamentos();
    configurarFiltrosSubModais();
    configurarEventosFiltrosAvancados();
});

/* ==========================================
   MECANISMO DE CARREGAMENTO E PROCESSO DE FILTRAGEM CUMULATIVA
   ========================================== */

async function carregarOrcamentos() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="7" class="texto-centralizado">Carregando orçamentos...</td></tr>';
        const orcamentos = await OrcamentoService.listarTodos();
        tabelaCorpo.innerHTML = '';

        if (orcamentos.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7" class="texto-centralizado">Nenhum orçamento gerado.</td></tr>';
            return;
        }

        orcamentos.forEach(o => {
            const tr = document.createElement('tr');
            
            tr.setAttribute('data-cliente-nome', o.nomeCliente.toLowerCase());
            tr.setAttribute('data-valor-total', parseFloat(o.vlTotalOrcamento));
            tr.setAttribute('data-data-emissao', o.dtOrcamento.split('T')[0]); 
            
            const vencido = new Date(o.dtValidadeOrcamento).getTime() < new Date().getTime();
            tr.setAttribute('data-status-validade', vencido ? 'VENCIDOS' : 'VALIDOS');

            const dataFormatada = new Date(o.dtOrcamento).toLocaleDateString('pt-BR');
            const validadeFormatada = new Date(o.dtValidadeOrcamento).toLocaleDateString('pt-BR');
            const totalFormatado = `R$ ${parseFloat(o.vlTotalOrcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            tr.innerHTML = `
                <td>${o.orcamentoid}</td>
                <td>${o.nomeCliente}</td>
                <td>${dataFormatada}</td>
                <td>${validadeFormatada}</td>
                <td><strong class="${vencido ? 'texto-vencido-alerta' : ''}">${totalFormatado}</strong></td>
                <td>
                    <button type="button" class="btn btn-info btn-tab btn-ver-itens" 
                        data-id="${o.orcamentoid}" 
                        data-cliente="${o.nomeCliente}" 
                        data-data="${dataFormatada}" 
                        data-total="${totalFormatado}">Ver</button>
                </td>
                <td class="acoes">
                    <button type="button" class="btn btn-success btn-tab btn-deletar" data-id="${o.orcamentoid}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();
        executarFiltragemUnificada(); 
    } catch (e) {
        console.error(e);
        tabelaCorpo.innerHTML = '<tr><td colspan="7" class="texto-centralizado erro-carregamento">Erro ao carregar dados dos orçamentos.</td></tr>';
    }
}

function executarFiltragemUnificada() {
    const termoNome = campoPesquisaNome.value.toLowerCase().trim();
    const linhas = tabelaCorpo.querySelectorAll('tr');

    const mensagemAntiga = tabelaCorpo.querySelector('.sem-resultados');
    if (mensagemAntiga) mensagemAntiga.remove();

    let linhasVisiveis = 0;

    linhas.forEach(linha => {
        if (linha.cells.length === 1) return;

        const nomeCliente = linha.getAttribute('data-cliente-nome') || '';
        const valorTotal = parseFloat(linha.getAttribute('data-valor-total')) || 0;
        const dataEmissao = linha.getAttribute('data-data-emissao') || '';
        const statusValidade = linha.getAttribute('data-status-validade') || '';

        // 1. Filtro por Input Text de Nome de Cliente
        const bateNome = nomeCliente.includes(termoNome);

        // 2. Filtro por Status (Vencido / Dentro do Prazo)
        const bateStatus = (filtrosAtivos.status === 'TODOS' || statusValidade === filtrosAtivos.status);

        // 3. Filtro por Faixas de Valores Mínimos e Máximos
        const bateMin = (filtrosAtivos.valorMin === null || valorTotal >= filtrosAtivos.valorMin);
        const bateMax = (filtrosAtivos.valorMax === null || valorTotal <= filtrosAtivos.valorMax);

        // 4. Filtro por Data de Emissão (Comparação literal YYYY-MM-DD)
        const bateData = (filtrosAtivos.dataEmissao === '' || dataEmissao === filtrosAtivos.dataEmissao);

        if (bateNome && bateStatus && bateMin && bateMax && bateData) {
            linha.style.display = '';
            linhasVisiveis++; 
        } else {
            linha.style.display = 'none';
        }
    });

    if (linhasVisiveis === 0) {
        const trVazio = document.createElement('tr');
        trVazio.classList.add('sem-resultados');
        trVazio.innerHTML = '<tr><td colspan="7" class="texto-centralizado">Nenhum orçamento corresponde aos filtros aplicados.</td></tr>';
        tabelaCorpo.appendChild(trVazio);
    }
}

function configurarEventosFiltrosAvancados() {
    btnAbrirFiltrosAvancados.addEventListener('click', () => modalFiltros.style.display = 'flex');
    btnFecharFiltros.addEventListener('click', () => modalFiltros.style.display = 'none');

    campoPesquisaNome.addEventListener('input', executarFiltragemUnificada);

    formFiltrosAvancados.addEventListener('submit', (e) => {
        e.preventDefault();
        
        filtrosAtivos.status = filtroStatus.value;
        filtrosAtivos.valorMin = filtroValorMin.value ? parseFloat(filtroValorMin.value) : null;
        filtrosAtivos.valorMax = filtroValorMax.value ? parseFloat(filtroValorMax.value) : null;
        filtrosAtivos.dataEmissao = filtroDataEmissao.value;

        executarFiltragemUnificada();
        modalFiltros.style.display = 'none';
    });

    btnLimparFiltros.addEventListener('click', () => {
        formFiltrosAvancados.reset();
        filtrosAtivos = { status: 'TODOS', valorMin: null, valorMax: null, dataEmissao: '' };
        executarFiltragemUnificada();
        modalFiltros.style.display = 'none';
    });
}

function configurarEventosTabela() {
    document.querySelectorAll('.btn-ver-itens').forEach(b => {
        b.addEventListener('click', () => {
            abrirResumoOrcamento(
                b.getAttribute('data-id'),
                b.getAttribute('data-cliente'),
                b.getAttribute('data-data'),
                b.getAttribute('data-total')
            );
        });
    });

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

/* ==========================================
   LÓGICA DO MODAL DE RESUMO (CONSULTA ITENS)
   ========================================== */

async function abrirResumoOrcamento(id, nomeCliente, dataEmissao, valorTotal) {
    try {
        resumoTitulo.textContent = `Itens do Orçamento #${id}`;
        resumoCliente.textContent = nomeCliente;
        resumoData.textContent = dataEmissao;
        resumoTotalGeral.textContent = valorTotal;
        corpoTabelaResumo.innerHTML = '<tr><td colspan="4" class="texto-centralizado">Carregando itens...</td></tr>';
        
        modalResumo.style.display = 'flex';

        const { data: itens, error } = await supabase
            .from('orcamento_item')
            .select('*')
            .eq('orcamentoid', id);

        if (error) throw error;
        corpoTabelaResumo.innerHTML = '';

        if (!itens || itens.length === 0) {
            corpoTabelaResumo.innerHTML = '<tr><td colspan="4" class="texto-centralizado">Nenhum produto encontrado neste orçamento.</td></tr>';
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
        corpoTabelaResumo.innerHTML = '<tr><td colspan="4" class="texto-centralizado erro-carregamento">Erro ao recuperar itens do banco.</td></tr>';
    }
}

/* ==========================================
   SUB-MODAIS: DINÂMICA DE FILTROS INTERNOS
   ========================================== */

function configurarFiltrosSubModais() {
    txtBuscaCliente.addEventListener('input', () => {
        const termo = txtBuscaCliente.value.toLowerCase().trim();
        const filtrados = cacheClientes.filter(c => 
            c.clienteid.toString().includes(termo) || c.nomeCliente.toLowerCase().includes(termo)
        );
        renderizarListaSelecaoCliente(filtrados);
    });

    txtBuscaProduto.addEventListener('input', () => {
        const termo = txtBuscaProduto.value.toLowerCase().trim();
        const filtrados = cacheProdutos.filter(p => 
            p.produtoid.toString().includes(termo) || p.dsProduto.toLowerCase().includes(termo)
        );
        renderizarListaSelecaoProduto(filtrados);
    });
}

document.getElementById('btnBuscarClienteOrc').addEventListener('click', async () => {
    subModalCliente.style.display = 'flex';
    txtBuscaCliente.value = '';
    cacheClientes = await ClienteService.listarTodos();
    renderizarListaSelecaoCliente(cacheClientes);
});

function renderizarListaSelecaoCliente(lista) {
    const corpo = document.getElementById('corpoSelecaoCliente');
    corpo.innerHTML = '';

    if (lista.length === 0) {
        corpo.innerHTML = '<tr><td colspan="3" class="texto-centralizado">Nenhum produto encontrado.</td></tr>';
        return;
    }

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

document.getElementById('btnBuscarProdutoOrc').addEventListener('click', async () => {
    subModalProduto.style.display = 'flex';
    txtBuscaProduto.value = '';
    cacheProdutos = await ProdutoService.listarTodos();
    renderizarListaSelecaoProduto(cacheProdutos);
});

function renderizarListaSelecaoProduto(lista) {
    const corpo = document.getElementById('corpoSelecaoProduto');
    corpo.innerHTML = '';

    if (lista.length === 0) {
        corpo.innerHTML = '<tr><td colspan="2" class="texto-centralizado">Nenhum cliente encontrado.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><strong>${p.produtoid}</strong></td><td>${p.dsProduto}</td><td>R$ ${parseFloat(p.vlVendaProduto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>`;
        tr.addEventListener('click', () => {
            inputProdId.value = p.produtoid;
            inputProdDesc.value = p.dsProduto;
            inputProdPreco.value = p.vlVendaProduto;
            inputProdQtd.value = 1;
            subModalProduto.style.display = 'none';
        });
        corpo.appendChild(tr);
    });
}

/* ==========================================
   CONTROLE INTERNO DO CARRINHO DE ITENS
   ========================================== */

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
            <td><button type="button" class="btn btn-deletar-item-carrinho" data-index="${index}">&times;</button></td>
        `;

        tr.querySelector('button').addEventListener('click', () => {
            itensCarrinho.splice(index, 1);
            atualizarTabelaCarrinho();
        });

        tabelaItensAdicionados.appendChild(tr);
    });

    labelValorTotalGeral.textContent = `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

/* ==========================================
   EVENTO SUBMIT - PERSISTÊNCIA MESTRE-DETALHE
   ========================================== */

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

/* ==========================================
   GERENCIAMENTO DE INTERAÇÃO DE JANELAS MODAIS
   ========================================== */

btnNovoOrcamento.addEventListener('click', () => {
    formOrcamento.reset();
    itensCarrinho = [];
    atualizarTabelaCarrinho();
    modalOrcamento.style.display = 'flex';
});

document.getElementById('btnFecharModal').addEventListener('click', () => modalOrcamento.style.display = 'none');
document.getElementById('btnCancelarOrcamento').addEventListener('click', () => modalOrcamento.style.display = 'none');
document.getElementById('btnFecharSubCli').addEventListener('click', () => subModalCliente.style.display = 'none');
document.getElementById('btnFecharSubProd').addEventListener('click', () => subModalProduto.style.display = 'none');
document.getElementById('btnFecharModalResumo').addEventListener('click', () => modalResumo.style.display = 'none');
document.getElementById('btnFecharResumoJanela').addEventListener('click', () => modalResumo.style.display = 'none');

window.addEventListener('click', (e) => {
    if (e.target === modalOrcamento) modalOrcamento.style.display = 'none';
    if (e.target === modalResumo) modalResumo.style.display = 'none';
    if (e.target === modalFiltros) modalFiltros.style.display = 'none';
});

// ==========================================================================
// FUNÇÃO PARA GERAR E IMPRIMIR O PDF DO ORÇAMENTO
// ==========================================================================
btnImprimirOrcamento.addEventListener('click', () => {
    const tituloTexto = resumoTitulo.textContent;
    const numeroOrcamento = tituloTexto.replace(/\D/g, '');
    
    const cliente = resumoCliente.textContent;
    const dataEmissao = resumoData.textContent;

    let dataValidade = "...";
    const linhaCorrespondente = tabelaCorpo.querySelector(`tr td:first-child`);
    if (linhaCorrespondente) {
        const linhas = tabelaCorpo.querySelectorAll('tr');
        for (let row of linhas) {
            if (row.cells[0] && row.cells[0].textContent == numeroOrcamento) {
                dataValidade = row.cells[3].textContent;
                break;
            }
        }
    }

    const valorTotalGeral = resumoTotalGeral.textContent;

    let itensHtml = '';
    const linhasItens = corpoTabelaResumo.querySelectorAll('tr');
    
    linhasItens.forEach(linha => {
        if (linha.cells.length >= 4) {
            const produto = linha.cells[0].textContent;
            const quantidade = linha.cells[1].textContent;
            const valorUnitario = linha.cells[2].textContent;
            const totalItem = linha.cells[3].textContent;

            itensHtml += `
                <tr>
                    <td>${produto}</td>
                    <td style="text-align: center;">${quantidade}</td>
                    <td style="text-align: right;">${valorUnitario}</td>
                    <td style="text-align: right;">${totalItem}</td>
                </tr>
            `;
        }
    });

    const janelaImpressao = window.open('', '_blank', 'width=900,height=1100');
    
    janelaImpressao.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Orçamento #${numeroOrcamento}</title>
            <style>
                @page {
                    size: A4;
                    margin: 20mm 15mm;
                }
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    color: #333;
                    margin: 0;
                    padding: 0;
                    font-size: 11pt;
                    line-height: 1.4;
                }
                .header-container {
                    border-bottom: 3px solid #1a5c96;
                    padding-bottom: 12px;
                    margin-bottom: 30px;
                }
                .header-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .header-table td {
                    border: none;
                    padding: 0;
                }
                .titulo-orcamento {
                    font-size: 24pt;
                    font-weight: bold;
                    color: #1a5c96;
                    text-transform: uppercase;
                }
                .empresa-dados {
                    text-align: right;
                    font-size: 9pt;
                    color: #666;
                }
                .meta-table {
                    width: 100%;
                    border-collapse: collapse;
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    margin-bottom: 30px;
                }
                .meta-table th {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-weight: bold;
                    text-align: left;
                    padding: 10px 12px;
                    font-size: 9pt;
                    text-transform: uppercase;
                    border-bottom: 1px solid #e2e8f0;
                }
                .meta-table td {
                    padding: 12px;
                    font-size: 11pt;
                }
                .meta-table td:not(:last-child), .meta-table th:not(:last-child) {
                    border-right: 1px solid #e2e8f0;
                }
                .itens-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .itens-table th {
                    background-color: #1a5c96;
                    color: #ffffff;
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 9pt;
                    padding: 10px 12px;
                    border: 1px solid #1a5c96;
                }
                .itens-table td {
                    padding: 10px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    border-left: 1px solid #e2e8f0;
                    border-right: 1px solid #e2e8f0;
                }
                .itens-table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .barra-total {
                    background-color: #1a5c96;
                    color: white;
                    text-align: right;
                    padding: 15px 20px;
                    font-size: 16pt;
                    font-weight: bold;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                .barra-total span {
                    margin-left: 15px;
                }
                .footer-observacao {
                    margin-top: 50px;
                    font-size: 9pt;
                    color: #64748b;
                    border-top: 1px dashed #cbd5e1;
                    padding-top: 15px;
                }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <table class="header-table">
                    <tr>
                        <td class="titulo-orcamento">Orçamento #${numeroOrcamento}</td>
                        <td class="empresa-dados">
                            <strong>OrcERP Propostas</strong><br>
                            Maringá, PR<br>
                            Sistema de Gestão Comercial
                        </td>
                    </tr>
                </table>
            </div>

            <table class="meta-table">
                <thead>
                    <tr>
                        <th>Nome do Cliente</th>
                        <th>Data de Emissão</th>
                        <th>Data de Vencimento</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>${cliente}</strong></td>
                        <td>${dataEmissao}</td>
                        <td>${dataValidade}</td>
                    </tr>
                </tbody>
            </table>

            <table class="itens-table">
                <thead>
                    <tr>
                        <th style="text-align: left; width: 50%;">Nome do Produto</th>
                        <th style="text-align: center; width: 10%;">Qtd</th>
                        <th style="text-align: right; width: 20%;">Valor Unitário</th>
                        <th style="text-align: right; width: 20%;">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itensHtml}
                </tbody>
            </table>

            <div class="barra-total">
                VALOR TOTAL GERAL: <span>${valorTotalGeral}</span>
            </div>

            <div class="footer-observacao">
                * Documento gerado via OrcERP. Válido até a data de vencimento estipulada acima.
            </div>

            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    janelaImpressao.document.close();
});