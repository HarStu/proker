// Four suits, hearts diamonds clubs spades
export type Suit = 'h' | 'd' | 'c' | 's'
// ranks from 2-14, with 11 being jack, 12 being queen, 13 being king, and 14 being ace
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

// each card has a suit and a rank
export type Card = {
  rank: Rank;
  suit: Suit;
}

export type Deck = Card[]

export type HandRanking =
  | "High Card"
  | "Pair"
  | "Two Pair"
  | "Three of a Kind"
  | "Straight"
  | "Flush"
  | "Full House"
  | "Four of a Kind"
  | "Straight Flush"
  | "Royal Flush"

// return a shuffled Deck
export function generateDeck(): Deck {
  const validSuits: Suit[] = ['h', 'd', 'c', 's']
  const validRanks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

  // Create an unshuffledDeck
  let unshuffledDeck: Deck = []
  for (let cardSuit of validSuits) {
    for (let cardRank of validRanks) {
      unshuffledDeck.push({ suit: cardSuit, rank: cardRank })
    }
  }

  // Shuffle the deck
  let shuffledDeck: Deck = []
  while (unshuffledDeck.length > 0) {
    // splice(index, n) removes n elements starting at index, and returns them as an array
    // so here we're grabbing 1 card from a random location in unshuffledDeck, 
    // then grabbing it from the array it's returned in
    const cardIndex = Math.floor(Math.random() * (unshuffledDeck.length));
    shuffledDeck.push(unshuffledDeck.splice(cardIndex, 1)[0]);
  }

  return shuffledDeck
}

// Calculate pot odds percentage
export function calculatePotOdds(potAmount: number, callAmount: number): number {
  if (callAmount <= 0 || potAmount < 0) return 0;
  return (callAmount / (potAmount + callAmount)) * 100;
}

