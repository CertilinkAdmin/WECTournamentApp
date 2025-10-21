# ABC Tournament Bracket System

A comprehensive tournament management system for the World Espresso Championships, featuring real-time updates, role-based access, and automated bracket generation.

## Project Overview

This is a companion app to worldespressochampionship.app that manages ABC (Aeropress, Barista, Cappuccino) tournament brackets with:
- 5 elimination rounds (32→16→8→4→2→1)
- 3 parallel stations (A, B, C) with staggered timing
- Real-time WebSocket updates
- Role-based access control
- Judge scorecards matching physical forms

## Database Schema

### Core Tables
- **users**: User accounts with roles (ADMIN, JUDGE, BARISTA, STATION_LEAD)
- **tournaments**: Tournament configuration and status
- **tournament_participants**: Barista registrations with seeding
- **tournament_round_times**: Segment time configuration per round
- **stations**: Physical competition stations (A, B, C)
- **matches**: Individual heats/brackets
- **heat_segments**: Timed segments within each heat (DIAL_IN, CAPPUCCINO, ESPRESSO)
- **heat_judges**: Judge assignments to matches
- **heat_scores**: Scoring data from judges

## User Roles

### Admin
- Create and configure tournaments
- Manage competitors and seeds
- Configure segment times per round
- Generate brackets
- Assign judges to heats
- Configure stations

### Station Lead
- View assigned matches at their station
- Start/stop timers for heat segments
- Monitor segment progress
- Signal judges when segments begin/end

### Judge
- View assigned heats
- Submit scores on digital scorecards
- Track segment timing
- View competitor information

### Barista
- View their match schedule
- See upcoming heats
- View results and rankings

## Recent Changes

### Add All Baristas & Power-of-2 Validation (October 21, 2025)
- Implemented "Add All Baristas" button that auto-populates tournament with test baristas
- Button adds up to 16 baristas with sequential seeds (1, 2, 3, ...)
- Only appears when tournament has zero participants for quick setup
- Added power-of-2 validation for bracket generation (requires 8, 16, or 32 participants)
- Generate Bracket button disabled until participant count is valid power-of-2
- Amber warning message displays current count and guidance to reach next power-of-2
- Example: "Current: 12 participants. Need 4 more to reach 16."
- Helper functions `isPowerOfTwo()` and `getNextPowerOfTwo()` ensure valid brackets
- Removed emoji from validation messages per repository guidelines
- Aligned mutation limit (16) with UI messaging for consistency

### Segment Timer Pause/Resume Functionality (October 21, 2025)
- Added pause/resume controls to segment timers in Station Lead View
- Timer can be paused during any segment and resumed from the same position
- Pause state tracked via `pausedSegmentId` in StationLeadView
- SegmentTimer component enhanced with `isPaused` prop and pause time tracking
- Updated Heat Management Guidelines to document pause/resume functionality
- Timer automatically stops when duration completes or can be manually ended
- Button toggles between "Pause" and "Resume" states

### Test Data Population (October 21, 2025)
- Populated database with 12 test baristas for tournament participation
- Added 9 test judges for heat assignments and scoring
- All test users have realistic names and email addresses

### Individual Station Pages with Pagination (October 21, 2025)
- Created dedicated pages for each station accessible at `/station/:stationId`
- Implemented paginated match display (5 matches per page)
- Added backend API route: `GET /api/stations/:id/matches?limit=&offset=`
- Storage method `getStationMatches()` with pagination support
- Each station page displays:
  - Station information and current status
  - Paginated list of matches assigned to that station
  - Competitor details with winner indicators
  - Judge assignments with role badges (HEAD, TECHNICAL, SENSORY)
- Navigation link from Station Lead View to access full station page
- Automatic pagination reset when switching between stations
- Optimized queries to avoid redundant data fetching
- Full authentication support with credentials included in all API calls

### Neon PostgreSQL Database Integration (October 21, 2025)
- Successfully connected to Neon PostgreSQL cloud database
- Added all 13 foreign key constraints for data integrity
- Verified schema alignment with application code
- Application now runs entirely against Neon database
- All API endpoints responding with live data from cloud database

### Station Lead Interface Complete (October 21, 2025)
- Implemented collapsible Heat Management Guidelines section with:
  - Segment sequence explanation (Dial-In → Cappuccino → Espresso)
  - Station Lead responsibilities (5 key duties)
  - Timer control instructions with visual examples
- Added expandable/collapsible UX for better usability
- Integrated rules seamlessly with existing timer and controls

