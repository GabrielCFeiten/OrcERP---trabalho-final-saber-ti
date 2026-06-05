export class Produto {
    constructor(categoriaProdutoId, dsProduto, obsProduto, vlVendaProduto, dtCadastroProduto, statusProduto, produtoid = null) {
        this.produtoid = produtoid;
        this.categoriaProdutoId = categoriaProdutoId;
        this.dsProduto = dsProduto;
        this.obsProduto = obsProduto;
        this.vlVendaProduto = vlVendaProduto;
        this.dtCadastroProduto = dtCadastroProduto;
        this.statusProduto = statusProduto;
    }

    get precoFormatado() {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(this.vlVendaProduto);
    }

    estaAtivo() {
        return this.statusProduto.toUpperCase() === 'ATIVO';
    }
}