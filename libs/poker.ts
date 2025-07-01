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
  outCards: {
    primary: Card[];
    secondary: Card[];
    total: Card[];
  };
  outBreakdown: {
    primaryOuts: number;
    primaryType: string;
    secondaryOuts: number;
    secondaryTypes: string[];
  };
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
    const detailedOuts = calculateDetailedOuts(holeCards, boardCards, deck);
    const outs = detailedOuts.outCards.total.length;

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
      description,
      outCards: detailedOuts.outCards,
      outBreakdown: detailedOuts.outBreakdown
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
  const suits = ['h', 'd', 'c', 's'] as Suit[];
  const flushSuit = suits[Math.floor(Math.random() * 4)];

  let attempts = 0;
  while (attempts < 50) {
    attempts++;

    const usedCards = new Set<string>();
    const holeCards: Card[] = [];
    const boardCards: Card[] = [];

    try {
      // Get available cards of the flush suit from deck
      const availableFlushCards = deck.filter(card => card.suit === flushSuit);
      const availableOffSuitCards = deck.filter(card => card.suit !== flushSuit);

      if (availableFlushCards.length < 4 || availableOffSuitCards.length < (boardCardCount - 2)) {
        continue; // Not enough cards available
      }

      // Shuffle and take 4 cards for the flush draw (2 hole + 2 board)
      const shuffledFlushCards = [...availableFlushCards].sort(() => Math.random() - 0.5);
      const flushDrawCards = shuffledFlushCards.slice(0, 4);

      // Assign 2 to hole cards, 2 to board
      holeCards.push(flushDrawCards[0], flushDrawCards[1]);
      boardCards.push(flushDrawCards[2], flushDrawCards[3]);

      // Track used cards
      flushDrawCards.forEach(card => {
        usedCards.add(`${card.rank}-${card.suit}`);
      });

      // Fill remaining board slots with off-suit cards
      const availableOffSuit = availableOffSuitCards.filter(card =>
        !usedCards.has(`${card.rank}-${card.suit}`)
      );

      const shuffledOffSuit = [...availableOffSuit].sort(() => Math.random() - 0.5);
      const neededOffSuit = boardCardCount - 2;

      for (let i = 0; i < neededOffSuit && i < shuffledOffSuit.length; i++) {
        const card = shuffledOffSuit[i];
        boardCards.push(card);
        usedCards.add(`${card.rank}-${card.suit}`);
      }

      // Validate we have the right number of cards and no duplicates
      if (holeCards.length === 2 && boardCards.length === boardCardCount && usedCards.size === 2 + boardCardCount) {
        return { holeCards, boardCards };
      }
    } catch (error) {
      // Continue to next attempt
    }
  }

  // Fallback: return a safe flush draw
  return generateFallbackFlushDraw(boardCardCount);
}

function generateFallbackFlushDraw(boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const holeCards: Card[] = [
    { rank: 14, suit: 'h' }, // A♥
    { rank: 13, suit: 'h' }  // K♥
  ];

  const boardCards: Card[] = [
    { rank: 11, suit: 'h' }, // J♥
    { rank: 7, suit: 'h' },  // 7♥
    { rank: 2, suit: 'd' }   // 2♦
  ];

  if (boardCardCount === 4) {
    boardCards.push({ rank: 3, suit: 'c' }); // 3♣
  }

  return { holeCards, boardCards };
}

function generateStraightDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suits = ['h', 'd', 'c', 's'] as Suit[];

  // Create different types of straight draws
  const drawTypes = ['open-ended', 'gutshot', 'double-gutshot'];
  const drawType = drawTypes[Math.floor(Math.random() * drawTypes.length)];

  let attempts = 0;
  while (attempts < 50) {
    attempts++;

    const usedCards = new Set<string>();
    const holeCards: Card[] = [];
    const boardCards: Card[] = [];

    try {
      if (drawType === 'open-ended') {
        // Open-ended straight draw: need 4 cards in sequence, missing one or both ends
        const startRank = 6 + Math.floor(Math.random() * 5); // 6-10 to avoid wheel/broadway complications

        if (boardCardCount === 3) {
          // Flop: hole cards can be part of 4-card sequence
          // Example: hole 7-8, board 9-10-X = open-ended (6 or J makes straight)
          const holeRank1 = startRank;
          const holeRank2 = startRank + 1;
          const boardRank1 = startRank + 2;
          const boardRank2 = startRank + 3;

          // Add hole cards
          for (let i = 0; i < 2; i++) {
            const rank = i === 0 ? holeRank1 : holeRank2;
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            if (usedCards.has(cardKey)) continue;
            holeCards.push({ rank: rank as Rank, suit });
            usedCards.add(cardKey);
          }

          // Add first two board cards (sequence)
          for (let i = 0; i < 2; i++) {
            const rank = i === 0 ? boardRank1 : boardRank2;
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            if (usedCards.has(cardKey)) continue;
            boardCards.push({ rank: rank as Rank, suit });
            usedCards.add(cardKey);
          }

          // Add one random card that doesn't complete the straight
          let randomCard;
          let randomAttempts = 0;
          do {
            randomAttempts++;
            const rank = (2 + Math.floor(Math.random() * 11)) as Rank; // 2-12, avoid A
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            randomCard = { rank, suit, cardKey };
          } while ((usedCards.has(randomCard.cardKey) ||
            randomCard.rank === startRank - 1 ||
            randomCard.rank === startRank + 4) && randomAttempts < 20);

          if (randomAttempts < 20) {
            boardCards.push({ rank: randomCard.rank, suit: randomCard.suit });
            usedCards.add(randomCard.cardKey);
          }
        } else {
          // Turn: similar but with 4 board cards
          const holeRank1 = startRank;
          const holeRank2 = startRank + 1;
          const boardRank1 = startRank + 2;
          const boardRank2 = startRank + 3;

          // Add hole cards
          for (let i = 0; i < 2; i++) {
            const rank = i === 0 ? holeRank1 : holeRank2;
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            if (usedCards.has(cardKey)) continue;
            holeCards.push({ rank: rank as Rank, suit });
            usedCards.add(cardKey);
          }

          // Add sequence cards to board
          for (let i = 0; i < 2; i++) {
            const rank = i === 0 ? boardRank1 : boardRank2;
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            if (usedCards.has(cardKey)) continue;
            boardCards.push({ rank: rank as Rank, suit });
            usedCards.add(cardKey);
          }

          // Add two random cards
          for (let i = 0; i < 2; i++) {
            let randomCard;
            let randomAttempts = 0;
            do {
              randomAttempts++;
              const rank = (2 + Math.floor(Math.random() * 11)) as Rank;
              const suit = suits[Math.floor(Math.random() * 4)];
              const cardKey = `${rank}-${suit}`;
              randomCard = { rank, suit, cardKey };
            } while ((usedCards.has(randomCard.cardKey) ||
              randomCard.rank === startRank - 1 ||
              randomCard.rank === startRank + 4) && randomAttempts < 20);

            if (randomAttempts < 20) {
              boardCards.push({ rank: randomCard.rank, suit: randomCard.suit });
              usedCards.add(randomCard.cardKey);
            }
          }
        }
      } else if (drawType === 'gutshot') {
        // Gutshot: 4 cards with one gap in the middle
        const startRank = 6 + Math.floor(Math.random() * 5); // 6-10

        // Example: 7-8-10-J (missing 9 for straight)
        const ranks = [startRank, startRank + 1, startRank + 3, startRank + 4];

        // Randomly assign 2 ranks to hole cards, rest to board
        const shuffledRanks = [...ranks].sort(() => Math.random() - 0.5);
        const holeRanks = shuffledRanks.slice(0, 2);
        const boardRanks = shuffledRanks.slice(2);

        // Add hole cards
        for (const rank of holeRanks) {
          const suit = suits[Math.floor(Math.random() * 4)];
          const cardKey = `${rank}-${suit}`;
          if (usedCards.has(cardKey)) continue;
          holeCards.push({ rank: rank as Rank, suit });
          usedCards.add(cardKey);
        }

        // Add board cards (sequence + random)
        for (const rank of boardRanks) {
          const suit = suits[Math.floor(Math.random() * 4)];
          const cardKey = `${rank}-${suit}`;
          if (usedCards.has(cardKey)) continue;
          boardCards.push({ rank: rank as Rank, suit });
          usedCards.add(cardKey);
        }

        // Fill remaining board slots with random cards
        while (boardCards.length < boardCardCount) {
          let randomAttempts = 0;
          let randomCard;
          do {
            randomAttempts++;
            const rank = (2 + Math.floor(Math.random() * 11)) as Rank;
            const suit = suits[Math.floor(Math.random() * 4)];
            const cardKey = `${rank}-${suit}`;
            randomCard = { rank, suit, cardKey };
          } while ((usedCards.has(randomCard.cardKey) ||
            randomCard.rank === startRank + 2) && randomAttempts < 20); // Don't add the missing card

          if (randomAttempts < 20) {
            boardCards.push({ rank: randomCard.rank, suit: randomCard.suit });
            usedCards.add(randomCard.cardKey);
          } else {
            break;
          }
        }
      }

      // Validate we have the right number of cards and no duplicates
      if (holeCards.length === 2 && boardCards.length === boardCardCount && usedCards.size === 2 + boardCardCount) {
        return { holeCards, boardCards };
      }
    } catch (error) {
      // Continue to next attempt
    }
  }

  // Fallback: simple open-ended draw
  return generateFallbackStraightDraw(boardCardCount);
}

