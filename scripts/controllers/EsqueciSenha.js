import { UsuarioService } from '../services/UsuarioService.js'; 

const formulario = document.getElementById('formRecuperar');
const btnAtualizar = document.getElementById('btnAtualizar');
const btnVoltarLogin = document.getElementById('btnVoltarLogin');

formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usernameDigitado = document.getElementById('username').value.trim();
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    // 1. Validação simples de preenchimento
    if (!usernameDigitado || !novaSenha || !confirmarSenha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // 2. Validação lógica se as duas senhas coincidem
    if (novaSenha !== confirmarSenha) {
        alert('A confirmação está incorreta. As duas senhas precisam ser idênticas!');
        return;
    }

    // Controle visual de carregamento (Igual ao seu Login.js)
    const textoOriginalBotao = btnAtualizar.textContent;
    btnAtualizar.disabled = true;
    btnAtualizar.textContent = 'Atualizando...';

    try {
        /* Aqui chamamos o método do Service passando o usuário e a nova senha.
           Certifique-se de que a assinatura do método no seu UsuarioService 
           bata com o nome que escolheu (ex: redefinirSenha ou atualizarSenha).
        */
        const resultado = await UsuarioService.atualizarSenha(usernameDigitado, novaSenha);

        if (resultado.sucesso) {
            alert('Senha redefinida com sucesso! Você será redirecionado para a tela de login.');
            window.location.href = 'login.html'; 
        } else {
            alert(resultado.mensagem || 'Usuário inválido ou não encontrado.');
            btnAtualizar.disabled = false;
            btnAtualizar.textContent = textoOriginalBotao;
        }

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        alert('Erro ao conectar com o banco do OrcERP. Tente novamente mais tarde.');
        
        btnAtualizar.disabled = false;
        btnAtualizar.textContent = textoOriginalBotao;
    }
});

// Ação para voltar à tela de login sem alterar nada
btnVoltarLogin.addEventListener('click', () => {
    window.location.href = 'login.html';
});