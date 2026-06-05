export class ClienteUtils {

    // Remove qualquer caractere que não seja número (. , - /)
    static limparTexto(documento) {
        return String(documento).replace(/\D/g, '');
    }

    // Aplica a máscara visual de CPF ou CNPJ
    static formatarDocumento(documento) {
        const numeros = this.limparTexto(documento);

        if (numeros.length === 11) {
            return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (numeros.length === 14) {
            return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return documento;
    }

    // Validador matemático oficial de CPF
    static validarCPF(cpf) {
        const numeros = this.limparTexto(cpf);
        if (numeros.length !== 11 || /^(\d)\1{10}$/.test(numeros)) return false;

        let soma = 0;
        for (let i = 0; i < 9; i++) soma += parseInt(numeros.charAt(i)) * (10 - i);
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(numeros.charAt(9))) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) soma += parseInt(numeros.charAt(i)) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(numeros.charAt(10))) return false;

        return true;
    }

    // Validador matemático oficial de CNPJ
    static validarCNPJ(cnpj) {
        const numeros = this.limparTexto(cnpj);
        if (numeros.length !== 14 || /^(\d)\1{13}$/.test(numeros)) return false;

        let tamanho = numeros.length - 2;
        let numerosSub = numeros.substring(0, tamanho);
        let digitos = numeros.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numerosSub.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(0))) return false;

        tamanho = tamanho + 1;
        numerosSub = numeros.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += parseInt(numerosSub.charAt(tamanho - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
        if (resultado !== parseInt(digitos.charAt(1))) return false;

        return true;
    }
}