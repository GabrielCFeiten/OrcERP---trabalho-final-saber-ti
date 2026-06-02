import { createClient } from '@supabase/supabase-js';

class SupabaseConnection {
    constructor() {
        // Suas credenciais do projeto Supabase
        this.supabaseUrl = 'https://ewhcllqpsdvgyzhrnayh.supabase.co';
        this.supabaseKey = 'sb_publishable_0ke0NgnF_Jh8ZJz_MIkAWQ_ook_I3uJ';
        
        // Instância do cliente (começa como null)
        this.client = null;
    }

    // Método para obter a conexão (Garante uma única instância - Padrão Singleton)
    getConnection() {
        if (!this.client) {
            try {
                this.client = createClient(this.supabaseUrl, this.supabaseKey);
                console.log('⚡ Conexão com o Supabase inicializada com sucesso.');
            } catch (error) {
                console.error('❌ Erro ao conectar ao Supabase:', error.message);
                throw error;
            }
        }
        return this.client;
    }
}

// Exporta uma única instância da classe
const supabaseConnectionInstance = new SupabaseConnection();
export const supabase = supabaseConnectionInstance.getConnection();