import { ClienteService } from '../services/ClienteService.js';
import { Cliente } from '../classes/Cliente.js';
import { ClienteUtils } from '../utils/ClienteUtils.js';

// Elementos do DOM Principal
const tabelaCorpo = document.getElementById('corpoTabelaClientes');
const modal = document.getElementById('modalCliente');
const formCliente = document.getElementById('formCliente');
const modalTitulo = document.getElementById('modalTituloCliente');

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

// Altera o rótulo e placeholder visual dependendo do tipo selecionado
inputTipo.addEventListener('change', () => {
    if (inputTipo.value === 'F') {
        labelCpfCnpj.textContent = 'CPF:';
        inputDocumento.placeholder = '000.000.000-00';
    } else {
        labelCpfCnpj.textContent = 'CNPJ:';
        inputDocumento.placeholder = '00.000.000/0001-00';
    }
    // Formata o valor atual se o usuário mudar o select com texto já digitado
    inputDocumento.value = ClienteUtils.formatarDocumento(inputDocumento.value);
});

// Quando o usuário sai do campo de documento, ele formata com pontos/traços automaticamente
inputDocumento.addEventListener('blur', (e) => {
    e.target.value = ClienteUtils.formatarDocumento(e.target.value);
});

/* ==========================================
   FUNÇÕES DE RENDERIZAÇÃO DA TABELA
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
                        <button class="btn btn-success btn-tab btn-deletar" data-id="${cli.clienteid}           ">Excluir</button>
                    </div>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();
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
            const id = botao.getAttribute('data-id');
            if (confirm('Deseja realmente remover este cliente?')) {
                const resultado = await ClienteService.deletar(id);
                alert(resultado.mensagem);
                if (resultado.sucesso) carregarClientes();
            }
        });
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
    
    // Dispara manualmente a atualização visual do label/placeholder
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
   EVENTO SUBMIT (SALVAR / ATUALIZAR)
   ========================================== */

formCliente.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = inputId.value;
    const tipo = inputTipo.value;
    const documentoDigitado = inputDocumento.value;
    const nome = inputNome.value.trim();

    // Executa a validação matemática antes de avançar para o banco de dados
    const documentoValido = tipo === 'F' 
        ? ClienteUtils.validarCPF(documentoDigitado) 
        : ClienteUtils.validarCNPJ(documentoDigitado);

    if (!documentoValido) {
        alert(`O ${tipo === 'F' ? 'CPF' : 'CNPJ'} digitado é inválido. Por favor, verifique os números.`);
        inputDocumento.focus();
        return; // Interrompe o envio
    }

    // Instancia a classe passando o documento (que será auto-formatado pelo Service)
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

// Eventos de clique para fechamento do modal
btnNovoCliente.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarCliente.addEventListener('click', fecharModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});