import { UsuarioService } from '../services/UsuarioService.js';
import { Usuario } from '../classes/Usuario.js';

// Elementos do DOM
const tabelaCorpo = document.getElementById('corpoTabelaUsuarios');
const modal = document.getElementById('modalUsuario');
const formUsuario = document.getElementById('formUsuario');
const modalTitulo = document.getElementById('modalTituloUsuario');

// Campos do Formulário
const inputId = document.getElementById('usuarioId');
const inputNome = document.getElementById('nomeUsuario');
const inputUsername = document.getElementById('usernameUsuario');
const inputSenha = document.getElementById('senhaUsuario');

// Botões de Ação
const btnNovoUsuario = document.getElementById('btnNovoUsuario');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarUsuario = document.getElementById('btnCancelarUsuario');
const btnAlternarSenha = document.getElementById('btnAlternarSenha');

// Inicialização
document.addEventListener('DOMContentLoaded', carregarUsuarios);

/* ==========================================
   FUNÇÕES DE RENDERIZAÇÃO DA TABELA
   ========================================== */

async function carregarUsuarios() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="text-align:center;">Carregando usuários...</td></tr>';

        const usuarios = await UsuarioService.listarTodos();
        tabelaCorpo.innerHTML = '';

        if (usuarios.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="4" style="text-align:center;">Nenhum usuário encontrado.</td></tr>';
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${user.nomeCompleto || 'Sem Nome'}</td>
                <td>${user.usuario || ''}</td>
                <td>${user.senha || ''}</td>
                <td class="acoes">
                    <button class="btn btn-secondary btn-tab btn-editar" 
                        data-id="${user.id}" 
                        data-nome="${user.nomeCompleto || ''}" 
                        data-username="${user.usuario || ''}"
                        data-senha="${user.senha || ''}">Editar</button>
                    <button class="btn btn-success btn-tab btn-deletar" data-id="${user.id}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        configurarEventosTabela();

    } catch (error) {
        console.error(error);
        tabelaCorpo.innerHTML = '<tr><td colspan="4" style="text-align:center; color: red;">Erro ao carregar dados.</td></tr>';
    }
}

function configurarEventosTabela() {
    document.querySelectorAll('.btn-editar').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = botao.getAttribute('data-id');
            const nome = botao.getAttribute('data-nome');
            const username = botao.getAttribute('data-username');
            const senha = botao.getAttribute('data-senha');
            abrirModalParaEdicao(id, nome, username, senha);
        });
    });

    document.querySelectorAll('.btn-deletar').forEach(botao => {
        botao.addEventListener('click', async () => {
            const id = botao.getAttribute('data-id');
            if (confirm('Deseja realmente excluir este usuário?')) {
                const resultado = await UsuarioService.deletar(id);
                alert(resultado.mensagem);
                if (resultado.sucesso) carregarUsuarios();
            }
        });
    });
}

/* ==========================================
   CONTROLE DO MODAL E SENHA (OLHO)
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Usuário';
    formUsuario.reset();
    inputId.value = '';
    resetarVisualizacaoSenha();
    modal.style.display = 'flex';
}

function abrirModalParaEdicao(id, nome, username, senha) {
    modalTitulo.textContent = 'Editar Usuário';
    inputId.value = id;
    inputNome.value = (nome === 'undefined' || nome === 'null') ? '' : nome;
    inputUsername.value = (username === 'undefined' || username === 'null') ? '' : username;
    inputSenha.value = (senha === 'undefined' || senha === 'null') ? '' : senha;
    resetarVisualizacaoSenha();
    modal.style.display = 'flex';
}

function fecharModal() {
    modal.style.display = 'none';
    formUsuario.reset();
    inputId.value = '';
}

function resetarVisualizacaoSenha() {
    inputSenha.type = 'password';
    btnAlternarSenha.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
}

btnAlternarSenha.addEventListener('click', () => {
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        btnAlternarSenha.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    } else {
        resetarVisualizacaoSenha();
    }
});

/* ==========================================
   EVENTO SUBMIT (SALVAR / ATUALIZAR)
   ========================================== */

formUsuario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = inputId.value;
    const nome = inputNome.value.trim();
    const username = inputUsername.value.trim();
    const senha = inputSenha.value;

    const usuarioInstancia = new Usuario(username, nome, senha, id ? id : null);
    let resposta;

    if (id) {
        resposta = await UsuarioService.editar(usuarioInstancia);
    } else {
        resposta = await UsuarioService.salvar(usuarioInstancia);
    }

    alert(resposta.mensagem);
    if (resposta.sucesso) {
        fecharModal();
        carregarUsuarios();
    }
});

btnNovoUsuario.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarUsuario.addEventListener('click', fecharModal);

window.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});