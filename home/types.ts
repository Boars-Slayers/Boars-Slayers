export interface Member {
  id: string;
  name: string;
  role: string;
  avatarUrl: string; // This will point to your local PNG eventually
  favoriteCiv?: string;
  steamId?: string;
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
  created_at: string;
  // joined fields
  participants_count?: number;
}