### Segment Time Management (October 21, 2025)
- Added `tournament_round_times` table to store custom segment durations per round
- Implemented storage methods for managing round times
- Created API routes:
  - `GET /api/tournaments/:id/round-times` - Get all round times for a tournament
  - `POST /api/tournaments/:id/round-times` - Set segment times for a specific round
  - `GET /api/matches/:id/segments` - Get segments for a match
  - `PATCH /api/segments/:id` - Update segment status (for Station Leads)
- Updated bracket generator to create heat segments with configured times
- Added SegmentTimeConfig UI component for admins to configure:
  - Dial-in time (default: 10 minutes)
  - Cappuccino segment time (default: 3 minutes)
  - Espresso segment time (default: 2 minutes)
- Integrated segment configuration into Admin setup with new "Segments" tab

### Seed Randomization Fix (October 21, 2025)
- Fixed critical bug where randomized seeds weren't persisted to database
- Separated "Randomize Seeds" and "Generate Bracket" into distinct operations
- Added `updateParticipantSeed` storage method
- Updated frontend to call correct endpoints with proper cache invalidation
- Seeds are now shuffled and saved before bracket generation

### Backend Implementation (October 2025)
- Complete database schema with 8 tables
- RESTful API routes for all entities
- Bracket generation with standard seeding (1v32, 2v31, etc.)
- Staggered station timing (A: +0min, B: +10min, C: +20min)
- WebSocket integration for real-time updates
- PostgreSQL database with Drizzle ORM

## Technical Stack

- **Frontend**: React + TypeScript, Wouter routing, TanStack Query, shadcn/ui
- **Backend**: Express.js, WebSocket (Socket.io)
- **Database**: Neon PostgreSQL (cloud-hosted) with Drizzle ORM
- **Styling**: Tailwind CSS with brown/cream color palette (#8B5A3C primary)
- **Real-time**: Socket.io for live tournament updates
- **Environment**: Replit with secure secret management

## API Endpoints

### Tournaments
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments/:id/randomize-seeds` - Randomize participant seeds
- `POST /api/tournaments/:id/generate-bracket` - Generate bracket with all rounds
- `GET /api/tournaments/:id/participants` - Get participants
- `POST /api/tournaments/:id/participants` - Add participant

### Segment Configuration
- `GET /api/tournaments/:id/round-times` - Get round time configurations
- `POST /api/tournaments/:id/round-times` - Set segment times for a round

### Matches & Segments
- `GET /api/tournaments/:id/matches` - Get all matches
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/:id/segments` - Get heat segments
- `PATCH /api/segments/:id` - Update segment status

### Stations
- `GET /api/stations` - List stations
- `GET /api/stations/:id/matches` - Get paginated matches for a station
- `PATCH /api/stations/:id` - Update station

### Judges & Scoring
- `POST /api/matches/:id/judges` - Assign judge to match
- `POST /api/matches/:id/scores` - Submit score

## Color Palette

Matching World Espresso Championships branding:
- Primary: #8B5A3C (brown)
- Accent: Cream/beige tones
- Background: Clean white with subtle warm tints

### Station Lead View (October 21, 2025)
- Created complete Station Lead interface with:
  - Station selection (A, B, C) with visual indicators
  - Current heat display showing both competitors
  - Sequential segment controls (Dial-In → Cappuccino → Espresso)
  - Animated wave timer with countdown display
  - Start/Stop controls for each segment
  - Automatic segment progression with time-up alerts
- Implemented SegmentTimer component with:
  - Real-time countdown based on actual start time
  - Wave animation effect matching TimerPanel design
  - Color changes for low time warnings (< 60 seconds)
  - Automatic completion callback
- Updated Header component to include Station Lead role selector
- Added WebSocket hook for real-time tournament updates
- Fixed React Query patterns to use correct API endpoint URLs

## Production Status

### Completed Features ✓
- Database schema with all relationships
- Tournament management and bracket generation
- Segment time configuration per round
- Station Lead interface with timer and rules
- Individual station pages with pagination
- Match display with competitors and judges
- Real-time WebSocket foundation
- Neon PostgreSQL cloud database integration

### Next Steps

- Build Judge scorecard interface
- Create Barista schedule view
- Add bracket visualization with drag-and-drop
- Implement real-time score updates via WebSocket
- Add tournament analytics dashboard
- Enhance WebSocket events for segment status changes
- Add backend integration tests for segment transitions
- Seed representative tournament data for testing
