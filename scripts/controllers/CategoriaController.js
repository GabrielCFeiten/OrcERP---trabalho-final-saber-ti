import { CategoriaService } from '../services/CategoriaService.js'; // Ajuste o caminho se necessário
import { Categoria } from '../classes/Categoria.js';

// Elements do DOM
const tabelaCorpo = document.getElementById('corpoTabelaCategorias');
const modal = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const modalTitulo = document.getElementById('modalTituloCategoria');

// Campos do Formulário
const inputId = document.getElementById('categoriaId');
const inputDescricao = document.getElementById('descricaoCategoria');

// Botões de Ação Global
const btnNovaCategoria = document.getElementById('btnNovaCategoria');
const btnFecharModal = document.getElementById('btnFecharModal');
const btnCancelarCategoria = document.getElementById('btnCancelarCategoria');

// Inicialização da Página
document.addEventListener('DOMContentLoaded', carregarCategorias);

/* ==========================================
   FUNÇÕES DE RENDERIZAÇÃO E CARREGAMENTO
   ========================================== */

async function carregarCategorias() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="3" style="text-align:center;">Carregando categorias...</td></tr>';
        
        const categorias = await CategoriaService.listarTodos();
        tabelaCorpo.innerHTML = ''; // Limpa a mensagem de carregando

        if (categorias.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhuma categoria encontrada.</td></tr>';
            return;
        }

        categorias.forEach(categoria => {
            const tr = document.createElement('tr');
            
            // Note que usei propriedades genéricas baseadas no seu CategoriaService (.id e .descricao)
            tr.innerHTML = `
                <td>${categoria.id}</td>
                <td>${categoria.descricao}</td>
                <td class="acoes">
                    <button class="btn btn-secondary btn-tab btn-editar" data-id="${categoria.id}" data-descricao="${categoria.descricao}">Editar</button>
                    <button class="btn btn-success btn-tab btn-deletar" data-id="${categoria.id}">Excluir</button>
                </td>
            `;
            
            tabelaCorpo.appendChild(tr);
        });

        // Adiciona os eventos nos botões recém-criados da tabela
        configurarEventosTabela();

    } catch (error) {
        alert(error.message);
        tabelaCorpo.innerHTML = '<tr><td colspan="3" style="text-align:center; color: red;">Erro ao carregar os dados.</td></tr>';
    }
}

// Vincula as funções de editar e deletar aos botões dinâmicos da tabela
function configurarEventosTabela() {
    // Botões de Editar
    document.querySelectorAll('.btn-editar').forEach(botao => {
        botao.addEventListener('click', () => {
            const id = botao.getAttribute('data-id');
            const descricao = botao.getAttribute('data-descricao');
            abrirModalParaEdicao(id, descricao);
        });
    });

    // Botões de Deletar
    document.querySelectorAll('.btn-deletar').forEach(botao => {
        botao.addEventListener('click', async () => {
            const id = botao.getAttribute('data-id');
            if (confirm('Tem certeza que deseja remover esta categoria?')) {
                const resultado = await CategoriaService.deletar(id);
                alert(resultado.mensagem);
                if (resultado.sucesso) {
                    carregarCategorias();
                }
            }
        });
    });
}

/* ==========================================
   FUNÇÕES DE CONTROLE DO MODAL
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Categoria';
    formCategoria.reset();
    inputId.value = ''; // Garante que o ID oculto está vazio
    modal.style.display = 'flex';
}

function abrirModalParaEdicao(id, descricao) {
    modalTitulo.textContent = 'Editar Categoria';
    inputId.value = id;
    inputDescricao.value = descricao;
    modal.style.display = 'flex';
}

function fecharModal() {
    modal.style.display = 'none';
    formCategoria.reset();
    inputId.value = '';
}

/* ==========================================
   EVENTO DE SUBMIT (SALVAR / EDITAR)
   ========================================== */

formCategoria.addEventListener('submit', async (event) => {
    event.preventDefault();

    const id = inputId.value;
    const descricao = inputDescricao.value.trim();

    const categoriaInstancia = new Categoria(id ? id : null, descricao);
    
    let resposta;

    if (id) {
        // Se possui ID no input hidden, trata-se de uma atualização
        resposta = await CategoriaService.editar(categoriaInstancia);
    } else {
        // Se não possui ID, trata-se de um novo registro
        resposta = await CategoriaService.salvar(categoriaInstancia);
    }

    alert(resposta.mensagem);

    if (resposta.sucesso) {
        fecharModal();
        carregarCategorias(); // Atualiza a listagem em tempo real
    }
});

/* ==========================================
   ATRIBUIÇÃO DE EVENTOS DOS BOTÕES FIXOS
   ========================================== */

btnNovaCategoria.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarCategoria.addEventListener('click', fecharModal);

// Fecha o modal caso o usuário clique na parte escura de fora do card
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});