# ABC Tournament Bracket System - Design Guidelines

## Design Approach: Brand-Aligned Utility System

**Selected Approach**: Custom branded design system aligned with World Espresso Championships identity, prioritizing real-time clarity and professional tournament presentation.

**Core Principle**: Professional coffee competition aesthetic meets functional tournament management - sophisticated, focused, and brand-consistent.

---

## Color Palette

### Brand Colors (Light & Dark Mode)
**Primary Brown**: 25 45% 40% (main brand color #8B5A3C)
**Cream/Tan**: 40 35% 85% (accent backgrounds)
**Dark Brown**: 25 35% 25% (headers, emphasis)
**Light Cream**: 40 25% 95% (card backgrounds)

### Functional Colors
**Success Green**: 142 50% 45% (winners, completed)
**Warning Amber**: 38 90% 50% (active/in-progress)
**Error Red**: 0 70% 50% (eliminated, errors)
**Neutral Gray**: 0 0% 50% (secondary text)

### Dark Mode Adjustments
**Background**: 25 15% 12% (dark brown base)
**Cards**: 25 12% 18% (elevated surfaces)
**Text**: 40 10% 95% (high contrast)

---

## Typography

**Font Stack**: 
- Primary: 'Inter', system-ui, sans-serif (clean, professional)
- Headings: 'Montserrat', sans-serif (strong hierarchy)
- Numbers/Scores: 'JetBrains Mono', monospace (scoreboard clarity)

**Scale**:
- Hero/Tournament Title: text-5xl font-bold (48px)
- Section Headers: text-3xl font-semibold (30px)
- Card Titles: text-xl font-medium (20px)
- Body Text: text-base (16px)
- Labels/Metadata: text-sm (14px)
- Scores: text-4xl font-mono font-bold (36px)

---

## Layout System

**Spacing Units**: Use Tailwind spacing of 2, 4, 6, 8, 12, 16, 20, 24 consistently
- Component padding: p-6 or p-8
- Section spacing: space-y-8 or space-y-12
- Card gaps: gap-4 or gap-6

**Grid System**:
- Bracket view: Custom grid matching round structure
- Admin dashboard: 3-column grid (lg:grid-cols-3)
- Judge scorecard: Single column with sections
- Mobile: Always stack to single column

**Container Widths**:
- Full bracket: max-w-7xl
- Scorecard forms: max-w-3xl
- Admin panels: max-w-6xl

---

## Component Library

### Navigation
**Admin Top Bar**: Fixed header with brown gradient background, World Espresso Championships logo left, role indicator and user menu right
**Role Switcher**: Dropdown showing current role (Admin/Judge/Barista) with icon indicators

### Bracket Visualization
**Heat Boxes**: Cream cards with brown borders, showing competitor names, scores, station assignment
**Connector Lines**: Brown lines showing tournament progression path
**Round Labels**: Dark brown badges with round numbers and heat counts
**Winner Highlighting**: Success green border and subtle background tint

### Judge Scorecard
**Section Cards**: White/cream cards with brown headers for "Latte Art" and "Sensory Evaluation"
**Score Inputs**: Large number inputs (text-2xl) with +/- buttons, max values displayed
**Competitor Split**: Left/Right column layout with competitor names in brown headers
**Subtotal Display**: Bold monospace numbers with automatic calculation
**Submit Button**: Large primary brown button with loading state

### Station Dashboard
**Station Cards**: Color-coded cards (A/B/C) showing current heat, segment timers, queue
**Segment Indicators**: Horizontal progress bar showing Dial-In → Brew → Serve with active state highlighting
**Timer Display**: Large countdown in monospace font with warning states (red when < 1 min)
**Queue List**: Compact list showing upcoming heats with station assignments

### Competition Rules Panel
**Collapsible Sections**: Accordion-style rules display with brown headers
**Rule Cards**: Clean white cards with bullet points and equipment requirements
**Equipment Icons**: Small brown icons next to equipment list items

### Data Tables
**Competitor Lists**: Sortable tables with seed numbers, names, status
**Match History**: Timeline view with brown accent lines and status badges
**Judge Assignments**: Grid showing judge names, roles, heat assignments

### Forms & Inputs
**Text Inputs**: Brown border on focus, cream background, clear labels
**Dropdowns**: Custom styled with brown accents matching brand
**Radio/Checkboxes**: Brown checked state, cream backgrounds
**Date/Time Pickers**: Brown accent colors for selected dates

### Status Indicators
**Badges**: Rounded pills with role-specific colors
  - Admin: Dark brown
  - Judge: Amber
  - Barista: Cream with brown text
  - Status: Green (active), Gray (pending), Red (eliminated)

### Modals & Overlays
**Tournament Setup Modal**: Large modal with multi-step form for creating tournaments
**Confirm Dialogs**: Centered overlay with brown accent buttons
**Loading States**: Brown spinning loader with "Processing..." text

---

## Mobile Optimization

**Responsive Breakpoints**:
- Mobile: Single column, stacked components
- Tablet: 2-column where appropriate (scorecard sections side-by-side)
- Desktop: Full grid layouts

**Touch Targets**: Minimum 48px for all interactive elements (especially scorecard inputs)
**Judge Scorecard Mobile**: Full-screen modal with sticky header, large touch-friendly score buttons

---

## Real-time Updates

**Visual Feedback**:
- New score submissions: Subtle green pulse animation
- Bracket progression: Smooth line drawing animation (500ms)
- Timer updates: No animation, instant number updates
- Winner announcements: Confetti effect (very brief, 2s max)

**Loading States**: Brown spinner for data fetching, skeleton screens for bracket

---

## Images

**Logo Placement**: World Espresso Championships logo in top-left of all role interfaces (120px width)
**No Hero Image**: This is a utility app - go straight to functional dashboard
**Competitor Avatars**: Optional circular avatars (48px) next to competitor names in bracket
**Background Texture**: Subtle coffee bean pattern at 5% opacity on cream backgrounds (optional enhancement)

---

## Accessibility

**Contrast**: All text meets WCAG AA standards against backgrounds
**Focus States**: Clear brown outline (ring-2 ring-primary) on all interactive elements
**Screen Readers**: Proper ARIA labels for bracket progression, score changes, timer updates
**Keyboard Navigation**: Full keyboard support for all forms and bracket navigation

---

## Brand Integration

**Consistent Headers**: Every page shows "World Espresso Championships - ABC Tournament" with logo
**Footer**: Simple footer with tournament name, current round, and sponsor logos (if applicable)
**Color Discipline**: Strict adherence to brown/cream palette - no extraneous colors except functional status indicators