// Count outs for specific hand types
export function countOuts(holeCards: Card[], boardCards: Card[], targetHand: HandRanking, remainingDeck: Deck): number {
  if (holeCards.length !== 2) return 0;
  if (boardCards.length > 0 && boardCards.length < 3) return 0;
  const allKnownCards = [...holeCards, ...boardCards];

  // Helper to count cards in deck that complete a hand
  function countCompletingCards(check: (card: Card) => boolean): number {
    return remainingDeck.filter(check).length;
  }

  // Helper to count rank/suit occurrences
  const rankCounts = new Map<Rank, number>();
  const suitCounts = new Map<Suit, number>();
  allKnownCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });

  // Helper for straight draws
  function isOneAwayFromStraight(cards: Card[]): { neededRanks: Rank[] } | null {
    const ranks = Array.from(new Set(cards.map(c => c.rank))).sort((a, b) => a - b);
    for (let i = 0; i <= ranks.length - 4; i++) {
      let gap = 0;
      let missing: Rank[] = [];
      for (let j = 0; j < 5; j++) {
        const rank = (ranks[i] + j) as Rank;
        if (!ranks.includes(rank)) {
          gap++;
          missing.push(rank as Rank);
        }
      }
      if (gap === 1) return { neededRanks: missing };
    }
    // Wheel straight
    if ([14, 2, 3, 4].every(r => ranks.includes(r as Rank))) {
      if (!ranks.includes(5)) return { neededRanks: [5 as Rank] };
    }
    return null;
  }

  // Helper for flush draws
  function isOneAwayFromFlush(): Suit | null {
    for (const [suit, count] of suitCounts) {
      if (count === 4) return suit;
    }
    return null;
  }

  // Helper for full house draws
  function isOneAwayFromFullHouse(): { pairRank: Rank, tripsRank: Rank } | null {
    let pair: Rank | null = null;
    let trips: Rank | null = null;
    for (const [rank, count] of rankCounts) {
      if (count === 3) trips = rank;
      else if (count === 2) pair = rank;
    }
    if ((pair && !trips) || (trips && !pair)) return { pairRank: pair!, tripsRank: trips! };
    return null;
  }

  // Helper to get Royal Flush ranks as Rank[]
  function getRoyalFlushRanks(): Rank[] {
    return [10, 11, 12, 13, 14] as Rank[];
  }

  // Main logic for each hand type
  switch (targetHand) {
    case "Pair": {
      // One away if you have one of a rank in hand/board
      for (const holeCard of holeCards) {
        if ((rankCounts.get(holeCard.rank) || 0) === 1) {
          return countCompletingCards(card => card.rank === holeCard.rank);
        }
      }
      return 0;
    }
    case "Two Pair": {
      // One away if you have a pair and another single
      let pairs = 0, singles: Rank[] = [];
      for (const [rank, count] of rankCounts) {
        if (count === 2) pairs++;
        if (count === 1) singles.push(rank);
      }
      if (pairs === 1 && singles.length >= 1) {
        // Need to pair one of the singles
        return singles.reduce((sum, rank) => sum + countCompletingCards(card => card.rank === (rank as Rank)), 0);
      }
      return 0;
    }
    case "Three of a Kind": {
      // One away if you have a pair
      for (const [rank, count] of rankCounts) {
        if (count === 2) {
          return countCompletingCards(card => card.rank === rank);
        }
      }
      return 0;
    }
    case "Straight": {
      // One away if you have an open-ended or gutshot straight draw
      const straightDraw = isOneAwayFromStraight(allKnownCards);
      if (straightDraw) {
        return straightDraw.neededRanks.reduce((sum, rank) => sum + countCompletingCards(card => card.rank === (rank as Rank)), 0);
      }
      return 0;
    }
    case "Flush": {
      // One away if you have 4 of a suit
      const suit = isOneAwayFromFlush();
      if (suit) {
        return countCompletingCards(card => card.suit === suit);
      }
      return 0;
    }
    case "Full House": {
      // One away if you have trips or a pair
      const fh = isOneAwayFromFullHouse();
      if (fh) {
        if (fh.tripsRank) {
          // Need a pair
          return Array.from(rankCounts.keys()).reduce((sum, rank) => {
            if (rank !== fh.tripsRank) {
              return sum + countCompletingCards(card => card.rank === (rank as Rank));
            }
            return sum;
          }, 0);
        } else if (fh.pairRank) {
          // Need to hit trips
          return countCompletingCards(card => card.rank === fh.pairRank);
        }
      }
      return 0;
    }
    case "Four of a Kind": {
      // One away if you have trips
      for (const [rank, count] of rankCounts) {
        if (count === 3) {
          return countCompletingCards(card => card.rank === rank);
        }
      }
      return 0;
    }
    case "Straight Flush": {
      // One away if you have 4 to a straight flush
      for (const suit of ["h", "d", "c", "s"] as Suit[]) {
        const suited = allKnownCards.filter(card => card.suit === suit);
        if (suited.length >= 4) {
          const straightDraw = isOneAwayFromStraight(suited);
          if (straightDraw) {
            return straightDraw.neededRanks.reduce((sum, rank) => sum + countCompletingCards(card => card.rank === (rank as Rank) && card.suit === suit), 0);
          }
        }
      }
      return 0;
    }
    case "Royal Flush": {
      // One away if you have 4 to a royal flush
      for (const suit of ["h", "d", "c", "s"] as Suit[]) {
        const needed = getRoyalFlushRanks();
        const neededSet = new Set<number>(needed);
        const suited = allKnownCards.filter(card => card.suit === suit && neededSet.has(card.rank));
        if (suited.length === 4) {
          let sum = 0;
          for (const rank of needed) {
            sum += countCompletingCards(card => card.rank === rank && card.suit === suit);
          }
          return sum;
        }
      }
      return 0;
    }
    default:
      return 0;
  }
}

// Calculate equity percentage based on outs
export function calculateEquity(outs: number, cardsToSee: number): number {
  if (outs <= 0 || cardsToSee <= 0) return 0;
  // Rule of 4 and 2: multiply outs by 4 for turn+river, by 2 for river only
  const multiplier = cardsToSee === 2 ? 4 : cardsToSee === 1 ? 2 : 2;
  return Math.min(outs * multiplier, 100);
}

