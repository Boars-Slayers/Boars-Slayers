# Boars Slayers Platform - Technical Architecture & Blue Paper

## 1. Executive Summary
The goal is to unify the current Marketing Front (`/home`) and the Build Order AI Tool (`/bo-tool`) into a single, cohesive **Next.js 14+ Platform**. This platform will not only serve as the clan's public face but also as a tactical hub with real-time data mining from AOE2.net and advanced team analysis.

## 2. System Architecture

### 2.1. Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with "Age of Empires Modern Dark" theme.
- **Language**: TypeScript
- **State Management**: React Context / Hooks (ported from current apps).
- **Data Source**: AOE2.net API (Public).

### 2.2. Directory Structure (Unified)
```
/platform  (New Root or replaced /home)
├── app/
│   ├── page.tsx              # Refactored Landing Page (Marketing)
│   ├── dashboard/            # Clan Status & Match Analytics
│   │   └── page.tsx
│   ├── bo-tool/              # Ported Build Order Tool
│   │   └── page.tsx
│   └── api/
│       ├── members/          # Member Data & Sync
│       └── strategy/         # BO Engine Logic Exposed
├── components/
│   ├── marketing/            # Landing Page Components
│   ├── bo/                   # BO Tool Components
│   └── shared/               # UI Kit (Buttons, Cards, Layouts)
├── lib/
│   ├── bo-engine/            # Core Simulation Logic (from /BOs/services)
│   ├── aoe2-net/             # API Client for External Data
│   └── storage/              # JSON/Local File Handler for Member Data
└── public/                   # Static Assets
```

## 3. Key Modules

### 3.1. Build Order Core (The "Brain")
The logic currently residing in `BOs/services/simulationEngine.ts` is the core asset.
- **Strategy**: Move this logic to `lib/bo-engine`.
- **Exposability**: Create an API Route `/api/strategy/simulate` that accepts a config and returns the simulation result.
    - *Use Case*: The Home page can have a "Mini-Widget" showing the current meta BO without loading the full tool.

### 3.2. Member Module (Data Mining)
- **Source**: AOE2.net API.
- **Tracking**:
    - `profile_id` (Steam ID / AOE ID)
    - `ELO` (1v1, Team)
    - `Win Rate` & `Civ Stats`
- **Storage**: For this MVP, we will use a local `members.json` file as the "Database" to avoid external DB dependencies unless requested.
- **Sync**: A server action or cron-like check to update ELOs.

### 3.3. "Best Teams" Algorithm
A dedicated service `lib/team-analysis.ts` will:
1. Fetch match history for all tracked members.
2. Filter for games where >1 tracked members played together.
3. Calculate Win Rate for each unique tuple (User A + User B).
4. Output specific "Squad Performance" matricies (2v2, 3v3).

## 4. Design System ("Age of Empires Modern Dark")
- **Palette**:
    - Background: `#1a1a1a` (Stone Dark)
    - Accents: `#d4af37` (Gold)
    - Danger/War: `#4a0404` (Crimson Dark)
- **Typography**: Serif headers (Cinzel/Trajan style if available) + Clean Sans body.

## 5. Implementation Strategy
1. **Initialize Next.js**: Setup the skeleton.
2. **Port Core Logic**: Copy `BOs/services` to `lib`.
3. **Migration**:
    - Move `home` components to `app/page.tsx`.
    - Move `BOs` components to `app/bo-tool/`.
4. **Data Layer**: Implement AOE2.net Data Fetching.
5. **Dashboard**: Build the new Clan Status view.
