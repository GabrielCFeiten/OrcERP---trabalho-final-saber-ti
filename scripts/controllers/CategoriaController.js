import { CategoriaService } from '../services/CategoriaService.js'; 
import { Categoria } from '../classes/Categoria.js';

// Elementos do DOM Principal
const tabelaCorpo = document.getElementById('corpoTabelaCategorias');
const modal = document.getElementById('modalCategoria');
const formCategoria = document.getElementById('formCategoria');
const modalTitulo = document.getElementById('modalTituloCategoria');

// Campo de Pesquisa
const campoPesquisa = document.getElementById('campoPesquisa');

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
   FUNÇÕES DE RENDERIZAÇÃO E FILTRAGEM
   ========================================== */

async function carregarCategorias() {
    try {
        tabelaCorpo.innerHTML = '<tr><td colspan="3" class="texto-centralizado">Carregando categorias...</td></tr>';
        
        const categories = await CategoriaService.listarTodos();
        tabelaCorpo.innerHTML = ''; // Limpa a mensagem de carregando

        if (categories.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="3" class="texto-centralizado">Nenhuma categoria encontrada.</td></tr>';
            return;
        }

        categories.forEach(categoria => {
            const tr = document.createElement('tr');
            
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

        configurarEventosTabela();
        
        // Reaplica o filtro caso haja algum termo digitado durante a atualização técnica
        filtrarCategorias();

    } catch (error) {
        alert(error.message);
        tabelaCorpo.innerHTML = '<tr><td colspan="3" class="texto-centralizado erro-carregamento">Erro ao carregar os dados.</td></tr>';
    }
}

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

// Filtra a tabela focando exclusivamente na coluna "Descrição" (Coluna 2)
function filtrarCategorias() {
    if (!campoPesquisa) return;

    const termo = campoPesquisa.value.toLowerCase();
    const linhas = tabelaCorpo.querySelectorAll('tr');

    linhas.forEach(linha => {
        // Ignora estruturas de uma única célula (Ex: Mensagens de "Carregando" ou "Nenhuma cadastrada")
        if (linha.cells.length === 1) return;

        // Captura textualmente o conteúdo da célula de Descrição (Índice 1 correspondente ao segundo td)
        const descricao = linha.cells[1]?.textContent.toLowerCase() || '';

        if (descricao.includes(termo)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}

/* ==========================================
   FUNÇÕES DE CONTROLE DO MODAL
   ========================================== */

function abrirModalParaCadastro() {
    modalTitulo.textContent = 'Adicionar Categoria';
    formCategoria.reset();
    inputId.value = ''; 
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
        resposta = await CategoriaService.editar(categoriaInstancia);
    } else {
        resposta = await CategoriaService.salvar(categoriaInstancia);
    }

    alert(resposta.mensagem);

    if (resposta.sucesso) {
        fecharModal();
        carregarCategorias(); 
    }
});

/* ==========================================
   ATRIBUIÇÃO DOS EVENTOS DE ESCUTA
   ========================================== */

// Evento de digitação na barra de pesquisa
if (campoPesquisa) {
    campoPesquisa.addEventListener('input', filtrarCategorias);
}

btnNovaCategoria.addEventListener('click', abrirModalParaCadastro);
btnFecharModal.addEventListener('click', fecharModal);
btnCancelarCategoria.addEventListener('click', fecharModal);

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        fecharModal();
    }
});