export interface PokerCalcResult {
  outs: number;
  potOdds: number;
  equity: number;
  ev: number;
  isDrawAchieved: boolean;
  isValidSetup: boolean;
  statusMessages: string[];
  canShowOuts: boolean;
  canShowFullResults: boolean;
}

export function calculateResult({
  holeCards,
  boardCards,
  remainingDeck,
  targetHand,
  potAmount,
  callAmount,
  isCashValid
}: {
  holeCards: Card[];
  boardCards: Card[];
  remainingDeck: Deck;
  targetHand: string;
  potAmount: number;
  callAmount: number;
  isCashValid: boolean;
}): PokerCalcResult {
  const hasRequiredCards = holeCards.length === 2;
  const hasFlop = boardCards.length >= 3;
  const hasTargetHand = !!targetHand && targetHand !== "";
  const canShowOuts = hasRequiredCards && hasFlop && hasTargetHand;
  const canShowFullResults = canShowOuts && isCashValid && potAmount > 0 && callAmount > 0;
  const isValidSetup = canShowFullResults;
  const statusMessages: string[] = [];
  if (!canShowOuts) {
    statusMessages.push("Complete setup to see calculation");
  } else if (!canShowFullResults) {
    statusMessages.push("Enter pot and call amounts to see full results");
  }
  let outs = 0;
  let potOdds = 0;
  let equity = 0;
  let ev = 0;
  let isDrawAchieved = false;
  if (canShowOuts) {
    outs = countOuts(holeCards, boardCards, targetHand as HandRanking, remainingDeck);
  }
  if (canShowFullResults) {
    const cardsToSee = Math.max(0, 5 - boardCards.length);
    equity = calculateEquity(outs, cardsToSee);
    const winAmount = potAmount + callAmount;
    potOdds = callAmount > 0 && potAmount > 0 ? (winAmount / callAmount) : 0;
    const winChance = equity / 100;
    const loseChance = 1 - winChance;
    isDrawAchieved = equity >= 100;
    ev = potOdds > 0 && equity > 0 ? winChance * winAmount - loseChance * callAmount : 0;
  }
  return {
    outs,
    potOdds,
    equity,
    ev,
    isDrawAchieved,
    isValidSetup,
    statusMessages,
    canShowOuts,
    canShowFullResults
  };
}

export interface PokerScenario {
  holeCards: Card[];
  boardCards: Card[];
  targetHand: HandRanking;
  outs: number;
  potAmount: number;
  callAmount: number;
  potOdds: number;
  equity: number;
  ev: number;
  description: string;
}