function generateFallbackStraightDraw(boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const suits = ['h', 'd', 'c', 's'] as Suit[];
  const holeCards: Card[] = [
    { rank: 8, suit: 'h' },
    { rank: 9, suit: 'd' }
  ];

  const boardCards: Card[] = [
    { rank: 10, suit: 'c' },
    { rank: 11, suit: 's' },
    { rank: 2, suit: 'h' }
  ];

  if (boardCardCount === 4) {
    boardCards.push({ rank: 3, suit: 'd' });
  }

  return { holeCards, boardCards };
}

function generateFullHouseDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;

    const usedCards = new Set<string>();
    const holeCards: Card[] = [];
    const boardCards: Card[] = [];

    try {
      // Pick a rank for the pocket pair (that will become trips)
      const availableRanks = Array.from(new Set(deck.map(c => c.rank)));
      const pocketRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];

      // Get available cards of this rank
      const availablePocketCards = deck.filter(card => card.rank === pocketRank);
      if (availablePocketCards.length < 3) continue; // Need at least 3 for pocket pair + board card

      // Take 3 cards of this rank
      const shuffledPocketCards = [...availablePocketCards].sort(() => Math.random() - 0.5);

      // Assign 2 to hole cards (pocket pair), 1 to board (makes trips)
      holeCards.push(shuffledPocketCards[0], shuffledPocketCards[1]);
      boardCards.push(shuffledPocketCards[2]);

      // Track used cards
      shuffledPocketCards.slice(0, 3).forEach(card => {
        usedCards.add(`${card.rank}-${card.suit}`);
      });

      // Fill remaining board slots with different ranks
      const remainingSlots = boardCardCount - 1;
      const availableOtherCards = deck.filter(card =>
        card.rank !== pocketRank && !usedCards.has(`${card.rank}-${card.suit}`)
      );

      const shuffledOtherCards = [...availableOtherCards].sort(() => Math.random() - 0.5);

      for (let i = 0; i < remainingSlots && i < shuffledOtherCards.length; i++) {
        const card = shuffledOtherCards[i];
        boardCards.push(card);
        usedCards.add(`${card.rank}-${card.suit}`);
      }

      // Validate we have the right number of cards and no duplicates
      if (holeCards.length === 2 && boardCards.length === boardCardCount && usedCards.size === 2 + boardCardCount) {
        return { holeCards, boardCards };
      }
    } catch (error) {
      // Continue to next attempt
    }
  }

  // Fallback
  return generateFallbackFullHouseDraw(boardCardCount);
}

