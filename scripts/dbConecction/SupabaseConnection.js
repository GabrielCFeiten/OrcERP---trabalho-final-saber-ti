import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://ewhcllqpsdvgyzhrnayh.supabase.co';
const supabaseKey = 'sb_publishable_0ke0NgnF_Jh8ZJz_MIkAWQ_ook_I3uJ';

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('⚡ Instância do Supabase criada com sucesso.');