export class Orcamento {
    constructor(clienteId, dtOrcamento, dtValidadeOrcamento, vlTotalOrcamento, orcamentoid = null) {
        this.orcamentoid = orcamentoid;
        this.clienteId = clienteId;
        this.dtOrcamento = dtOrcamento;
        this.dtValidadeOrcamento = dtValidadeOrcamento;
        this.vlTotalOrcamento = vlTotalOrcamento;
        this.itens = []; // Array que vai guardar as instâncias de OrcamentoItem
    }
}

export class OrcamentoItem {
    constructor(produtoId, produtoDesc, qtProduto, vlUnitario, vlTotal, orcamentoid = null, orcamentoitemid = null) {
        this.orcamentoitemid = orcamentoitemid;
        this.orcamentoid = orcamentoid;
        this.produtoId = produtoId;
        this.produtoDesc = produtoDesc;
        this.qtProduto = qtProduto;
        this.vlUnitario = vlUnitario;
        this.vlTotal = vlTotal;
    }
}