function generateFallbackFullHouseDraw(boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const holeCards: Card[] = [
    { rank: 8, suit: 'h' }, // 8♥
    { rank: 8, suit: 'd' }  // 8♦
  ];

  const boardCards: Card[] = [
    { rank: 8, suit: 'c' }, // 8♣ (makes trips)
    { rank: 5, suit: 's' }, // 5♠
    { rank: 2, suit: 'h' }  // 2♥
  ];

  if (boardCardCount === 4) {
    boardCards.push({ rank: 10, suit: 'd' }); // 10♦
  }

  return { holeCards, boardCards };
}

function generateTwoPairDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;

    const usedCards = new Set<string>();
    const holeCards: Card[] = [];
    const boardCards: Card[] = [];

    try {
      // Get available ranks
      const availableRanks = Array.from(new Set(deck.map(c => c.rank)));
      if (availableRanks.length < 2) continue;

      // Pick two different ranks
      const shuffledRanks = [...availableRanks].sort(() => Math.random() - 0.5);
      const pairRank = shuffledRanks[0];
      const kickerRank = shuffledRanks[1];

      // Get pocket pair cards
      const availablePairCards = deck.filter(card => card.rank === pairRank);
      if (availablePairCards.length < 2) continue;

      const shuffledPairCards = [...availablePairCards].sort(() => Math.random() - 0.5);
      holeCards.push(shuffledPairCards[0], shuffledPairCards[1]);

      // Track used cards
      shuffledPairCards.slice(0, 2).forEach(card => {
        usedCards.add(`${card.rank}-${card.suit}`);
      });

      // Add one card of kicker rank to board (potential second pair)
      const availableKickerCards = deck.filter(card =>
        card.rank === kickerRank && !usedCards.has(`${card.rank}-${card.suit}`)
      );
      if (availableKickerCards.length === 0) continue;

      const kickerCard = availableKickerCards[Math.floor(Math.random() * availableKickerCards.length)];
      boardCards.push(kickerCard);
      usedCards.add(`${kickerCard.rank}-${kickerCard.suit}`);

      // Fill remaining board slots with other cards
      const remainingSlots = boardCardCount - 1;
      const availableOtherCards = deck.filter(card =>
        card.rank !== pairRank && card.rank !== kickerRank && !usedCards.has(`${card.rank}-${card.suit}`)
      );

      const shuffledOtherCards = [...availableOtherCards].sort(() => Math.random() - 0.5);

      for (let i = 0; i < remainingSlots && i < shuffledOtherCards.length; i++) {
        const card = shuffledOtherCards[i];
        boardCards.push(card);
        usedCards.add(`${card.rank}-${card.suit}`);
      }

      // Validate we have the right number of cards and no duplicates
      if (holeCards.length === 2 && boardCards.length === boardCardCount && usedCards.size === 2 + boardCardCount) {
        return { holeCards, boardCards };
      }
    } catch (error) {
      // Continue to next attempt
    }
  }

  // Fallback
  return generateFallbackTwoPairDraw(boardCardCount);
}

function generateFallbackTwoPairDraw(boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const holeCards: Card[] = [
    { rank: 9, suit: 'h' }, // 9♥
    { rank: 9, suit: 'd' }  // 9♦
  ];

  const boardCards: Card[] = [
    { rank: 6, suit: 'c' }, // 6♣ (potential second pair)
    { rank: 3, suit: 's' }, // 3♠
    { rank: 11, suit: 'h' } // J♥
  ];

  if (boardCardCount === 4) {
    boardCards.push({ rank: 2, suit: 'd' }); // 2♦
  }

  return { holeCards, boardCards };
}

