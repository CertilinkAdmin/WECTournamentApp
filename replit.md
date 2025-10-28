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
The design strictly adheres to the WEC Official Brand Guidelines.
- **Typography**: Uses Lexend font family throughout the application.
- **Color Palette**:
    - Primary: Cinnamon Brown (`#994D27`)
    - Accent: Light Sand (`#DECCA7`)
    - Secondary: Golden (`#C48D49`), Light Brown (`#BDA088`), Dark Olive (`#3E3F24`), Deep Blue (`#214966`)
- All UI components, including tournament brackets, dialogs, icons, badges, and text, consistently use WEC brand tokens.
- Dual-mode `TrueTournamentBracket` component supports 'live' and 'results' views, with visual indicators for active or historical tournaments.
- Compact tournament bracket view with click-to-expand detailed heat dialogs.
- Mobile optimization utilities for touch-friendly interfaces and responsive design, including safe area support and landscape orientation optimizations.

### Technical Implementations
- **Core Tables**: `users`, `tournaments`, `tournament_participants`, `tournament_round_times`, `stations`, `matches`, `heat_segments`, `heat_judges`, `heat_scores`.
- **User Roles**: Admin, Station Lead, Judge, Barista, each with specific functionalities and access control.
- **Bracket Generation**: Supports 5 elimination rounds (32→16→8→4→2→1) with standard seeding. Includes power-of-2 validation for participant counts.
- **Segment Timing**: Configurable segment durations (Dial-In, Cappuccino, Espresso) per round, managed by Admins.
- **Station Lead Interface**: Provides controls for starting/stopping segments, monitoring progress, and pause/resume functionality for timers.
- **Real-time Updates**: WebSocket integration for live tournament data, segment status changes, and score updates.
- **API**: RESTful API endpoints for all entities and operations, including tournament management, participant handling, segment configuration, match details, station management, and scoring.
- **Styling**: Tailwind CSS is used for styling, strictly following the WEC brand guidelines.
- **Environment**: Hosted on Replit with secure secret management.

### Feature Specifications
- **Admin**: Tournament creation, competitor and seed management, segment time configuration, bracket generation, judge assignment, station configuration.
- **Station Lead**: View assigned matches, start/stop/pause/resume segment timers, monitor segment progress.
- **Judge**: View assigned heats, submit scores via digital scorecards, track segment timing.
- **Barista**: View match schedules, upcoming heats, results, and rankings.
- **Live vs. Results Bracket**: Displays real-time active tournament data or historical results.
- **Individual Station Pages**: Dedicated pages for each station with paginated match displays.

## External Dependencies

- **Frontend**: React, TypeScript, Wouter (routing), TanStack Query, shadcn/ui.
- **Backend**: Express.js.
- **Database**: Neon PostgreSQL (cloud-hosted) with Drizzle ORM.
- **Real-time Communication**: Socket.io.

## Recent Changes

### Mobile Optimization (October 28, 2025)
**Complete mobile-first responsive design implementation:**

Tournament Bracket Component:
- Responsive typography with Tailwind breakpoints (text-2xl sm:text-3xl md:text-4xl)
- Touch-friendly tap targets with 44x44px minimum size
- Horizontal scrolling with smooth momentum scrolling on mobile
- Mobile-optimized spacing and padding (px-2 sm:px-4 md:px-6)
- Truncated text with proper overflow handling for long names
- Flexible icon sizing for different screen sizes
- Changed "Click" to "Tap" for better mobile UX

Heat Detail Dialog:
- Responsive sizing (w-[95vw] on mobile, full width on desktop)
- Maximum height with vertical scrolling (max-h-[90vh])
- Responsive padding and spacing throughout
- Scalable typography for all text elements
- Better gap management with responsive values
- Text truncation for competitor names
- Mobile-friendly score displays

CSS Enhancements:
- Mobile breakpoints at 768px and 480px
- Touch feedback with webkit-tap-highlight styling
- Active state scaling for visual feedback (scale 0.98)
- Touch action manipulation for better scroll performance
- Responsive font sizes and padding adjustments
- Minimum width constraints for bracket columns

Mobile Utilities:
- iOS safe area support for notched devices (env() padding)
- Touch-target utility class (44x44px minimum)
- Smooth scrolling behavior with momentum
- Touch feedback animations
- Hide scrollbar utility while maintaining functionality
- Better tap highlight colors

Verification:
- All touch targets meet 44px minimum guideline
- Horizontal scrolling works smoothly on mobile
- Dialog properly sized for small screens
- Safe area support functional on iOS devices
- No layout shifts or overflow issues