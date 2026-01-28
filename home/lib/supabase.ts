import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Faltan las variables de entorno de Supabase. El login no funcionará hasta configurarlas.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Role is now dynamic, but we keep these types for reference/default logic
export type UserRole = string;

export interface ClanRole {
    id: string;
    name: string;
    color: string;
    created_at: string;
}

export interface UserProfile {
    id: string;
    username: string;
    avatar_url: string;
    steam_id: string;
    discord_id: string;
    role: UserRole;
    bio?: string;
    favorite_civ?: string;
    aoe_insights_url?: string;
    reason?: string;
    accepted_rules?: boolean;
    contact_email?: string;
    phone_number?: string;
    created_at: string;
}