function generateThreeOfAKindDraw(deck: Deck, boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  let attempts = 0;
  while (attempts < 50) {
    attempts++;

    const usedCards = new Set<string>();
    const holeCards: Card[] = [];
    const boardCards: Card[] = [];

    try {
      // Pick a rank for the pocket pair
      const availableRanks = Array.from(new Set(deck.map(c => c.rank)));
      const pairRank = availableRanks[Math.floor(Math.random() * availableRanks.length)];

      // Get pocket pair cards
      const availablePairCards = deck.filter(card => card.rank === pairRank);
      if (availablePairCards.length < 2) continue;

      const shuffledPairCards = [...availablePairCards].sort(() => Math.random() - 0.5);
      holeCards.push(shuffledPairCards[0], shuffledPairCards[1]);

      // Track used cards
      shuffledPairCards.slice(0, 2).forEach(card => {
        usedCards.add(`${card.rank}-${card.suit}`);
      });

      // Fill board with different ranks (no trips on board initially)
      const availableOtherCards = deck.filter(card =>
        card.rank !== pairRank && !usedCards.has(`${card.rank}-${card.suit}`)
      );

      const shuffledOtherCards = [...availableOtherCards].sort(() => Math.random() - 0.5);

      for (let i = 0; i < boardCardCount && i < shuffledOtherCards.length; i++) {
        const card = shuffledOtherCards[i];
        boardCards.push(card);
        usedCards.add(`${card.rank}-${card.suit}`);
      }

      // Validate we have the right number of cards and no duplicates
      if (holeCards.length === 2 && boardCards.length === boardCardCount && usedCards.size === 2 + boardCardCount) {
        return { holeCards, boardCards };
      }
    } catch (error) {
      // Continue to next attempt
    }
  }

  // Fallback
  return generateFallbackThreeOfAKindDraw(boardCardCount);
}

function generateFallbackThreeOfAKindDraw(boardCardCount: number): { holeCards: Card[]; boardCards: Card[] } {
  const holeCards: Card[] = [
    { rank: 7, suit: 'h' }, // 7♥
    { rank: 7, suit: 'd' }  // 7♦
  ];

  const boardCards: Card[] = [
    { rank: 12, suit: 'c' }, // Q♣
    { rank: 4, suit: 's' },  // 4♠
    { rank: 10, suit: 'h' }  // 10♥
  ];

  if (boardCardCount === 4) {
    boardCards.push({ rank: 3, suit: 'd' }); // 3♦
  }

  return { holeCards, boardCards };
}

function isValidStartingHand(holeCards: Card[], boardCards: Card[]): boolean {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();
  const suitCounts = new Map<Suit, number>();

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });

  // Check that we don't start with better than a pair
  const maxCount = Math.max(...rankCounts.values());
  if (maxCount > 2) return false; // No trips or better

  // Check that we don't start with a completed straight
  if (hasCompletedStraight(allCards)) return false;

  // Check that we don't start with a completed flush
  const maxSuitCount = Math.max(...suitCounts.values());
  if (maxSuitCount >= 5) return false;

  return true;
}

function hasCompletedStraight(cards: Card[]): boolean {
  const ranks = Array.from(new Set(cards.map(c => c.rank))).sort((a, b) => a - b);

  // Check for regular straights
  for (let i = 0; i <= ranks.length - 5; i++) {
    let consecutive = 1;
    for (let j = i + 1; j < ranks.length; j++) {
      if (ranks[j] === ranks[j - 1] + 1) {
        consecutive++;
        if (consecutive >= 5) return true;
      } else {
        break;
      }
    }
  }

  // Check for wheel straight (A-2-3-4-5)
  if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
    return true;
  }

  return false;
}

// Removed calculateAllOuts - now using calculateDetailedOuts for consistency

