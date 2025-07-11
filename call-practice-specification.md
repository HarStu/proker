# Call Practice Situation Generator Specification

## Overview
Generate poker situations for call practice training. Focus on "outs to improve" - cards that make your hand better.

**Core Elements:**
- Hole cards (2 cards)
- Board (flop or turn)
- Pot size and call amount
- Count outs to improve (including secondary outs)
- Make call/fold decision

## Core Situation Components

### 1. Board State
**Street Selection:**
- 70% Flop (3 cards)
- 30% Turn (4 cards)

**Board Requirements:**
- Must create drawing opportunities
- Avoid overly coordinated or dry boards

### 2. Hole Cards
**Requirements:**
- Must be involved in draws
- Focus on drawing hands, not made hands
- **Maximum starting hand: Pair** - player will never start with better than a pair
- Examples: suited connectors, suited broadway, connected cards, low pairs

### 3. Drawing Situations
**Draw Types:**
1. **Flush Draws** (35%) - 4 cards to flush, 9 outs
2. **Straight Draws** (30%) - open-ended (8 outs) or gutshot (4 outs)
3. **Full House Draws** (20%) - trips with kicker (3 outs) or two pair (2 outs)
4. **Two Pair Draws** (10%) - pair with overcard (3 outs)
5. **Three of a Kind Draws** (5%) - pair with overcard (2 outs)

**Outs Definition:**
- Record each specific card that improves your hand
- Track both primary and secondary outs separately:
  - Primary: Main draw outs (e.g., flush draw cards)
  - Secondary: Additional improvement cards (e.g., overcards, trips, four of a kind)
- **Secondary outs include:**
  - Overcard outs: Cards that make a higher pair
  - Trips outs: Remaining cards matching existing pair (when starting with pair)
  - Four of a kind outs: When already holding trips
- Example: Qh Jh on 5h 8h Js
  - Primary (9 flush outs): 2h,3h,4h,6h,7h,9h,10h,Ah,Kh
  - Secondary overcard (2 outs): Qc,Qd
  - Secondary trips (2 outs): Jc,Jd
  - Total: 13 specific outs tracked

**Outs Range:**
- Minimum: 2 outs
- Maximum: 15 outs (adjusted to accommodate all improvement types)
- Scenarios exceeding 12 outs should be generated less frequently to maintain balance

### 4. Pot and Call Amounts
**Pot Sizes:**
- Small: $50-$300 (30%)
- Medium: $300-$1,000 (40%)
- Large: $1,000-$3,000 (20%)
- Huge: $3,000-$10,000 (10%)

**Call Amounts:**
- Proportional to pot size
- Typical ratios: 1:3 to 1:10 (call:pot)
- Avoid unrealistic ratios

### 5. Mathematical Requirements
**Pot Odds:**
- Calculable by players
- **Range: 8%-62%** (adjusted for 50/50 balance)
- **Target:** Close to equity (±8% range)
- **Formula:** `potOdds = callAmount / (potAmount + callAmount) × 100`

**Equity:**
- Use Rule of 4 and 2: `equity = outs × multiplier`
- Multiplier: 4 for flop (2 cards to come), 2 for turn (1 card to come)
- Range: 10%-60% (increased to accommodate higher out counts)
- Basis for pot odds generation

**Decisions:**
- **50/50 mix:** Equal distribution of positive EV calls and negative EV folds
- **Close decisions:** Equity within ±8% of pot odds
- Avoid extreme differences (>10% gap)

### 6. Educational Value
**Learning Objectives:**
- Count outs to improve (including secondary outs)
- Calculate pot odds
- Estimate equity using Rule of 4 and 2
- Make call/fold decisions
- Understand when pairs can improve
- Practice both profitable and unprofitable situations

**Common Mistakes:**
- Overcounting outs
- Missing secondary outs (including four of a kind)
- Incorrect pot odds calculation
- Counting outs to hands not better than current pair
- Confusing made hands with drawing hands

## Implementation

### Generation Process:
1. Choose flop (70%) or turn (30%)
2. Select draw type based on frequency
3. Generate board for that draw (ensuring no better than pair initially)
4. Select hole cards involved in draw
5. Calculate outs (including secondary)
6. Calculate equity based on outs and cards to see
7. Generate pot/call amounts to target 50/50 EV distribution
8. Validate scenario

### Balanced EV Distribution Strategy:
- Calculate equity from outs
- Determine target pot odds range (equity ± 8%)
- Generate realistic pot amount
- Calculate call amount to achieve target pot odds
- Validate the resulting decision maintains 50/50 balance

### Quality Validation Checklist:
- [ ] Hole cards involved in draw
- [ ] Initial hand no better than one pair
- [ ] Outs count: 2-15 (prefer 2-12 for balance)
- [ ] Pot odds: 8%-62% (close to equity)
- [ ] Equity: 10%-50%
- [ ] Equity within ±8% of pot odds
- [ ] Clear call/fold decision
- [ ] Realistic scenario
- [ ] No calculator needed
- [ ] Includes all secondary outs (overcards, trips, four of a kind)
- [ ] Four of a kind only as secondary draw
- [ ] Balanced EV distribution (target 50/50)

## Implementation Status

