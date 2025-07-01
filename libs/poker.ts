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