function calculateDetailedOuts(holeCards: Card[], boardCards: Card[], deck: Deck): {
  outCards: { primary: Card[]; secondary: Card[]; total: Card[] };
  outBreakdown: { primaryOuts: number; primaryType: string; secondaryOuts: number; secondaryTypes: string[] };
} {
  const usedCards = new Set([...holeCards, ...boardCards].map(c => `${c.rank}-${c.suit}`));
  const availableDeck = deck.filter(card => !usedCards.has(`${card.rank}-${card.suit}`));

  // Calculate primary outs
  const flushOuts = getActualFlushOuts(holeCards, boardCards, availableDeck);
  const straightOuts = getActualStraightOuts(holeCards, boardCards, availableDeck);
  const fullHouseOuts = getActualFullHouseOuts(holeCards, boardCards, availableDeck);
  const twoPairOuts = getActualTwoPairOuts(holeCards, boardCards, availableDeck);
  const tripsOuts = getActualTripsOuts(holeCards, boardCards, availableDeck);

  // Find the best primary draw - prioritize by poker hand strength, then by count
  let primaryCards: Card[] = [];
  let primaryType = "";

  // Priority order: Straight Flush > Flush > Straight > Full House > Trips > Two Pair
  if (flushOuts.length >= 4) {
    primaryCards = flushOuts;
    primaryType = "Flush";
  } else if (straightOuts.length >= 4) {
    primaryCards = straightOuts;
    primaryType = "Straight";
  } else if (fullHouseOuts.length > 0) {
    primaryCards = fullHouseOuts;
    primaryType = "Full House";
  } else if (tripsOuts.length > 0) {
    primaryCards = tripsOuts;
    primaryType = "Three of a Kind";
  } else if (twoPairOuts.length > 0) {
    primaryCards = twoPairOuts;
    primaryType = "Two Pair";
  }

  // Calculate secondary outs
  const overcardOuts = getActualOvercardOuts(holeCards, boardCards, availableDeck);
  const quadOuts = getActualQuadOuts(holeCards, boardCards, availableDeck);

  const secondaryCards: Card[] = [...overcardOuts, ...quadOuts];
  const secondaryTypes: string[] = [];
  if (overcardOuts.length > 0) secondaryTypes.push("Overcards");
  if (quadOuts.length > 0) secondaryTypes.push("Four of a Kind");

  // Remove any overlap between primary and secondary
  const primaryCardKeys = new Set(primaryCards.map(c => `${c.rank}-${c.suit}`));
  const uniqueSecondaryCards = secondaryCards.filter(c => !primaryCardKeys.has(`${c.rank}-${c.suit}`));

  const totalCards = [...primaryCards, ...uniqueSecondaryCards];

  // Enforce specification limit of maximum 12 outs
  const limitedTotalCards = totalCards.slice(0, 12);
  const limitedSecondaryCards = uniqueSecondaryCards.slice(0, Math.max(0, 12 - primaryCards.length));

  return {
    outCards: {
      primary: primaryCards,
      secondary: limitedSecondaryCards,
      total: limitedTotalCards
    },
    outBreakdown: {
      primaryOuts: primaryCards.length,
      primaryType,
      secondaryOuts: limitedSecondaryCards.length,
      secondaryTypes
    }
  };
}

function getActualFlushOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const suitCounts = new Map<Suit, number>();
  const holeCardSuits = holeCards.map(c => c.suit);

  allCards.forEach(card => {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });

  // Find flush draw suit (4 cards of same suit, involving hole cards)
  for (const suit of holeCardSuits) {
    if ((suitCounts.get(suit) || 0) === 4) {
      return availableDeck.filter(card => card.suit === suit);
    }
  }

  return [];
}

function getActualStraightOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const ranks = Array.from(new Set(allCards.map(c => c.rank))).sort((a, b) => a - b);
  const straightOutsSet = new Set<string>(); // Use Set to avoid duplicates

  // Check for open-ended and gutshot opportunities
  for (let start = 2; start <= 10; start++) {
    const straightRanks = [start, start + 1, start + 2, start + 3, start + 4] as Rank[];
    const presentRanks = straightRanks.filter(rank => ranks.includes(rank));

    if (presentRanks.length >= 4) {
      // Find missing ranks
      const missingRanks = straightRanks.filter(rank => !ranks.includes(rank));
      for (const missingRank of missingRanks) {
        const outsForRank = availableDeck.filter(card => card.rank === missingRank);
        outsForRank.forEach(card => {
          straightOutsSet.add(`${card.rank}-${card.suit}`);
        });
      }
    }
  }

  // Check for wheel (A-2-3-4-5)
  const wheelRanks = [14, 2, 3, 4, 5] as Rank[]; // A-2-3-4-5
  const presentWheelRanks = wheelRanks.filter(rank => ranks.includes(rank));
  if (presentWheelRanks.length >= 4) {
    const missingWheelRanks = wheelRanks.filter(rank => !ranks.includes(rank));
    for (const missingRank of missingWheelRanks) {
      const outsForRank = availableDeck.filter(card => card.rank === missingRank);
      outsForRank.forEach(card => {
        straightOutsSet.add(`${card.rank}-${card.suit}`);
      });
    }
  }

  // Convert back to Card array
  const straightOuts: Card[] = [];
  for (const cardKey of straightOutsSet) {
    const [rankStr, suit] = cardKey.split('-');
    const rank = parseInt(rankStr) as Rank;
    straightOuts.push({ rank, suit: suit as Suit });
  }

  return straightOuts;
}

function getActualFullHouseOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  const fullHouseOuts: Card[] = [];

  // Check for trips that can become full house
  for (const [rank, count] of rankCounts) {
    if (count === 3) {
      // Need a pair to complete full house
      for (const [otherRank, otherCount] of rankCounts) {
        if (otherRank !== rank && otherCount === 1) {
          const outsForRank = availableDeck.filter(card => card.rank === otherRank);
          fullHouseOuts.push(...outsForRank);
        }
      }
    } else if (count === 2) {
      // Pair can become trips for full house
      const outsForRank = availableDeck.filter(card => card.rank === rank);
      fullHouseOuts.push(...outsForRank);
    }
  }

  return fullHouseOuts;
}

function getActualTwoPairOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();
  const holeCardRanks = holeCards.map(c => c.rank);

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  const twoPairOuts: Card[] = [];

  // If we have one pair, look for cards that make a second pair
  const pairRanks = Array.from(rankCounts.entries())
    .filter(([rank, count]) => count === 2)
    .map(([rank, count]) => rank);

  if (pairRanks.length === 1) {
    // Look for overcards that can pair
    for (const holeCardRank of holeCardRanks) {
      if (!rankCounts.has(holeCardRank) || rankCounts.get(holeCardRank) === 1) {
        const outsForRank = availableDeck.filter(card => card.rank === holeCardRank);
        twoPairOuts.push(...outsForRank);
      }
    }
  }

  return twoPairOuts;
}

function getActualTripsOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();
  const holeCardRanks = holeCards.map(c => c.rank);

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  const tripsOuts: Card[] = [];

  // Check for pairs that can become trips
  for (const holeCardRank of holeCardRanks) {
    if ((rankCounts.get(holeCardRank) || 0) === 2) {
      const outsForRank = availableDeck.filter(card => card.rank === holeCardRank);
      tripsOuts.push(...outsForRank);
    }
  }

  return tripsOuts;
}

function getActualOvercardOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  if (boardCards.length === 0) return [];

  const boardRanks = boardCards.map(c => c.rank);
  const maxBoardRank = Math.max(...boardRanks);
  const overcardOuts: Card[] = [];

  for (const holeCard of holeCards) {
    if (holeCard.rank > maxBoardRank) {
      const outsForRank = availableDeck.filter(card => card.rank === holeCard.rank);
      overcardOuts.push(...outsForRank);
    }
  }

  return overcardOuts;
}

function getActualQuadOuts(holeCards: Card[], boardCards: Card[], availableDeck: Card[]): Card[] {
  const allCards = [...holeCards, ...boardCards];
  const rankCounts = new Map<Rank, number>();

  allCards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });

  const quadOuts: Card[] = [];

  // Check for trips that can become quads
  for (const [rank, count] of rankCounts) {
    if (count === 3) {
      const outsForRank = availableDeck.filter(card => card.rank === rank);
      quadOuts.push(...outsForRank);
    }
  }

  return quadOuts;
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

  // Create the flush outs manually for fallback
  const flushOuts: Card[] = [
    { rank: 2, suit: 'h' }, { rank: 3, suit: 'h' }, { rank: 4, suit: 'h' },
    { rank: 5, suit: 'h' }, { rank: 6, suit: 'h' }, { rank: 8, suit: 'h' },
    { rank: 9, suit: 'h' }, { rank: 10, suit: 'h' }, { rank: 12, suit: 'h' }
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
    description: `You have A♥ K♥ on the flop with J♥ 7♥ 2♦. Pot: $${potAmount}, Call: $${callAmount}.`,
    outCards: {
      primary: flushOuts,
      secondary: [],
      total: flushOuts
    },
    outBreakdown: {
      primaryOuts: 9,
      primaryType: "Flush",
      secondaryOuts: 0,
      secondaryTypes: []
    }
  };
}