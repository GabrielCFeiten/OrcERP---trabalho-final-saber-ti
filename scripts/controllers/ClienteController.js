import { ClienteService } from '../services/ClienteService.js';
import { Cliente } from '../classes/Cliente.js';
import { ClienteUtils } from '../utils/ClienteUtils.js';

// Elementos do DOM Principal
const tabelaCorpo = document.getElementById('corpoTabelaClientes');
const modal = document.getElementById('modalCliente');
const formCliente = document.getElementById('formCliente');
const modalTitulo = document.getElementById('modalTituloCliente');

// Campos de Pesquisa e Filtros
const campoPesquisa = document.getElementById('campoPesquisa');
const botoesFiltro = document.querySelectorAll('.btn-filtro');
let tipoSelecionado = 'TODOS'; // Estado global do filtro de tipo

// Campos do Formulário
const inputId = document.getElementById('clienteId');
const inputTipo = document.getElementById('tipoCliente');
const inputDocumento = document.getElementById('cpfCnpjCliente');
const inputNome = document.getElementById('nomeCliente');
const labelCpfCnpj = document.getElementById('labelCpfCnpj');

// Botões de Controle
const btnNovoCliente = document.getElementById('btnNovoCliente');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarCliente = document.getElementById('btnCancelarCliente');

document.addEventListener('DOMContentLoaded', carregarClientes);

/* ==========================================
   DINÂMICA DE INPUTS (CPF vs CNPJ)
   ========================================== */

inputTipo.addEventListener('change', () => {
    if (inputTipo.value === 'F') {
        labelCpfCnpj.textContent = 'CPF:';
        inputDocumento.placeholder = '000.000.000-00';
    } else {
        labelCpfCnpj.textContent = 'CNPJ:';
        inputDocumento.placeholder = '00.000.000/0001-00';
    }
    inputDocumento.value = ClienteUtils.formatarDocumento(inputDocumento.value);
});

inputDocumento.addEventListener('blur', (e) => {
    e.target.value = ClienteUtils.formatarDocumento(e.target.value);
});

/* ==========================================
   FUNÇÕES DE RENDERIZAÇÃO E FILTRAGEM
   ========================================== */

async function carregarClientes() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">Carregando clientes...</td></tr>';
        const clientes = await ClienteService.listarTodos();
        tabelaCorpo.innerHTML = '';

        if (clientes.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhum cliente cadastrado.</td></tr>';
            return;
        }

        clientes.forEach(cli => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cli.clienteid}</td>
                <td>${cli.nomeCliente}</td>
                <td>${cli.tipoCliente === 'F' ? 'Física' : 'Jurídica'}</td>
                <td>${cli.cpfCnpjCliente}</td>
                <td class="acoes">
                    <div class="botoes-acoes">
                        <button class="btn btn-secondary btn-tab btn-editar" 
                            data-id="${cli.clienteid}" 
                            data-tipo="${cli.tipoCliente}" 
                            data-doc="${cli.cpfCnpjCliente}"
                            data-nome="${cli.nomeCliente}">Editar</button>
                        <button class="btn btn-success btn-tab btn-deletar" data-id="${cli.clienteid}">Excluir</button>
                    </div>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();

        // Reaplica os filtros caso o usuário já tenha digitado ou selecionado algo antes da atualização
        filtrarClientes();
    } catch (error) {
        console.error(error);
        tabelaCorpo.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Erro ao carregar dados dos clientes.</td></tr>';
    }
}

function configurarEventosTabela() {
    document.querySelectorAll('.btn-editar').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = botao.getAttribute('data-id');
            const tipo = botao.getAttribute('data-tipo');
            const doc = botao.getAttribute('data-doc');
            const nome = botao.getAttribute('data-nome');

            abrirModalParaEdicao(id, tipo, doc, nome);
        });
    });

    document.querySelectorAll('.btn-deletar').forEach(botao => {
        botao.addEventListener('click', async () => {
            const id = botao.getAttribute('data-id').trim();
            if (confirm('Deseja realmente remover este cliente?')) {
                const resultado = await ClienteService.deletar(id);
                alert(resultado.mensagem);
                if (resultado.sucesso) carregarClientes();
            }
        });
    });
}

