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
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with brown/cream color palette (#8B5A3C primary)
- **Real-time**: Socket.io for live tournament updates

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
- `PATCH /api/stations/:id` - Update station

### Judges & Scoring
- `POST /api/matches/:id/judges` - Assign judge to match
- `POST /api/matches/:id/scores` - Submit score

## Color Palette

Matching World Espresso Championships branding:
- Primary: #8B5A3C (brown)
- Accent: Cream/beige tones
- Background: Clean white with subtle warm tints

## Next Steps

- Implement Station Lead view with timer controls
- Build Judge scorecard interface
- Create Barista schedule view
- Add bracket visualization with drag-and-drop
- Implement real-time score updates
- Add tournament analytics dashboard
