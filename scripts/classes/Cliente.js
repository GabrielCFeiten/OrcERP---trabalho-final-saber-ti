export class Cliente {
    constructor(tipoCliente, cpfCnpjCliente, nomeCliente, clienteid = null) {
        this.clienteid = clienteid;
        this.tipoCliente = tipoCliente; // 'F' ou 'J'
        this.cpfCnpjCliente = cpfCnpjCliente; // Salvaremos formatado aqui
        this.nomeCliente = nomeCliente;
    }
}