import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Faltan las variables de entorno de Supabase. El login no funcionará hasta configurarlas.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export type UserRole = 'admin' | 'member' | 'candidate';

export interface UserProfile {
    id: string;
    username: string;
    avatar_url: string;
    steam_id: string;
    role: UserRole;
    bio?: string;
    favorite_civ?: string;
    created_at: string;
}
