import { UsuarioService } from '../../scripts/services/UsuarioService.js'; 

const formulario = document.getElementById('formLogin');
const btnEntrar = document.getElementById('btnEntrar');

formulario.addEventListener('submit', async (event) => {
    event.preventDefault();

    const usernameDigitado = document.getElementById('username').value.trim();
    const senhaDigitada = document.getElementById('password').value;

    if (!usernameDigitado || !senhaDigitada) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    const textoOriginalBotao = btnEntrar.textContent;
    btnEntrar.disabled = true;
    btnEntrar.textContent = 'Carregando...';

    try {
        const resultado = await UsuarioService.login(usernameDigitado, senhaDigitada);

        if (resultado.autenticado) {
            console.log('Login efetuado:', resultado.usuario);

            sessionStorage.setItem('usuarioLogado', resultado.usuario.nomeCompleto);

            window.location.href = 'inicio.html'; 
        } else {
            alert(resultado.mensagem);

            btnEntrar.disabled = false;
            btnEntrar.textContent = textoOriginalBotao;
        }

    } catch (error) {
        console.error('Erro ao tentar logar:', error);
        alert('Erro ao conectar com o OrcERP. Verifique sua conexão.');
        
        btnEntrar.disabled = false;
        btnEntrar.textContent = textoOriginalBotao;
    }
});

const btnEsqueciSenha = document.getElementById('btnEsqueciSenha');
btnEsqueciSenha.addEventListener('click', () => {
    window.location.href = 'esqueci-senha.html';
});