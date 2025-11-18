# Schema Refactoring Review

## 🔴 CRITICAL ISSUES - Schema Mismatch

The `shared/schema.ts` file **does NOT match** the migration SQL that was executed. The schema file still contains old table structures that conflict with the database.

---

## 📋 Schema Issues (`shared/schema.ts`)

### 1. **PERSONS Table** ❌
**Current (WRONG):**
```typescript
export const persons = pgTable("persons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('BARISTA'),  // ❌ Should NOT have role
  approved: boolean("approved").notNull().default(false),   // ❌ Should NOT have approved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Should be:**
```typescript
export const persons = pgTable("persons", {
  id: serial("id").primaryKey(),
  externalProfileId: text("external_profile_id").unique(),  // ✅ Missing
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),                                       // ✅ Missing
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // ✅ Missing
});
```

**Issues:**
- ❌ Has `role` field (roles belong in `tournament_registrations`)
- ❌ Has `approved` field (verification belongs in `tournament_registrations`)
- ❌ Missing `externalProfileId` (for parent app reference)
- ❌ Missing `phone` field
- ❌ Missing `updatedAt` field

---

### 2. **TOURNAMENTS Table** ⚠️
**Current:**
```typescript
export const tournaments = pgTable("tournaments", {
  id: text("id").primaryKey(),  // ✅ Correct
  name: text("name").notNull(),
  location: text("location"),   // ⚠️ Should be NOT NULL
  status: tournamentStatusEnum("status").notNull().default('SETUP'),
  // ... missing year field
});
```

**Should be:**
```typescript
export const tournaments = pgTable("tournaments", {
  id: text("id").primaryKey(),  // ✅ Correct (composite: location+year)
  name: text("name").notNull(),
  location: text("location").notNull(),  // ✅ Should be NOT NULL
  year: integer("year").notNull(),      // ✅ Missing
  status: tournamentStatusEnum("status").notNull().default('SETUP'),
  // ...
});
```

**Issues:**
- ⚠️ `location` should be `notNull()`
- ❌ Missing `year` field

---

### 3. **TOURNAMENT_REGISTRATIONS Table** ❌ MISSING
**Current:** Still has old `tournamentParticipants` table

**Should have:**
```typescript
export const tournamentRegistrations = pgTable("tournament_registrations", {
  id: serial("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),
  personId: integer("person_id").notNull().references(() => persons.id),
  role: personRoleEnum("role").notNull(),  // JUDGE, BARISTA, VOLUNTEER, PARTNER
  verificationStatus: verificationStatusEnum("verification_status").notNull().default('UNVERIFIED'),
  seed: integer("seed"),
  eliminatedRound: integer("eliminated_round"),
  finalRank: integer("final_rank"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => persons.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Issues:**
- ❌ Old `tournamentParticipants` table still exists
- ❌ Missing `tournamentRegistrations` table definition
- ❌ Missing `personRoleEnum` enum
- ❌ Missing `verificationStatusEnum` enum

---

### 4. **STATIONS Table** ❌
**Current:**
```typescript
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),  // ❌ Should be removed
  status: stationStatusEnum("status").notNull().default('AVAILABLE'),
  nextAvailableAt: timestamp("next_available_at").defaultNow().notNull(),
  currentMatchId: integer("current_match_id"),
});
```

**Should be:**
```typescript
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),  // ✅ Missing
  name: text("name").notNull(),
  status: stationStatusEnum("status").notNull().default('AVAILABLE'),
  nextAvailableAt: timestamp("next_available_at").defaultNow().notNull(),
  currentMatchId: integer("current_match_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),  // ✅ Missing
  updatedAt: timestamp("updated_at").defaultNow().notNull(),    // ✅ Missing
});
```

**Issues:**
- ❌ Missing `tournamentId` field (stations are tournament-specific)
- ❌ Has `location` field (should be removed)
- ❌ Missing `createdAt` and `updatedAt` fields

---

### 5. **MATCHES Table** ❌
**Current:**
```typescript
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),  // ❌ Should be text
  // ...
  competitor1Id: integer("competitor1_id").references(() => users.id),  // ❌ Wrong reference
  competitor2Id: integer("competitor2_id").references(() => users.id),  // ❌ Wrong reference
  winnerId: integer("winner_id").references(() => users.id),            // ❌ Wrong reference
});
```

**Should be:**
```typescript
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),  // ✅ text, not integer
  // ...
  competitor1RegistrationId: integer("competitor1_registration_id").references(() => tournamentRegistrations.id),  // ✅
  competitor2RegistrationId: integer("competitor2_registration_id").references(() => tournamentRegistrations.id),  // ✅
  winnerRegistrationId: integer("winner_registration_id").references(() => tournamentRegistrations.id),            // ✅
});
```

**Issues:**
- ❌ `tournamentId` is `integer` (should be `text`)
- ❌ References `users.id` (should reference `tournamentRegistrations.id`)
- ❌ Field names are wrong (`competitor1Id` → `competitor1RegistrationId`)

---

### 6. **HEAT_JUDGES Table** ❌
**Current:**
```typescript
export const heatJudges = pgTable("heat_judges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull().references(() => users.id),  // ❌ Wrong reference
  role: judgeRoleEnum("role").notNull(),
});
```

**Should be:**
```typescript
export const heatJudges = pgTable("heat_judges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeRegistrationId: integer("judge_registration_id").notNull().references(() => tournamentRegistrations.id),  // ✅
  role: judgeRoleEnum("role").notNull(),
});
```

**Issues:**
- ❌ References `users.id` (should reference `tournamentRegistrations.id`)
- ❌ Field name is wrong (`judgeId` → `judgeRegistrationId`)

---

### 7. **HEAT_SCORES Table** ❌
**Current:**
```typescript
export const heatScores = pgTable("heat_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull().references(() => users.id),      // ❌ Wrong reference
  competitorId: integer("competitor_id").notNull().references(() => users.id),  // ❌ Wrong reference
  // ...
});
```

**Should be:**
```typescript
export const heatScores = pgTable("heat_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeRegistrationId: integer("judge_registration_id").notNull().references(() => tournamentRegistrations.id),  // ✅
  competitorRegistrationId: integer("competitor_registration_id").notNull().references(() => tournamentRegistrations.id),  // ✅
  // ...
});
```

**Issues:**
- ❌ References `users.id` (should reference `tournamentRegistrations.id`)
- ❌ Field names are wrong (`judgeId` → `judgeRegistrationId`, `competitorId` → `competitorRegistrationId`)

---

### 8. **TOURNAMENT_ROUND_TIMES Table** ❌
**Current:**
```typescript
export const tournamentRoundTimes = pgTable("tournament_round_times", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),  // ❌ Should be text
  // ...
});
```

**Should be:**
```typescript
export const tournamentRoundTimes = pgTable("tournament_round_times", {
  id: serial("id").primaryKey(),
  tournamentId: text("tournament_id").notNull().references(() => tournaments.id),  // ✅ text, not integer
  // ...
});
```

**Issues:**
- ❌ `tournamentId` is `integer` (should be `text`)

---

## 📋 Code Issues

### 1. **Storage Layer (`server/storage.ts`)**

**Issues:**
- ❌ Still has `getUser()`, `createUser()`, `getAllUsers()`, `updateUser()` methods
- ❌ Should have `getPerson()`, `createPerson()`, `getAllPersons()`, `updatePerson()` instead
- ❌ Still has `addParticipant()`, `getTournamentParticipants()` methods
- ❌ Should have `addRegistration()`, `getTournamentRegistrations()` instead
- ❌ Tournament ID methods still use `number` instead of `string`
- ❌ Methods still reference old `users` and `tournamentParticipants` tables

**Methods that need updating:**
- `getTournament(id: number)` → `getTournament(id: string)`
- `updateTournament(id: number, ...)` → `updateTournament(id: string, ...)`
- `getTournamentParticipants(tournamentId: number)` → `getTournamentRegistrations(tournamentId: string)`
- `getTournamentMatches(tournamentId: number)` → `getTournamentMatches(tournamentId: string)`
- `getRoundTimes(tournamentId: number, ...)` → `getRoundTimes(tournamentId: string, ...)`
- `clearTournamentData(tournamentId: number)` → `clearTournamentData(tournamentId: string)`

---

### 2. **Routes (`server/routes.ts`)**

**Issues:**
- ❌ `/api/users` routes still use `insertUserSchema` and `storage.createUser()`
- ❌ Should use `insertPersonSchema` and `storage.createPerson()`
- ❌ Tournament routes parse `tournamentId` as `parseInt()` (should be string)
- ❌ Still references `tournamentParticipants` table
- ❌ Still references `users` table for competitor/judge lookups
- ❌ WebSocket `join:tournament` expects `number` (should be `string`)

**Routes that need updating:**
- `POST /api/users` → `POST /api/persons`
- `GET /api/users` → `GET /api/persons`
- `PATCH /api/users` → `PATCH /api/persons`
- `GET /api/tournaments/:id` - parse as string, not integer
- `PATCH /api/tournaments/:id` - parse as string, not integer
- All routes that reference `tournamentParticipants` → `tournamentRegistrations`

---

### 3. **Frontend Components**

**Files that need updates:**
- `client/src/components/UserManagement.tsx` - Update to use persons API
- `client/src/components/BaristaUpload.tsx` - Update to use registrations
- `client/src/pages/admin/AdminTournaments.tsx` - Update tournament ID handling
- `client/src/pages/admin/ManageBaristas.tsx` - Update to use registrations
- `client/src/pages/admin/ManageJudges.tsx` - Update to use registrations
- `client/src/components/TournamentBracket.tsx` - Update competitor references
- `client/src/pages/live/TournamentList.tsx` - Update registration flow
- All components that use `userId` → should use `registrationId` or `personId`

---

### 4. **Bracket Generator (`server/bracketGenerator.ts`)**

**Issues:**
- ❌ Likely references `users` or `tournamentParticipants`
- ❌ Should reference `tournamentRegistrations` with verified baristas
- ❌ Tournament ID handling may be wrong type

---

### 5. **Migration Scripts**

**Files that need updates:**
- `server/migrations/wec2025-data.ts` - Update to use new schema
- `server/migrations/wec2025-simple.ts` - Update to use new schema
- `server/migrations/wec2025-upsert.ts` - Update to use new schema

---

## ✅ Summary of Required Changes

### Schema (`shared/schema.ts`)
1. ✅ Fix `persons` table (remove role/approved, add externalProfileId/phone/updatedAt)
2. ✅ Add `personRoleEnum` enum
3. ✅ Add `verificationStatusEnum` enum
4. ✅ Fix `tournaments` table (add year, make location NOT NULL)
5. ✅ Remove `tournamentParticipants` table
6. ✅ Add `tournamentRegistrations` table
7. ✅ Fix `stations` table (add tournamentId, remove location, add timestamps)
8. ✅ Fix `matches` table (tournamentId → text, competitor fields → registrationId)
9. ✅ Fix `heatJudges` table (judgeId → judgeRegistrationId)
10. ✅ Fix `heatScores` table (judgeId/competitorId → registrationId)
11. ✅ Fix `tournamentRoundTimes` table (tournamentId → text)

### Storage Layer (`server/storage.ts`)
1. ✅ Rename User methods → Person methods
2. ✅ Rename Participant methods → Registration methods
3. ✅ Update all tournament ID types: `number` → `string`
4. ✅ Update all queries to use new table/field names

### Routes (`server/routes.ts`)
1. ✅ Update `/api/users` → `/api/persons`
2. ✅ Update tournament ID parsing (string, not integer)
3. ✅ Update all references to use new schema
4. ✅ Update WebSocket tournament ID type

### Frontend
1. ✅ Update all API calls from `/api/users` → `/api/persons`
2. ✅ Update tournament ID handling (string, not number)
3. ✅ Update all components to use `registrationId` instead of `userId`
4. ✅ Update registration/verification flows

---

## 🎯 Priority Order

1. **CRITICAL:** Fix `shared/schema.ts` to match migration SQL
2. **CRITICAL:** Update `server/storage.ts` to use new schema
3. **HIGH:** Update `server/routes.ts` to use new storage methods
4. **MEDIUM:** Update frontend components
5. **LOW:** Update migration scripts

---

## 📝 Notes

- The database migration was successful, but the TypeScript schema doesn't match
- This will cause runtime errors when code tries to use the old schema structure
- Need to update schema first, then storage, then routes, then frontend
- Tournament IDs are now strings (e.g., "WEC2025"), not integers
- All user references should become person references
- All participant references should become registration references

