

import { UserProfile, Civilization, UserCivStats } from "../types";

// Simulate an API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_PROFILES: Record<string, Partial<UserProfile>> = {
    'viper': {
        name: 'TheViper',
        elo: 2650,
        topCivs: [
            { civ: Civilization.MAYANS, winRate: 68, gamesPlayed: 450 },
            { civ: Civilization.BRITONS, winRate: 65, gamesPlayed: 320 }
        ],
        weakCivs: [
            { civ: Civilization.GOTHS, winRate: 48, gamesPlayed: 50 }
        ]
    },
    'hera': {
        name: 'Hera',
        elo: 2680,
        topCivs: [
            { civ: Civilization.FRANKS, winRate: 70, gamesPlayed: 500 },
            { civ: Civilization.HUNS, winRate: 68, gamesPlayed: 400 }
        ],
        weakCivs: [
            { civ: Civilization.KOREANS, winRate: 52, gamesPlayed: 80 }
        ]
    },
    'daut': {
        name: 'Lord Daut',
        elo: 2450,
        topCivs: [
            { civ: Civilization.TEUTONS, winRate: 60, gamesPlayed: 600 }, // Crenellations OP
            { civ: Civilization.PORTUGUESE, winRate: 58, gamesPlayed: 300 }
        ],
        weakCivs: [
            { civ: Civilization.CHINESE, winRate: 45, gamesPlayed: 100 } // Micro issues simulated :D
        ]
    }
};

const getRandomCivStats = (count: number, minWr: number, maxWr: number): UserCivStats[] => {
    const civs = Object.values(Civilization);
    const result: UserCivStats[] = [];
    for(let i=0; i<count; i++) {
        const randomCiv = civs[Math.floor(Math.random() * civs.length)];
        result.push({
            civ: randomCiv,
            winRate: Math.floor(Math.random() * (maxWr - minWr) + minWr),
            gamesPlayed: Math.floor(Math.random() * 200) + 20
        });
    }
    return result;
};

export const fetchUserProfile = async (identifier: string): Promise<UserProfile | null> => {
    await delay(800); // Simulate network

    const key = identifier.toLowerCase().trim();
    
    // Check known mocks
    if (MOCK_PROFILES[key]) {
        return MOCK_PROFILES[key] as UserProfile;
    }

    // Generate random realistic profile for unknown users
    const isPro = Math.random() > 0.8;
    const baseElo = isPro ? 2200 : 1200;
    
    return {
        name: identifier,
        elo: Math.floor(baseElo + Math.random() * 400),
        topCivs: getRandomCivStats(3, 55, 65),
        weakCivs: getRandomCivStats(2, 35, 48)
    };
};