function filtrarClientes() {
    if (!campoPesquisa) return;

    const termo = campoPesquisa.value.toLowerCase();
    const linhas = tabelaCorpo.querySelectorAll('tr');

    linhas.forEach(linha => {
        // Ignora linhas de mensagens estruturais (carregando / vazio)
        if (linha.cells.length === 1) return;

        const nome = linha.cells[1]?.textContent.toLowerCase() || '';
        const tipoClienteNaLinha = linha.cells[2]?.textContent.trim();
        const documento = linha.cells[3]?.textContent.toLowerCase() || '';

        // Filtro 1: Texto (Nome ou CPF/CNPJ)
        const bateTexto = nome.includes(termo) || documento.includes(termo);

        // Filtro 2: Tipo de Pessoa (Física ou Jurídica)
        let bateTipo = false;
        if (tipoSelecionado === 'TODOS') {
            bateTipo = true;
        } else if (tipoSelecionado === 'F' && tipoClienteNaLinha === 'Física') {
            bateTipo = true;
        } else if (tipoSelecionado === 'J' && tipoClienteNaLinha === 'Jurídica') {
            bateTipo = true;
        }

        // Exibe se atender a ambos os critérios
        if (bateTexto && bateTipo) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}

/* ==========================================
   GERENCIAMENTO DO MODAL
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Cliente';
    formCliente.reset();
    inputId.value = '';
    labelCpfCnpj.textContent = 'CPF:';
    inputDocumento.placeholder = '000.000.000-00';
    modal.style.display = 'flex';
}

function abrirModalParaEdicao(id, tipo, doc, nome) {
    modalTitulo.textContent = 'Editar Cliente';
    inputId.value = id;
    inputTipo.value = tipo;
    
    inputTipo.dispatchEvent(new Event('change'));
    
    inputDocumento.value = doc;
    inputNome.value = nome;
    modal.style.display = 'flex';
}

function fecharModal() {
    modal.style.display = 'none';
    formCliente.reset();
}

/* ==========================================
   EVENTOS DE INTERAÇÃO (SUBMIT E CLIQUES)
   ========================================== */

formCliente.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = inputId.value;
    const tipo = inputTipo.value;
    const documentoDigitado = inputDocumento.value;
    const nome = inputNome.value.trim();

    const documentoValido = tipo === 'F' 
        ? ClienteUtils.validarCPF(documentoDigitado) 
        : ClienteUtils.validarCNPJ(documentoDigitado);

    if (!documentoValido) {
        alert(`O ${tipo === 'F' ? 'CPF' : 'CNPJ'} digitado é inválido. Por favor, verifique os números.`);
        inputDocumento.focus();
        return;
    }

    const clienteInstancia = new Cliente(
        tipo,
        documentoDigitado,
        nome,
        id ? id : null
    );

    let resposta;
    if (id) {
        resposta = await ClienteService.editar(clienteInstancia);
    } else {
        resposta = await ClienteService.salvar(clienteInstancia);
    }

    alert(resposta.mensagem);
    if (resposta.sucesso) {
        fecharModal();
        carregarClientes();
    }
});

// Vinculação dos eventos de pesquisa e filtros dinâmicos
if (campoPesquisa) {
    campoPesquisa.addEventListener('input', filtrarClientes);
}

botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
        botoesFiltro.forEach(b => b.classList.remove('active'));
        botao.classList.add('active');

        tipoSelecionado = botao.getAttribute('data-tipo');
        filtrarClientes();
    });
});

// Eventos de clique para fechamento do modal
btnNovoCliente.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarCliente.addEventListener('click', fecharModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});