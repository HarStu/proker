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
  // Must have exactly 2 hole cards
  if (holeCards.length !== 2) return 0;

  // If any flop cards are selected, all 3 must be selected
  if (boardCards.length > 0 && boardCards.length < 3) return 0;

  const allKnownCards = [...holeCards, ...boardCards];
  // For simplicity, only implement pair/trips logic for now
  let outs = 0;
  switch (targetHand) {
    case "Pair":
      // If no pair yet, count cards that would pair with hole cards
      const ranks = new Map<Rank, number>();
      allKnownCards.forEach(card => {
        ranks.set(card.rank, (ranks.get(card.rank) || 0) + 1);
      });
      for (const holeCard of holeCards) {
        if ((ranks.get(holeCard.rank) || 0) < 2) {
          outs += 3; // 3 cards left of that rank
        }
      }
      break;
    case "Three of a Kind":
      // If you have a pair, need one more; if not, need two
      const rankCounts = new Map<Rank, number>();
      allKnownCards.forEach(card => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });
      for (const holeCard of holeCards) {
        const count = rankCounts.get(holeCard.rank) || 0;
        if (count === 2) outs += 2; // 2 left
        else if (count === 1) outs += 2; // need to hit twice, rough estimate
      }
      break;
    default:
      outs = 6; // fallback
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

export interface PokerCalcResult {
  outs: number;
  potOdds: number;
  equity: number;
  ev: number;
  isDrawAchieved: boolean;
  isValidSetup: boolean;
  statusMessages: string[];
}