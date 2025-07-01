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

// Hand ranking type
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
    potOdds = callAmount > 0 ? (callAmount / (potAmount + callAmount)) * 100 : 0;
    const cardsToSee = Math.max(0, 5 - boardCards.length);
    equity = calculateEquity(outs, cardsToSee);
    isDrawAchieved = equity >= 100;
    ev = potAmount > 0 && equity > 0 ? (equity / 100) * (potAmount + callAmount) - callAmount : 0;
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