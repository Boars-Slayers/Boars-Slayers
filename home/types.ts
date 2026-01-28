export interface Member {
  id: string;
  name: string;
  role: 'Leader' | 'Veteran' | 'Member';
  avatarUrl: string; // This will point to your local PNG eventually
  favoriteCiv?: string;
}

export interface NavItem {
  label: string;
  href: string;
}