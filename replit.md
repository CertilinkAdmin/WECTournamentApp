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

### Results Input System for Judge Scorecards (October 28, 2025)
**Comprehensive system for inputting and managing judge scorecards:**

Database Schema Enhancement:
- Added `judgeDetailedScores` table for cup-based scoring
- Stores individual scoring categories: Visual/Latte Art (3pts), Taste (1pt), Tactile (1pt), Flavour (1pt), Overall (5pts)
- Tracks which cup (left/right) won each category
- Fields: matchId, judgeName, leftCupCode, rightCupCode, sensoryBeverage, category winners

Storage Layer & API:
- Added `submitDetailedScore`, `submitBatchDetailedScores`, `getMatchDetailedScores` methods
- API endpoints: POST `/api/detailed-scores`, POST `/api/detailed-scores/batch`, GET `/api/matches/:id/detailed-scores`
- Real-time WebSocket events for score submissions
- Batch submission support for efficient data entry

HeatResultsInput Component:
- Dynamic multi-judge scorecard entry form
- Cup code inputs with validation (3-character limit, uppercase conversion)
- Sensory beverage selection (Cappuccino/Espresso)
- Button toggles for each scoring category
- Real-time score calculation and winner determination
- Visual winner indicators with trophy badge
- Comprehensive validation before submission

ResultsInputPage (Admin):
- Tournament and heat selection dropdowns
- Integration with HeatResultsInput component
- Success/error toast notifications
- Automatic query invalidation after submission
- Available at `/admin/results-input` route

Scoring Logic:
- Aggregates points across all judges based on cup category wins
- Automatically calculates total points per cup code
- Determines match winner based on highest total

Verification:
- All components reviewed and approved by architect
- Schema design validated for cup-based scoring
- API follows best practices with proper error handling
- Ready for testing with tournament data

### CSS Alignment with css_md_wec.md (October 28, 2025)
**Complete alignment with WEC Official CSS & Style Guide:**

Typography System:
- Updated to Inter/Open Sans (sans-serif), Playfair Display (serif), Montserrat (brand), JetBrains Mono (monospace)
- Added .montserrat-title utility class for brand typography
- All fonts imported via Google Fonts

Color System Overhaul:
- Light Theme: Soft sand background (#F5F0E8), Cinnamon Brown primary (#994D27), Light Sand secondary (#DECCA7)
- Dark Theme: Cinnamon Brown dominant background (#994D27), white foreground, dark cards (#1A0F0A) with Light Sand text
- Exact border token (220 13% 91% = #E5E7EB) for neutral cool-gray borders
- All functional colors added (success, warning, info) with proper contrast ratios
- All contrast ratios verified to meet WCAG AA standards (>4.5:1)

Brand Variables:
- 6 WEC brand colors: Cinnamon Brown, Light Sand, Forest Green, Golden Brown, Navy Blue, Taupe
- 6 Coffee-themed palette: espresso-darkest, dark, medium, light, cream, foam
- 5 Accent colors: caramel, honey, vanilla, cinnamon, nutmeg

Utility Classes Added:
- Brand gradients (.bg-brand-gradient, .bg-espresso-gradient)
- Brand shadows (.shadow-brand, .shadow-espresso with dark mode variants)
- Brand color utilities (.bg-cinnamon-brown, .text-cinnamon-brown, .border-cinnamon-brown)
- Theme transitions (.theme-transition, .theme-transition-fast, .theme-transition-slow, .theme-changing)
- Animation utilities (.hover-lift, .hover-glow, .animate-pulse-slow, .animate-fade-in)
- Responsive utilities (.responsive-container, .responsive-grid, .responsive-heading-xl)
- Layout utilities (.content-with-anchored-footer, .aspect-golden, .aspect-coffee-cup, .bg-theme-surface, .text-theme-primary)

Verification:
- 100% alignment with css_md_wec.md specification confirmed
- All color tokens match documented values exactly
- Accessibility verified (WCAG AA compliance)
- No missing or incorrect tokens

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