export function generateScenario(): PokerScenario {
  const deck = generateDeck();
  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // Draw 2 hole cards
  for (let i = 0; i < 2; i++) {
    holeCards.push(deck.splice(0, 1)[0]);
  }

  // Draw 3-4 board cards (randomly choose 3 or 4)
  const boardCardCount = Math.random() < 0.5 ? 3 : 4;
  for (let i = 0; i < boardCardCount; i++) {
    boardCards.push(deck.splice(0, 1)[0]);
  }

  // Helper function to check if hole cards are involved in a hand
  function areHoleCardsInvolved(handType: HandRanking): boolean {
    const allCards = [...holeCards, ...boardCards];
    const holeCardRanks = holeCards.map(c => c.rank);
    const holeCardSuits = holeCards.map(c => c.suit);

    // Count occurrences
    const rankCounts = new Map<Rank, number>();
    const suitCounts = new Map<Suit, number>();
    allCards.forEach(card => {
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    });

    switch (handType) {
      case "Three of a Kind": {
        // Check if either hole card is part of a pair that could become trips
        for (const holeCard of holeCards) {
          if ((rankCounts.get(holeCard.rank) || 0) >= 2) {
            return true;
          }
        }
        return false;
      }
      case "Straight": {
        // Check if hole cards are part of a straight draw
        const allRanks = Array.from(new Set(allCards.map(c => c.rank))).sort((a, b) => a - b);
        for (let i = 0; i <= allRanks.length - 4; i++) {
          const straightRanks = allRanks.slice(i, i + 5);
          if (straightRanks.length === 5 && straightRanks.every((_, idx) =>
            straightRanks[idx] === allRanks[i] + idx ||
            (i === 0 && allRanks.includes(14) && allRanks.includes(2) && allRanks.includes(3) && allRanks.includes(4) && allRanks.includes(5))
          )) {
            // Check if any hole card is in this straight
            return holeCardRanks.some(rank => straightRanks.includes(rank));
          }
        }
        return false;
      }
      case "Flush": {
        // Check if hole cards are part of a flush draw
        for (const suit of holeCardSuits) {
          if ((suitCounts.get(suit) || 0) >= 4) {
            return true;
          }
        }
        return false;
      }
      case "Full House": {
        // Check if hole cards are part of trips or pair that could form full house
        for (const holeCard of holeCards) {
          if ((rankCounts.get(holeCard.rank) || 0) >= 2) {
            return true;
          }
        }
        return false;
      }
      case "Four of a Kind": {
        // Check if hole cards are part of trips that could become quads
        for (const holeCard of holeCards) {
          if ((rankCounts.get(holeCard.rank) || 0) >= 3) {
            return true;
          }
        }
        return false;
      }
      case "Straight Flush": {
        // Check if hole cards are part of a straight flush draw
        for (const suit of holeCardSuits) {
          const suited = allCards.filter(card => card.suit === suit);
          if (suited.length >= 4) {
            const suitedRanks = Array.from(new Set(suited.map(c => c.rank))).sort((a, b) => a - b);
            for (let i = 0; i <= suitedRanks.length - 4; i++) {
              const straightRanks = suitedRanks.slice(i, i + 5);
              if (straightRanks.length === 5 && straightRanks.every((_, idx) =>
                straightRanks[idx] === suitedRanks[i] + idx
              )) {
                return holeCardRanks.some(rank => straightRanks.includes(rank));
              }
            }
          }
        }
        return false;
      }
      default:
        return false;
    }
  }

  // Weighted hand selection based on relative frequency
  // Weights are approximate relative frequencies in poker
  const handWeights: { hand: HandRanking; weight: number }[] = [
    { hand: "Three of a Kind", weight: 25 },    // Most common
    { hand: "Straight", weight: 25 },              // Common
    { hand: "Flush", weight: 25 },           // Common
    { hand: "Full House", weight: 10 },         // Less common
    { hand: "Four of a Kind", weight: 4 },      // Rare
    { hand: "Straight Flush", weight: 1 }       // Very rare
  ];

  // Create weighted array for random selection
  const weightedHands: HandRanking[] = [];
  handWeights.forEach(({ hand, weight }) => {
    for (let i = 0; i < weight; i++) {
      weightedHands.push(hand);
    }
  });

  // Try hands in weighted order until we find a valid one
  let bestHand: HandRanking | null = null;
  let maxOuts = 0;

  // Shuffle the weighted hands to add randomness while maintaining weights
  const shuffledHands = [...weightedHands].sort(() => Math.random() - 0.5);

  for (const hand of shuffledHands) {
    const outs = countOuts(holeCards, boardCards, hand, deck);
    // Only consider hands where hole cards are actually involved
    if (outs > maxOuts && areHoleCardsInvolved(hand)) {
      maxOuts = outs;
      bestHand = hand;
      // Don't break here - continue to find the best hand among valid options
    }
  }

  // If no valid draw found, try again recursively
  if (!bestHand || maxOuts === 0) {
    return generateScenario();
  }

  // Generate diverse pot and call amounts
  // Pot ranges: small ($50-$300), medium ($300-$1000), large ($1000-$3000), huge ($3000-$10000)
  const potRanges = [
    { min: 50, max: 300, weight: 30 },
    { min: 300, max: 1000, weight: 40 },
    { min: 1000, max: 3000, weight: 20 },
    { min: 3000, max: 10000, weight: 10 }
  ];

  // Call ranges: small ($10-$50), medium ($50-$200), large ($200-$500), huge ($500-$1500)
  const callRanges = [
    { min: 10, max: 50, weight: 25 },
    { min: 50, max: 200, weight: 35 },
    { min: 200, max: 500, weight: 25 },
    { min: 500, max: 1500, weight: 15 }
  ];

  // Select pot range
  const potRangeWeights = potRanges.map(r => r.weight);
  const potRangeIndex = selectWeightedRandom(potRangeWeights);
  const selectedPotRange = potRanges[potRangeIndex];
  const potAmount = Math.floor(Math.random() * (selectedPotRange.max - selectedPotRange.min + 1)) + selectedPotRange.min;

  // Select call range
  const callRangeWeights = callRanges.map(r => r.weight);
  const callRangeIndex = selectWeightedRandom(callRangeWeights);
  const selectedCallRange = callRanges[callRangeIndex];
  const callAmount = Math.floor(Math.random() * (selectedCallRange.max - selectedCallRange.min + 1)) + selectedCallRange.min;

  // Calculate financial metrics
  const cardsToSee = Math.max(0, 5 - boardCards.length);
  const equity = calculateEquity(maxOuts, cardsToSee);
  const winAmount = potAmount + callAmount;
  const potOdds = callAmount > 0 && potAmount > 0 ? (winAmount / callAmount) : 0;
  const winChance = equity / 100;
  const loseChance = 1 - winChance;
  const ev = potOdds > 0 && equity > 0 ? winChance * winAmount - loseChance * callAmount : 0;

  // If EV is zero or negative, try again recursively
  if (ev <= 0) {
    return generateScenario();
  }

  // Generate description
  const holeCardDesc = holeCards.map(card => `${card.rank}${card.suit}`).join(' ');
  const boardCardDesc = boardCards.map(card => `${card.rank}${card.suit}`).join(' ');
  const description = `You have ${holeCardDesc} with ${boardCardDesc} on the board. Drawing for ${bestHand} with ${maxOuts} outs.`;

  return {
    holeCards,
    boardCards,
    targetHand: bestHand,
    outs: maxOuts,
    potAmount,
    callAmount,
    potOdds,
    equity,
    ev,
    description
  };
}

