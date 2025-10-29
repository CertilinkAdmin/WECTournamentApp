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

### Dynamic Bottom Navigation System (October 29, 2025)
**Implemented context-aware bottom navigation that changes based on current route:**

Dynamic Navigation Implementation:
- Created `BottomNav` component with route-based button sets
- **Landing Page (`/`)**: Admin, Live, Results (main 3 routes)
- **Results Section (`/results/*`)**: Bracket, Standings, Champion, Scores
- **Live Section (`/live/*`)**: Bracket, Heats, Board, Stations  
- **Admin Section (`/admin/*`)**: Dashboard, Tourneys, Athletes, Judges
- Active route highlighting with background color change
- Mobile-only display (md:hidden breakpoint)
- Uses WEC brand colors (cinnamon-brown/95, light-sand/20)
- Proper z-index (50) for layering above content
- Safe area support for iOS notched devices
- Touch-friendly design with distinct icons per section

Horizontal Scroll Prevention:
- Added `overflow-x: hidden` to html, body, #root, .App
- Set `max-width: 100vw` on root elements
- Added `max-width: 100%` to all elements globally
- Mobile body padding-bottom (4rem + safe-area-inset-bottom)
- Hidden horizontal scrollbar in sidebar navigation (scrollbar-width: none)
- Smooth touch scrolling (-webkit-overflow-scrolling: touch)

Safe Area Utilities:
- `.safe-area-bottom` for iOS notch padding
- `.px-safe` for safe horizontal padding with device insets
- Proper spacing for bottom navigation on devices with home indicators

Verification:
- All changes architect reviewed and approved
- No horizontal scrollbar on any page
- E2E tests passed for all navigation routes
- Active route detection working correctly for all sections
- Button sets successfully switch based on current route
- Smooth scrolling on mobile devices
- Touch targets meet accessibility standards

### Mobile Navigation & Sensory Evaluation Display (October 29, 2025)
**Enhanced mobile UX with hamburger menu and always-visible sensory evaluation:**

Mobile Navigation Improvements:
- Created `MobileMenu` component with hamburger icon (Lucide Menu/X)
- Replaced fixed mobile nav bar that caused horizontal scroll
- Right-side slide-in drawer with smooth transitions
- Backdrop overlay when menu is open
- Auto-closes on link click or overlay tap
- Mobile-only display (md:hidden breakpoint)
- Uses WEC brand colors (cinnamon-brown, light-sand)
- Proper z-index layering (150 button, 145 drawer, 140 overlay)

Sensory Evaluation Card:
- Created `SensoryEvaluationCard` component matching physical scorecard layout
- Displays SENSORY EVALUATION section for ALL heats (including byes/null data)
- Mobile-responsive with vertical stacking on small screens
- Shows 3 judges with LEFT/RIGHT columns for each
- Categories: Taste (1pt), Tactile (1pt), Flavour (1pt), Overall (5pts)
- Handles null/empty data by showing placeholder judges with "—"
- Calculates and displays sensory subtotals per judge
- Shows total scores for left/right competitors at bottom
- Responsive typography (text-xs sm:text-sm) and padding (p-2 sm:p-3)

HeatJudgesDisplay Updates:
- Removed "No judge scorecards available" message
- Sensory evaluation now ALWAYS displays for every heat
- Removed expand/collapse behavior for judges section
- Simplified component by directly showing SensoryEvaluationCard

Verification:
- Architect approved all mobile navigation changes
- No horizontal scroll on landing page
- Drawer animations smooth with proper close handlers
- Null data handling verified with placeholder judges
- Mobile responsiveness meets WEC standards

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