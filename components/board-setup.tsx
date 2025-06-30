import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import CardPicker from "@/components/card-picker";
import type { Card, Deck } from "@/libs/poker";
import { generateDeck } from "@/libs/poker";

interface BoardSetupProps {
  /**
   * Callback fired whenever the selection changes.
   * selected – array of cards currently picked (hole + board)
   * unselected – current remaining deck
   */
  onChange?: (selected: Card[], unselected: Deck) => void;
}

export default function BoardSetup({ onChange }: BoardSetupProps) {
  // Remaining deck
  const [deck, setDeck] = useState<Deck>(generateDeck());
  // Community (board) cards: flop(3) + turn(1) – keeping river excluded for now
  const [boardCards, setBoardCards] = useState<(Card | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  // Player hole cards
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([null, null]);

  /** Notify parent with current selected + unselected */
  const notifyChange = (
    nextDeck: Deck,
    nextBoard: (Card | null)[],
    nextHole: (Card | null)[]
  ) => {
    if (!onChange) return;
    const selected: Card[] = [
      ...nextBoard.filter(Boolean),
      ...nextHole.filter(Boolean),
    ] as Card[];
    onChange(selected, nextDeck);
  };

  const handleCardPicked = (index: number, isHoleCard: boolean) => (card: Card) => {
    // Remove picked card from deck
    const nextDeck = deck.filter(
      (c) => !(c.rank === card.rank && c.suit === card.suit)
    );
    setDeck(nextDeck);

    if (isHoleCard) {
      const nextHole = [...holeCards];
      nextHole[index] = card;
      setHoleCards(nextHole);
      notifyChange(nextDeck, boardCards, nextHole);
    } else {
      const nextBoard = [...boardCards];
      nextBoard[index] = card;
      setBoardCards(nextBoard);
      notifyChange(nextDeck, nextBoard, holeCards);
    }
  };

  const returnCard = (card: Card, index: number, isHoleCard: boolean) => {
    const nextDeck: Deck = [...deck, card];
    setDeck(nextDeck);

    if (isHoleCard) {
      const nextHole = [...holeCards];
      nextHole[index] = null;
      setHoleCards(nextHole);
      notifyChange(nextDeck, boardCards, nextHole);
    } else {
      const nextBoard = [...boardCards];
      nextBoard[index] = null;
      setBoardCards(nextBoard);
      notifyChange(nextDeck, nextBoard, holeCards);
    }
  };

  const renderCard = (card: Card) => {
    const suitSymbol = { h: "♥", d: "♦", c: "♣", s: "♠" }[card.suit];
    const rankSymbol = ({ 11: "J", 12: "Q", 13: "K", 14: "A" } as Record<
      number,
      string
    >)[card.rank] || card.rank;
    const color =
      {
        h: "text-red-500",
        d: "text-blue-500",
        c: "text-green-600",
        s: "text-black",
      }[card.suit] || "text-black";

    return (
      <Text className={`text-2xl ${color}`}>{`${rankSymbol}${suitSymbol}`}</Text>
    );
  };

  return (
    <View className="p-4">
      {/* Board cards */}
      <View className="flex-row justify-center mb-8">
        {/* Flop */}
        <View>
          <Text className="text-xs text-center text-black">the flop</Text>
          <View className="flex-row gap-4">
            {boardCards.slice(0, 3).map((card, index) => (
              <View key={index}>
                {card === null ? (
                  <CardPicker
                    deck={deck}
                    onCardPicked={handleCardPicked(index, false)}
                  />
                ) : (
                  <Pressable
                    className="w-20 h-28 bg-white border-2 border-gray-300 rounded-xl shadow-md justify-center items-center"
                    onPress={() => returnCard(card, index, false)}
                  >
                    {renderCard(card)}
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Turn */}
        <View className="ml-8">
          <Text className="text-xs text-center text-black">the turn</Text>
          {boardCards.slice(3, 4).map((card, index) => (
            <View key={index}>
              {card === null ? (
                // Only show CardPicker if all 3 flop cards are selected
                boardCards.slice(0, 3).every(card => card !== null) ? (
                  <CardPicker
                    deck={deck}
                    onCardPicked={handleCardPicked(3, false)}
                  />
                ) : (
                  <View className="w-20 h-28 bg-gray-200 border-2 border-gray-300 rounded-xl opacity-50 justify-center items-center">
                    <Text className="text-xs text-black">Locked</Text>
                  </View>
                )
              ) : (
                <Pressable
                  className="w-20 h-28 bg-white border-2 border-gray-300 rounded-xl shadow-md justify-center items-center"
                  onPress={() => returnCard(card, 3, false)}
                >
                  {renderCard(card)}
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Hole cards */}
      <View>
        <Text className="text-xs text-center text-black">your cards</Text>
        <View className="flex-row justify-center gap-4">
          {holeCards.map((card, index) => (
            <View key={index}>
              {card === null ? (
                <CardPicker
                  deck={deck}
                  onCardPicked={handleCardPicked(index, true)}
                />
              ) : (
                <Pressable
                  className="w-20 h-28 bg-white border-2 border-gray-300 rounded-xl shadow-md justify-center items-center"
                  onPress={() => returnCard(card, index, true)}
                >
                  {renderCard(card)}
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
} 