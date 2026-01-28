import { Member } from './types';

// Helper to generate a placeholder PNG-like URL
// When you have the real files, simply replace these URLs with local paths like:
// avatarUrl: "/images/gabriel.png"
const getPlaceholder = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f1f22&color=d97706&size=256&font-size=0.33&format=png`;

export const CLAN_MEMBERS: Member[] = [
  { id: '1', name: 'Gabriel', role: 'Veteran', avatarUrl: getPlaceholder('Gabriel') },
  { id: '2', name: 'Tengu Diddy', role: 'Member', avatarUrl: getPlaceholder('Tengu Diddy') },
  { id: '3', name: 'NaitoMare01', role: 'Member', avatarUrl: getPlaceholder('NaitoMare01') },
  { id: '4', name: 'alejtb', role: 'Member', avatarUrl: getPlaceholder('alejtb') },
  { id: '5', name: 'MrSuomi', role: 'Member', avatarUrl: getPlaceholder('MrSuomi') },
  { id: '6', name: 'Haaland', role: 'Member', avatarUrl: getPlaceholder('Haaland') },
  { id: '7', name: 'Pablo de los Backyardigans', role: 'Member', avatarUrl: getPlaceholder('Pablo') },
  { id: '8', name: 'Heitan_Mamoa', role: 'Member', avatarUrl: getPlaceholder('Heitan Mamoa') },
  { id: '9', name: 'ezexdp', role: 'Member', avatarUrl: getPlaceholder('ezexdp') },
  { id: '10', name: 'Yuki', role: 'Member', avatarUrl: getPlaceholder('Yuki') },
  { id: '11', name: 'Aomine', role: 'Member', avatarUrl: getPlaceholder('Aomine') },
];

export const NAV_ITEMS = [
  { label: 'Inicio', href: '#hero' },
  { label: 'Miembros', href: '#members' },
  {
    label: 'Comunidad',
    href: '#',
    children: [
      { label: 'Torneos', href: '/tournaments' },
      { label: 'Showmatchs', href: '/showmatchs' },
      { label: 'Momentos', href: '/moments' },
    ]
  },
  { label: 'Sobre Nosotros', href: '#about' },
];