// Helper function for weighted random selection
function selectWeightedRandom(weights: number[]): number {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return i;
    }
  }

  return weights.length - 1; // Fallback
}

export interface CallPracticeScenario {
  holeCards: Card[];
  boardCards: Card[];
  potAmount: number;
  callAmount: number;
  outs: number;
  equity: number;
  potOdds: number;
  correctDecision: 'call' | 'fold';
  description: string;
}

export function generateCallPracticeScenario(): CallPracticeScenario {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;

    // Step 1: Choose flop (70%) or turn (30%)
    const isFlop = Math.random() < 0.7;
    const boardCardCount = isFlop ? 3 : 4;

    // Step 2: Select draw type based on frequency
    const drawTypes = [
      { type: 'flush', weight: 35 },
      { type: 'straight', weight: 30 },
      { type: 'fullHouse', weight: 20 },
      { type: 'twoPair', weight: 10 },
      { type: 'threeOfAKind', weight: 5 }
    ];

    const selectedDraw = selectWeightedDrawType(drawTypes);

    // Step 3: Generate board ensuring no better than pair initially
    const { holeCards, boardCards, deck } = generateValidScenario(boardCardCount, selectedDraw);

    // Validate initial hand is no better than a pair
    if (!isValidStartingHand(holeCards, boardCards)) {
      continue;
    }

    // Step 5: Calculate outs (including secondary and four of a kind)
    const outs = calculateAllOuts(holeCards, boardCards, deck);

    if (outs < 2 || outs > 12) {
      continue;
    }

    // Step 6: Calculate equity based on outs and cards to see
    const cardsToSee = Math.max(0, 5 - boardCards.length);
    const equity = calculateEquity(outs, cardsToSee);

    // Step 7: Generate pot/call amounts to target 50/50 EV distribution
    const { potAmount, callAmount, potOdds } = generateBalancedPotOdds(equity);

    // Validate the scenario meets requirements
    if (!isValidScenario(equity, potOdds, outs)) {
      continue;
    }

    // Determine correct decision
    const correctDecision: 'call' | 'fold' = equity > potOdds ? 'call' : 'fold';

    // Generate description
    const description = generateScenarioDescription(holeCards, boardCards, potAmount, callAmount, isFlop);

    return {
      holeCards,
      boardCards,
      potAmount,
      callAmount,
      outs,
      equity,
      potOdds,
      correctDecision,
      description
    };
  }

  // Fallback: create a simple flush draw scenario
  return createFallbackScenario();
}

