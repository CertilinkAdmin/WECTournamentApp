# ABC Tournament Bracket System

## Overview
This project is a comprehensive tournament management system designed for the World Espresso Championships (WEC). It serves as a companion application to worldespressochampionship.app, managing Aeropress, Barista, and Cappuccino (ABC) tournament brackets. Key features include 5 elimination rounds, 3 parallel stations with staggered timing, real-time WebSocket updates, role-based access control, and digital judge scorecards that match physical forms. The system aims to streamline tournament operations, provide real-time information to all stakeholders, and maintain brand consistency with WEC guidelines.

## User Preferences
- I prefer simple language.
- I like functional programming.
- I want iterative development.
- Ask before making major changes.
- I prefer detailed explanations.
- Do not make changes to the folder `Z`.
- Do not make changes to the file `Y`.

## System Architecture
The system is built with a clear separation between frontend and backend.

### UI/UX Decisions
The design strictly adheres to the WEC Official Brand Guidelines, utilizing the Lexend font family and a specific color palette (Primary: Cinnamon Brown `#994D27`, Accent: Light Sand `#DECCA7`, Secondary: Golden `#C48D49`, Light Brown `#BDA088`, Dark Olive `#3E3F24`, Deep Blue `#214966`). All UI components consistently use WEC brand tokens. The `TrueTournamentBracket` component supports 'live' and 'results' views with visual indicators. A compact bracket view allows click-to-expand detailed heat dialogs with judge information displayed when available, and a "No judge scorecards available for this heat" message shown for bye matches. Mobile optimization includes touch-friendly interfaces, responsive design, safe area support, and landscape orientation optimizations. The landing page features a single centered circle with WEC branding and a clock. A dynamic, context-aware bottom navigation system adapts to the current route. Mobile navigation is managed via a hamburger menu and a right-side slide-in drawer. A `SensoryEvaluationCard` component displays sensory evaluation for all heats, matching physical scorecard layouts. All scorecards are always presented, even for bye matches, ensuring consistent UX across all heat types.

### Technical Implementations
Core tables include `users`, `tournaments`, `tournament_participants`, `tournament_round_times`, `stations`, `matches`, `heat_segments`, `heat_judges`, and `heat_scores`. User roles include Admin, Station Lead, Judge, and Barista, each with specific access control. The system supports 5 elimination rounds (32→16→8→4→2→1) with standard seeding and power-of-2 validation for participant counts. Segment timings are configurable per round. A Station Lead interface provides controls for segment management. Real-time updates are handled via WebSocket integration. A RESTful API provides endpoints for all entities and operations. Styling is managed with Tailwind CSS, adhering to WEC brand guidelines. The environment is hosted on Replit with secure secret management. A `judgeDetailedScores` table stores cup-based scoring, including individual categories and cup winners. An admin results input system allows dynamic multi-judge scorecard entry with real-time score calculation and winner determination.

### Feature Specifications
- **Admin**: Tournament creation, competitor/seed management, segment time configuration, bracket generation, judge assignment, station configuration, and results input.
- **Station Lead**: View assigned matches, start/stop/pause/resume segment timers, monitor segment progress.
- **Judge**: View assigned heats, submit scores via digital scorecards, track segment timing.
- **Barista**: View match schedules, upcoming heats, results, and rankings.
- **Live vs. Results Bracket**: Displays real-time active tournament data or historical results.
- **Individual Station Pages**: Dedicated pages for each station with paginated match displays.

## External Dependencies

- **Frontend**: React, TypeScript, Wouter (routing), TanStack Query, shadcn/ui.
- **Backend**: Express.js.
- **Database**: Neon PostgreSQL with Drizzle ORM.
- **Real-time Communication**: Socket.io.