**Current Implementation Features:**
- Weighted draw type selection (35% flush, 30% straight, 20% full house, 10% two pair, 5% three of a kind)
- Board generation (70% flop, 30% turn)
- **Fixed straight draw generator** with proper card tracking and multiple draw types:
  - Open-ended straight draws (8 outs)
  - Gutshot straight draws (4 outs)
  - No card duplication issues
  - Proper drawing scenarios (not completed hands)
- **Enhanced validation system** that prevents:
  - Starting with completed straights
  - Starting with completed flushes (5+ suited cards)
  - Starting with trips or better
  - Duplicate cards across hole cards and board
- Comprehensive outs calculation (primary + secondary + four of a kind)
- Balanced pot odds generation targeting equity ± 8%
- Fallback scenario system for reliability

**Critical Technical Requirements:**
- **Single Deck Integrity**: All generators draw from actual deck with proper card tracking
- Uses Set-based card tracking to prevent duplicates across ALL draw types
- Retry logic with fallback scenarios for reliability
- Multiple straight draw patterns (open-ended, gutshot)
- Comprehensive hand validation before scenario acceptance
- **Detailed outs calculation and display**:
  - Shows actual cards that are outs (not just count)
  - Separates primary outs (main draw) from secondary outs (overcards, quads)
  - Visual display with color coding (blue for primary, yellow for secondary)
  - Breakdown showing outs by type (flush, straight, etc.)
- **Deck Management**: 
  - All cards come from single 52-card deck
  - No impossible scenarios (like two 5♣)
  - Proper shuffling and card selection for each draw type

**UI Implementation:**
- Four-color card display for better suit recognition
- Clear mathematical explanations for educational value
- Color-coded decision display (green for call, red for fold)

## Database Schema for Practice History

### Overview
Store minimal practice history data on-device using expo-sqlite to track user performance and learning progress.

### Database Schema

#### Call Practice Attempts (`call_practice_attempts`)
**Purpose:** Record each individual practice scenario and user response.

**Schema:**
```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const callPracticeAttempts = sqliteTable('call_practice_attempts', {
  id: text('id').primaryKey(), // UUID for unique identification
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(), // Unix timestamp when attempt was made
  
  // Scenario data (stored as JSON strings)
  holeCards: text('hole_cards').notNull(), // JSON array of 2 Card objects
  boardCards: text('board_cards').notNull(), // JSON array of 3-4 Card objects
  potAmount: real('pot_amount').notNull(), // Pot size in dollars
  callAmount: real('call_amount').notNull(), // Call amount in dollars
  outs: integer('outs').notNull(), // Total number of outs
  equity: real('equity').notNull(), // Equity percentage (0-100)
  potOdds: real('pot_odds').notNull(), // Pot odds percentage (0-100)
  correctDecision: text('correct_decision', { enum: ['call', 'fold'] }).notNull(),
  description: text('description').notNull(), // Human-readable scenario description
  
  // Out cards breakdown (stored as JSON)
  outCardsPrimary: text('out_cards_primary').notNull(), // JSON array of primary out cards
  outCardsSecondary: text('out_cards_secondary').notNull(), // JSON array of secondary out cards
  outCardsTotal: text('out_cards_total').notNull(), // JSON array of all out cards
  outBreakdown: text('out_breakdown').notNull(), // JSON object with out type breakdown
  
  // User response
  userDecision: text('user_decision', { enum: ['call', 'fold'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  
  // Optional metadata
  timeToDecision: integer('time_to_decision'), // Decision time in milliseconds
  confidenceLevel: integer('confidence_level'), // User confidence 1-5 scale
  notes: text('notes'), // User notes
  platform: text('platform'), // Device/platform info
  appVersion: text('app_version'), // App version
});
```

### Data Storage Strategy

#### JSON Storage for Complex Objects
- **Card arrays**: Store as JSON strings for easy serialization/deserialization
- **Out breakdowns**: Store detailed out information as JSON for analysis
- **Settings objects**: Store nested objects as JSON for flexibility

#### Minimal Required Fields
For basic practice tracking, only these fields are essential:
- `id`, `timestamp`, `hole_cards`, `board_cards`, `pot_amount`, `call_amount`
- `outs`, `equity`, `pot_odds`, `correct_decision`, `user_decision`, `is_correct`

#### Performance Considerations
- Index on `timestamp` for time-based queries
- Index on `is_correct` for accuracy calculations
- Use prepared statements for repeated queries

### Database Operations

#### Core Functions Required:
1. **Record Attempt**: Save new practice attempt with all scenario data
2. **Get History**: Retrieve attempts with pagination and filtering

#### Data Privacy:
- All data stored locally on device
- No cloud synchronization required
- User can export/import data if needed
- Clear data option for privacy

### Integration Points

#### Practice Flow Integration:
1. **Scenario Generation**: Store complete scenario data when generated
2. **User Response**: Record decision and timing when user answers
3. **Result Display**: Show historical performance alongside current result

#### Analytics Integration:
- Track learning progress over time
- Identify weak areas (scenario types, pot odds ranges)
- Provide personalized practice recommendations
- Generate progress reports and insights

This specification creates educational poker scenarios focusing on outs to improve from hands no better than one pair.