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
The design strictly adheres to the WEC Official Brand Guidelines, utilizing the Lexend font family and a specific color palette (Primary: Cinnamon Brown `#994D27`, Accent: Light Sand `#DECCA7`, Secondary: Golden `#C48D49`, Light Brown `#BDA088`, Dark Olive `#3E3F24`, Deep Blue `#214966`). All UI components consistently use WEC brand tokens. The `TrueTournamentBracket` component supports 'live' and 'results' views with visual indicators. A compact bracket view allows click-to-expand detailed heat dialogs with judge information displayed when available, and a "No judge scorecards available for this heat" message shown for bye matches. Mobile optimization includes touch-friendly interfaces, responsive design, safe area support, and landscape orientation optimizations. **The landing page features a custom PhotoCarousel component** displaying WEC championship photos in an auto-playing slideshow with smooth fade transitions, Ken Burns zoom effect, navigation controls (previous/next arrows and dot indicators), and a dark overlay gradient ensuring text readability. The carousel configuration is centralized in `client/src/config/photoAlbum.ts` for easy image URL management, supporting both OneDrive direct links and locally hosted images. Mobile-optimized controls include smaller navigation buttons and responsive layouts. The WEC logo is overlaid at 30% opacity with "ESPRESSO TOURNAMENT HOST" text prominently displayed. The heat navigation display uses a horizontal rectangle card with integrated Previous/Next buttons inside the card border, centered heat information, and WEC brand styling. A dynamic, context-aware bottom navigation system adapts to the current route, with bottom placement optimized for tablet thumb access. Mobile navigation is managed via a hamburger menu and a right-side slide-in drawer. A `SensoryEvaluationCard` component displays sensory evaluation for all heats, matching physical scorecard layouts with stable desktop table layout and mobile card-based display. A new `CompetitorScorecard` component provides individual competitor scoring breakdowns showing judge-by-judge detailed scores (Visual/Latte Art 3pts, Taste 1pt, Tactile 1pt, Flavour 1pt, Overall 5pts) with total score calculation. All scorecards are always presented, even for bye matches, ensuring consistent UX across all heat types. The **WEC2025Results page** (`/results`) is tablet-optimized with champion section and header card removed, displaying heats in a 3-stack carousel format. Heats are sorted in numerical order and displayed 3 at a time with Previous/Next navigation controls, maximizing vertical space utilization. The carousel shows current segment information (e.g., "Heats 1-3 of 7, Segment 1 of 3") and adapts to the total number of heats available.

### Technical Implementations
Core tables include `users`, `tournaments`, `tournament_participants`, `tournament_round_times`, `stations`, `matches`, `heat_segments`, `heat_judges`, `heat_scores`, and `judgeDetailedScores`. User roles include Admin, Station Lead, Judge, and Barista, each with specific access control. The system supports 5 elimination rounds (32→16→8→4→2→1) with standard seeding and power-of-2 validation for participant counts. Segment timings are configurable per round. A Station Lead interface provides controls for segment management. Real-time updates are handled via WebSocket integration. A RESTful API provides endpoints for all entities and operations. Styling is managed with Tailwind CSS, adhering to WEC brand guidelines. The environment is hosted on Replit with secure secret management. A `judgeDetailedScores` table stores cup-based scoring, including individual categories and cup winners. An admin results input system allows dynamic multi-judge scorecard entry with real-time score calculation and winner determination. **Bye Matches** automatically receive 33 points (3 judges × 11 points per judge) with both detailed scores (for sensory evaluation display) and aggregate scores (for total calculation) created by system judges (judge.1@system.bye, judge.2@system.bye, judge.3@system.bye). Heat detail dialogs display both the overview SensoryEvaluationCard and individual CompetitorScorecard components showing complete judge-by-judge breakdowns for each competitor.

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