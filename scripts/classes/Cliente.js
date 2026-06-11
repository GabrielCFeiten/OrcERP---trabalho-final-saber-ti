export class Cliente {
    constructor(tipoCliente, cpfCnpjCliente, nomeCliente, clienteid = null) {
        this.clienteid = clienteid;
        this.tipoCliente = tipoCliente;
        this.cpfCnpjCliente = cpfCnpjCliente;
        this.nomeCliente = nomeCliente;
    }
}