// Helper functions

function selectWeightedDrawType(drawTypes: { type: string; weight: number }[]): string {
  const weights = drawTypes.map(d => d.weight);
  const selectedIndex = selectWeightedRandom(weights);
  return drawTypes[selectedIndex].type;
}

function generateValidScenario(boardCardCount: number, drawType: string): { holeCards: Card[]; boardCards: Card[]; deck: Deck } {
  const deck = generateDeck();
  let holeCards: Card[] = [];
  let boardCards: Card[] = [];

  // Generate based on draw type
  switch (drawType) {
    case 'flush':
      ({ holeCards, boardCards } = generateFlushDraw(deck, boardCardCount));
      break;
    case 'straight':
      ({ holeCards, boardCards } = generateStraightDraw(deck, boardCardCount));
      break;
    case 'fullHouse':
      ({ holeCards, boardCards } = generateFullHouseDraw(deck, boardCardCount));
      break;
    case 'twoPair':
      ({ holeCards, boardCards } = generateTwoPairDraw(deck, boardCardCount));
      break;
    case 'threeOfAKind':
      ({ holeCards, boardCards } = generateThreeOfAKindDraw(deck, boardCardCount));
      break;
    default:
      ({ holeCards, boardCards } = generateFlushDraw(deck, boardCardCount));
  }

  return { holeCards, boardCards, deck };
}

function generateFlushDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suit = ['h', 'd', 'c', 's'][Math.floor(Math.random() * 4)] as Suit;
  const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // 2 suited hole cards
  for (let i = 0; i < 2; i++) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)] as Rank;
    holeCards.push({ rank, suit });
  }

  // 2 suited cards on board, rest off-suit
  for (let i = 0; i < boardCardCount; i++) {
    if (i < 2) {
      const rank = ranks[Math.floor(Math.random() * ranks.length)] as Rank;
      boardCards.push({ rank, suit });
    } else {
      const offSuit = ['h', 'd', 'c', 's'].filter(s => s !== suit)[Math.floor(Math.random() * 3)] as Suit;
      const rank = ranks[Math.floor(Math.random() * ranks.length)] as Rank;
      boardCards.push({ rank, suit: offSuit });
    }
  }

  return { holeCards, boardCards };
}

function generateStraightDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  // Generate open-ended straight draw
  const startRank = 5 + Math.floor(Math.random() * 6); // 5-10 to avoid wheel complications
  const suits = ['h', 'd', 'c', 's'];

  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // Hole cards: consecutive ranks
  holeCards.push({ rank: startRank as Rank, suit: suits[Math.floor(Math.random() * 4)] as Suit });
  holeCards.push({ rank: (startRank + 1) as Rank, suit: suits[Math.floor(Math.random() * 4)] as Suit });

  // Board cards: fill in some of the straight
  for (let i = 0; i < boardCardCount; i++) {
    const rank = (startRank + 2 + i) as Rank;
    const suit = suits[Math.floor(Math.random() * 4)] as Suit;
    boardCards.push({ rank, suit });
  }

  return { holeCards, boardCards };
}

function generateFullHouseDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suits = ['h', 'd', 'c', 's'];
  const rank1 = (2 + Math.floor(Math.random() * 11)) as Rank; // 2-12
  const rank2 = (2 + Math.floor(Math.random() * 11)) as Rank; // 2-12

  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // Pocket pair
  holeCards.push({ rank: rank1, suit: suits[0] as Suit });
  holeCards.push({ rank: rank1, suit: suits[1] as Suit });

  // Board has one matching rank (for trips) and other cards
  boardCards.push({ rank: rank1, suit: suits[2] as Suit }); // Makes trips

  for (let i = 1; i < boardCardCount; i++) {
    const rank = (2 + Math.floor(Math.random() * 11)) as Rank;
    const suit = suits[Math.floor(Math.random() * 4)] as Suit;
    boardCards.push({ rank, suit });
  }

  return { holeCards, boardCards };
}

function generateTwoPairDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suits = ['h', 'd', 'c', 's'];
  const rank1 = (2 + Math.floor(Math.random() * 11)) as Rank;
  const rank2 = (2 + Math.floor(Math.random() * 11)) as Rank;

  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // One pair in hole cards
  holeCards.push({ rank: rank1, suit: suits[0] as Suit });
  holeCards.push({ rank: rank1, suit: suits[1] as Suit });

  // Board has potential second pair
  boardCards.push({ rank: rank2, suit: suits[0] as Suit });

  for (let i = 1; i < boardCardCount; i++) {
    const rank = (2 + Math.floor(Math.random() * 11)) as Rank;
    const suit = suits[Math.floor(Math.random() * 4)] as Suit;
    boardCards.push({ rank, suit });
  }

  return { holeCards, boardCards };
}

function generateThreeOfAKindDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suits = ['h', 'd', 'c', 's'];
  const rank1 = (2 + Math.floor(Math.random() * 11)) as Rank;

  const holeCards: Card[] = [];
  const boardCards: Card[] = [];

  // Pocket pair
  holeCards.push({ rank: rank1, suit: suits[0] as Suit });
  holeCards.push({ rank: rank1, suit: suits[1] as Suit });

  // Board with potential to make trips
  for (let i = 0; i < boardCardCount; i++) {
    const rank = (2 + Math.floor(Math.random() * 11)) as Rank;
    const suit = suits[Math.floor(Math.random() * 4)] as Suit;
    boardCards.push({ rank, suit });
  }

  return { holeCards, boardCards };
}

function isValidStartingHand(holeCards: Card[], boardCards: Card[]): boolean {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  // Check that we don't start with better than a pair
  const maxCount = Math.max(...rankCounts.values());
  return maxCount <= 2; // Pair or less
}

function calculateAllOuts(holeCards: Card[], boardCards: Card[], deck: Deck): number {
  let totalOuts = 0;

  // Primary outs (flush, straight, etc.)
  const primaryOuts = Math.max(
    countOuts(holeCards, boardCards, "Flush", deck),
    countOuts(holeCards, boardCards, "Straight", deck),
    countOuts(holeCards, boardCards, "Full House", deck),
    countOuts(holeCards, boardCards, "Two Pair", deck),
    countOuts(holeCards, boardCards, "Three of a Kind", deck)
  );

  totalOuts += primaryOuts;

  // Secondary outs (overcards)
  const secondaryOuts = calculateOvercardOuts(holeCards, boardCards, deck);
  totalOuts += secondaryOuts;

  // Four of a kind outs (secondary only)
  const quadOuts = calculateQuadOuts(holeCards, boardCards, deck);
  totalOuts += quadOuts;

  return Math.min(12, totalOuts);
}

function calculateOvercardOuts(holeCards: Card[], boardCards: Card[], deck: Deck): number {
  if (boardCards.length === 0) return 0;

  const boardRanks = boardCards.map(c => c.rank);
  const maxBoardRank = Math.max(...boardRanks);
  let overcardOuts = 0;

  holeCards.forEach(card => {
    if (card.rank > maxBoardRank) {
      const remainingCards = deck.filter(d => d.rank === card.rank);
      overcardOuts += remainingCards.length;
    }
  });

  return overcardOuts;
}

