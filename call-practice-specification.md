# Call Practice Situation Generator Specification

## Overview
Generate poker situations for call practice training. Focus on "outs to improve" - cards that make your hand better.

**Core Elements:**
- Hole cards (2 cards)
- Board (flop or turn)
- Pot size
- Call amount
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
- Count cards that improve your hand
- Include secondary outs (e.g., flush draw + overcard outs)
- **Four of a Kind:** Only as secondary draw, never primary
- Example: A♠K♠ on J♠7♠2♥ = 9 flush outs + 3 overcard outs = 12 total outs

**Outs Range:**
- Minimum: 2 outs
- Maximum: 12 outs
- Avoid impossible draws

**Hand Improvement Clarity:**
- Starting hands are clear and simple (never better than pair)
- Draws to improve are obvious and countable
- No complex made hands that obscure the drawing situation

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
- Clear enough for decisions

**Equity:**
- Use Rule of 4 and 2
- Range: 10%-50%
- **Basis for pot odds generation**

**Decisions:**
- **50/50 mix:** Equal distribution of positive EV calls and negative EV folds
- **Close decisions:** Equity within ±8% of pot odds
- Avoid extreme differences (>10% gap)
- Include both +EV and -EV calls for learning

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

### 7. Constraints
**Card Availability:**
- Ensure draws are possible
- Avoid impossible scenarios
- No initial hands better than one pair

**Variety:**
- Include different draw types
- Prevent pattern recognition
- Mix paired and unpaired starting hands
- **Balanced decisions:** 50% profitable calls, 50% unprofitable folds

### 8. Quality Checks
**Requirements:**
- Clear correct answer
- Accurate outs counting
- Calculable pot odds
- Estimable equity
- Initial hand no better than one pair

**Criteria:**
- Solvable by beginners
- No calculator needed
- Realistic scenarios

## Implementation

### Generation Steps:
1. Choose flop (70%) or turn (30%)
2. Select draw type based on frequency
3. Generate board for that draw (ensuring no better than pair initially)
4. Select hole cards involved in draw
5. Calculate outs (including secondary)
6. **Calculate equity** based on outs and cards to see
7. **Generate pot/call amounts** to target 50/50 EV distribution
8. Validate scenario

### Balanced EV Distribution Plan:

**Step 6: Calculate Equity**
- Use Rule of 4 and 2: `equity = outs × multiplier`
- Multiplier: 4 for flop (2 cards to come), 2 for turn (1 card to come)
- Result: Equity percentage (e.g., 36%)

**Step 7: Generate Pot/Call for 50/50 Distribution**
- **Target Range:** Create pot odds that make the decision close to 50/50
- **Formula:** `potOdds = callAmount / (potAmount + callAmount) × 100`
- **Strategy:** 
  - If equity = 36%, target pot odds range of 28-44%
  - This creates scenarios where equity ≈ pot odds (close decisions)
  - Avoid extreme differences (>10% gap) that create obvious calls/folds

**Pot Odds Range by Equity:**
- Equity 10-20%: Pot odds 8-32% (close to equity)
- Equity 20-30%: Pot odds 18-42% (close to equity)  
- Equity 30-40%: Pot odds 28-52% (close to equity)
- Equity 40-50%: Pot odds 38-62% (close to equity)

**Implementation:**
1. Calculate equity from outs
2. Determine target pot odds range (equity ± 8%)
3. Generate pot amount (realistic range)
4. Calculate call amount to achieve target pot odds
5. Validate the resulting decision is close to 50/50

### Quality Checks:
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
- [ ] Proper pair improvement logic
- [ ] Four of a kind only as secondary draw
- [ ] Balanced EV distribution (target 50/50)

This specification creates simple, educational poker scenarios focusing on outs to improve from hands no better than one pair.