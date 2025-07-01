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
  - Secondary: Additional improvement cards (e.g., overcards)
- **Four of a Kind:** Only tracked as secondary outs, never primary
- Example: A♠K♠ on J♠7♠2♥
  - Primary (9 flush outs): 2♠,3♠,4♠,5♠,6♠,8♠,9♠,10♠,Q♠ 
  - Secondary (3 overcard outs): A♥,A♣,K♥
  - Total: 12 specific outs tracked

**Outs Range:**
- Minimum: 2 outs
- Maximum: 12 outs
- Avoid impossible draws

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
- Range: 10%-50%
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
- [ ] Outs count: 2-12
- [ ] Pot odds: 8%-62% (close to equity)
- [ ] Equity: 10%-50%
- [ ] Equity within ±8% of pot odds
- [ ] Clear call/fold decision
- [ ] Realistic scenario
- [ ] No calculator needed
- [ ] Includes secondary outs (including four of a kind)
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

This specification creates educational poker scenarios focusing on outs to improve from hands no better than one pair.