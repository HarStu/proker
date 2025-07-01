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
- Examples: suited connectors, suited broadway, connected cards

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
- Example: A♠K♠ on J♠7♠2♥ = 9 flush outs + 3 overcard outs = 12 total outs

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
- Range: 15%-35%
- Clear enough for decisions

**Equity:**
- Use Rule of 4 and 2
- Range: 10%-50%
- Avoid extremes

**Decisions:**
- Clear call/fold choices
- Avoid coin-flips
- Include both +EV and -EV calls

### 6. Educational Value
**Learning Objectives:**
- Count outs to improve (including secondary outs)
- Calculate pot odds
- Estimate equity using Rule of 4 and 2
- Make call/fold decisions

**Common Mistakes:**
- Overcounting outs
- Missing secondary outs
- Incorrect pot odds calculation

### 7. Constraints
**Card Availability:**
- Ensure draws are possible
- Avoid impossible scenarios

**Variety:**
- Include different draw types
- Prevent pattern recognition

### 8. Quality Checks
**Requirements:**
- Clear correct answer
- Accurate outs counting
- Calculable pot odds
- Estimable equity

**Criteria:**
- Solvable by beginners
- No calculator needed
- Realistic scenarios

## Implementation

### Generation Steps:
1. Choose flop (70%) or turn (30%)
2. Select draw type based on frequency
3. Generate board for that draw
4. Select hole cards involved in draw
5. Calculate outs (including secondary)
6. Set pot and call amounts
7. Validate scenario

### Quality Checks:
- [ ] Hole cards involved in draw
- [ ] Outs count: 2-12
- [ ] Pot odds: 15%-35%
- [ ] Equity: 10%-50%
- [ ] Clear call/fold decision
- [ ] Realistic scenario
- [ ] No calculator needed
- [ ] Includes secondary outs

This specification creates simple, educational poker scenarios focusing on outs to improve. 