function calculateQuadOuts(holeCards: Card[], boardCards: Card[], deck: Deck): number {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  let quadOuts = 0;

  // Check for trips that can become quads
  for (const [rank, count] of rankCounts) {
    if (count === 3) {
      const remainingCards = deck.filter(d => d.rank === rank);
      quadOuts += remainingCards.length;
    }
  }

  return quadOuts;
}

function generateBalancedPotOdds(equity: number): { potAmount: number; callAmount: number; potOdds: number } {
  // Target pot odds range: equity ± 8%
  const minPotOdds = Math.max(8, equity - 8);
  const maxPotOdds = Math.min(62, equity + 8);

  // Generate target pot odds within range
  const targetPotOdds = minPotOdds + Math.random() * (maxPotOdds - minPotOdds);

  // Generate realistic pot amount
  const potRanges = [
    { min: 50, max: 300, weight: 30 },
    { min: 300, max: 1000, weight: 40 },
    { min: 1000, max: 3000, weight: 20 },
    { min: 3000, max: 10000, weight: 10 }
  ];

  const weights = potRanges.map(r => r.weight);
  const selectedIndex = selectWeightedRandom(weights);
  const selectedRange = potRanges[selectedIndex];
  const potAmount = Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1)) + selectedRange.min;

  // Calculate call amount to achieve target pot odds
  // targetPotOdds = callAmount / (potAmount + callAmount) * 100
  // callAmount = targetPotOdds * (potAmount + callAmount) / 100
  // callAmount = targetPotOdds * potAmount / (100 - targetPotOdds)
  const callAmount = Math.round((targetPotOdds * potAmount) / (100 - targetPotOdds));

  // Calculate actual pot odds
  const actualPotOdds = (callAmount / (potAmount + callAmount)) * 100;

  return { potAmount, callAmount, potOdds: actualPotOdds };
}

function isValidScenario(equity: number, potOdds: number, outs: number): boolean {
  // Check if equity is within ±8% of pot odds
  const difference = Math.abs(equity - potOdds);
  return difference <= 8 && outs >= 2 && outs <= 12 && equity >= 10 && equity <= 50;
}

function generateScenarioDescription(holeCards: Card[], boardCards: Card[], potAmount: number, callAmount: number, isFlop: boolean): string {
  const formatCard = (card: Card) => {
    const rank = card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : card.rank === 13 ? 'K' : card.rank === 14 ? 'A' : card.rank.toString();
    const suit = card.suit === 'h' ? '♥' : card.suit === 'd' ? '♦' : card.suit === 'c' ? '♣' : '♠';
    return rank + suit;
  };

  const holeCardDesc = holeCards.map(formatCard).join(' ');
  const boardCardDesc = boardCards.map(formatCard).join(' ');
  const street = isFlop ? 'flop' : 'turn';

  return `You have ${holeCardDesc} on the ${street} with ${boardCardDesc}. Pot: $${potAmount}, Call: $${callAmount}.`;
}

function createFallbackScenario(): CallPracticeScenario {
  // Simple flush draw fallback
  const holeCards: Card[] = [
    { rank: 14, suit: 'h' }, // Ace of hearts
    { rank: 13, suit: 'h' }  // King of hearts
  ];

  const boardCards: Card[] = [
    { rank: 11, suit: 'h' }, // Jack of hearts
    { rank: 7, suit: 'h' },  // 7 of hearts
    { rank: 2, suit: 'd' }   // 2 of diamonds
  ];

  const outs = 9; // Flush outs
  const equity = 36; // 9 outs * 4
  const potAmount = 500;
  const callAmount = 150;
  const potOdds = (callAmount / (potAmount + callAmount)) * 100; // ~23%

  return {
    holeCards,
    boardCards,
    potAmount,
    callAmount,
    outs,
    equity,
    potOdds,
    correctDecision: 'call',
    description: `You have A♥ K♥ on the flop with J♥ 7♥ 2♦. Pot: $${potAmount}, Call: $${callAmount}.`
  };
}