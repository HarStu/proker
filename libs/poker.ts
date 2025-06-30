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

// Detect what hand we currently have
export function getCurrentHandRanking(cards: Card[]): HandRanking {
  if (cards.length < 5) {
    // For incomplete hands, check what we have so far
    if (hasFourOfAKind(cards)) return "Four of a Kind";
    if (hasFullHouse(cards)) return "Full House";
    if (hasFlush(cards)) return "Flush";
    if (hasStraight(cards)) return "Straight";
    if (hasThreeOfAKind(cards)) return "Three of a Kind";
    if (hasTwoPair(cards)) return "Two Pair";
    if (hasPair(cards)) return "Pair";
    return "High Card";
  }

  // Full 5-card hand evaluation
  if (isRoyalFlush(cards)) return "Royal Flush";
  if (isStraightFlush(cards)) return "Straight Flush";
  if (hasFourOfAKind(cards)) return "Four of a Kind";
  if (hasFullHouse(cards)) return "Full House";
  if (hasFlush(cards)) return "Flush";
  if (hasStraight(cards)) return "Straight";
  if (hasThreeOfAKind(cards)) return "Three of a Kind";
  if (hasTwoPair(cards)) return "Two Pair";
  if (hasPair(cards)) return "Pair";
  return "High Card";
}

// Count outs for specific hand types
export function countOuts(holeCards: Card[], boardCards: Card[], targetHand: HandRanking, remainingDeck: Deck): number {
  // Must have exactly 2 hole cards
  if (holeCards.length !== 2) return 0;

  // If any flop cards are selected, all 3 must be selected
  if (boardCards.length > 0 && boardCards.length < 3) return 0;

  const allKnownCards = [...holeCards, ...boardCards];
  const currentHand = getCurrentHandRanking(allKnownCards);

  // If we already have the target hand or better, we have 100% equity
  const handRankings: HandRanking[] = [
    "High Card", "Pair", "Two Pair", "Three of a Kind", "Straight",
    "Flush", "Full House", "Four of a Kind", "Straight Flush", "Royal Flush"
  ];

  const currentRank = handRankings.indexOf(currentHand);
  const targetRank = handRankings.indexOf(targetHand);

  if (currentRank >= targetRank) {
    // We already have the target hand or better - return outs for 100% equity
    const cardsToSee = 5 - boardCards.length;
    if (cardsToSee === 2) return 25; // 25 outs * 4 = 100%
    if (cardsToSee === 1) return 50; // 50 outs * 2 = 100%
    return 25; // Default to 100% equity
  }

  const suits = new Map<Suit, number>();
  const ranks = new Map<Rank, number>();

  // Count suits and ranks
  allKnownCards.forEach(card => {
    suits.set(card.suit, (suits.get(card.suit) || 0) + 1);
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });

  let outs = 0;

  switch (targetHand) {
    case "Pair":
      // If no pair yet, count cards that would pair with hole cards
      if (!hasPair(allKnownCards)) {
        for (const holeCard of holeCards) {
          // 3 cards of same rank remain (4 total - 1 in hand)
          outs += Math.max(0, 3 - (ranks.get(holeCard.rank) || 0) + 1);
        }
      }
      break;

    case "Two Pair":
      if (hasPair(allKnownCards) && !hasTwoPair(allKnownCards)) {
        // Need to pair the other hole card
        const pairedRank = getPairedRank(allKnownCards);
        for (const holeCard of holeCards) {
          if (holeCard.rank !== pairedRank) {
            outs += Math.max(0, 3 - (ranks.get(holeCard.rank) || 0) + 1);
          }
        }
      }
      break;

    case "Three of a Kind":
      // Count trips possibilities
      for (const [rank, count] of ranks) {
        if (count === 2) {
          outs += Math.max(0, 2); // 2 more cards of same rank
        }
      }
      break;

    case "Straight":
      outs = countStraightOuts(allKnownCards, remainingDeck);
      break;

    case "Flush":
      // Count flush draws
      for (const [suit, count] of suits) {
        if (count >= 4) {
          // Count remaining cards of this suit
          outs += remainingDeck.filter(card => card.suit === suit).length;
        }
      }
      break;

    default:
      // For other hands, return a conservative estimate
      // Preflop: more outs available, postflop: fewer outs
      if (boardCards.length === 0) {
        // Preflop - more possibilities
        outs = Math.max(0, 8 - handRankings.indexOf(targetHand) * 2);
      } else {
        // Postflop - fewer possibilities
        outs = Math.max(0, 6 - boardCards.length * 2);
      }
  }

  return Math.min(outs, remainingDeck.length);
}

