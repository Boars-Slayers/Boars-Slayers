export interface Member {
  id: string;
  name: string;
  role: string;
  roles?: { name: string, color: string }[];
  badges?: { id: string, image_url: string, description: string }[];
  avatarUrl: string; // This will point to your local PNG eventually
  favoriteCiv?: string;
  steamId?: string;
  nickname?: string;
  pending_nickname?: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export interface Badge {
  id: string;
  image_url: string;
  description: string;
  created_at: string;
}

export interface Tournament {
  id: string;
  title: string;
  description: string;
  start_date: string;
  is_public: boolean;
  status: 'draft' | 'open' | 'ongoing' | 'completed';
  created_by: string;
  max_participants: number;
  bracket_type: string;
  image_url?: string;
  sponsors?: string[];
  prizes?: string[];
  created_at: string;
  // joined fields
  participants_count?: number;
}

export interface Match {
  match_id: string;
  name: string; // Map name or Lobby name
  started: number; // Timestamp
  finished: number | null;
  players: {
    steam_id: string;
    name: string;
    civ: number;
    won: boolean;
    team: number | null;
  }[];
  ranked: boolean;
  result?: 'Victory' | 'Defeat';
  duration?: string;
  date_text?: string;
  type?: string;
}

export interface Moment {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  description?: string;
  created_at: string;
}

export interface MomentTag {
  id: string;
  moment_id: string;
  user_id: string;
  created_at: string;
}

export interface Showmatch {
  id: string;
  title: string;
  description?: string;
  player1_id?: string;
  player2_id?: string;
  p1_name?: string;
  p2_name?: string;
  scheduled_time: string;
  stream_url?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  winner_id?: string;
  result_score?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
  };
}