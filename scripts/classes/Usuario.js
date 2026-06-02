export class Usuario {
    constructor(usuario, nomeCompleto, senha, id = null) {
        this.id = id;
        this.usuario = usuario;
        this.nomeCompleto = nomeCompleto;
        this.senha = senha;
    }

    validarSenha(senhaDigitada) {
        return this.senha === senhaDigitada;
    }
}