// Calculate equity percentage based on outs
export function calculateEquity(outs: number, cardsToSee: number): number {
  if (outs <= 0 || cardsToSee <= 0) return 0;

  // Rule of 4 and 2: multiply outs by 4 for turn+river, by 2 for river only
  const multiplier = cardsToSee === 2 ? 4 : cardsToSee === 1 ? 2 : 2;
  return Math.min(outs * multiplier, 100);
}

// Helper functions
function hasPair(cards: Card[]): boolean {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  return Array.from(ranks.values()).some(count => count >= 2);
}

function hasTwoPair(cards: Card[]): boolean {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  const pairs = Array.from(ranks.values()).filter(count => count >= 2);
  return pairs.length >= 2;
}

function hasThreeOfAKind(cards: Card[]): boolean {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  return Array.from(ranks.values()).some(count => count >= 3);
}

function hasFourOfAKind(cards: Card[]): boolean {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  return Array.from(ranks.values()).some(count => count >= 4);
}

function hasFullHouse(cards: Card[]): boolean {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  const counts = Array.from(ranks.values());
  return counts.includes(3) && counts.includes(2);
}

function hasFlush(cards: Card[]): boolean {
  const suits = new Map<Suit, number>();
  cards.forEach(card => {
    suits.set(card.suit, (suits.get(card.suit) || 0) + 1);
  });
  return Array.from(suits.values()).some(count => count >= 5);
}

function hasStraight(cards: Card[]): boolean {
  if (cards.length < 5) return false;
  const ranks = Array.from(new Set(cards.map(card => card.rank))).sort((a, b) => a - b);

  // Check for 5 consecutive ranks
  for (let i = 0; i <= ranks.length - 5; i++) {
    let consecutive = true;
    for (let j = 1; j < 5; j++) {
      if (ranks[i + j] !== ranks[i] + j) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }

  // Check for A-2-3-4-5 straight
  if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3) && ranks.includes(4) && ranks.includes(5)) {
    return true;
  }

  return false;
}

function isStraightFlush(cards: Card[]): boolean {
  return hasStraight(cards) && hasFlush(cards);
}

function isRoyalFlush(cards: Card[]): boolean {
  if (!hasFlush(cards)) return false;
  const ranks = cards.map(card => card.rank).sort((a, b) => a - b);
  return ranks.includes(10) && ranks.includes(11) && ranks.includes(12) && ranks.includes(13) && ranks.includes(14);
}

function getPairedRank(cards: Card[]): Rank | null {
  const ranks = new Map<Rank, number>();
  cards.forEach(card => {
    ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
  });
  for (const [rank, count] of ranks) {
    if (count >= 2) return rank;
  }
  return null;
}

function countStraightOuts(cards: Card[], remainingDeck: Deck): number {
  // Simplified straight out counting - would need more complex logic for all cases
  const ranks = Array.from(new Set(cards.map(card => card.rank))).sort((a, b) => a - b);
  let outs = 0;

  // Check for open-ended straight draws (simplified)
  if (ranks.length >= 4) {
    const gaps = [];
    for (let i = 1; i < ranks.length; i++) {
      if (ranks[i] - ranks[i - 1] === 1) continue;
      if (ranks[i] - ranks[i - 1] === 2) gaps.push(ranks[i - 1] + 1);
    }

    // Count outs for gaps
    gaps.forEach(missingRank => {
      outs += remainingDeck.filter(card => card.rank === missingRank as Rank).length;
    });

    // Add outs for extending the sequence
    const minRank = Math.min(...ranks);
    const maxRank = Math.max(...ranks);
    if (minRank > 2) {
      outs += remainingDeck.filter(card => card.rank === (minRank - 1) as Rank).length;
    }
    if (maxRank < 14) {
      outs += remainingDeck.filter(card => card.rank === (maxRank + 1) as Rank).length;
    }
  }

  return outs;
}