import { Text, View, Pressable } from "react-native";
import { useState } from "react";
import { Deck, Card, generateDeck } from "@/libs/poker";
import CardPicker from "@/components/card-picker";

export default function Calc() {
  const [deck, setDeck] = useState<Deck>(generateDeck());
  const [boardCards, setBoardCards] = useState<(Card | null)[]>([null, null, null, null]);
  const [holeCards, setHoleCards] = useState<(Card | null)[]>([null, null]);

  const handleCardPicked = (index: number, isHoleCard: boolean) => (card: Card) => {
    setDeck(deck.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    if (isHoleCard) {
      const newHoleCards = [...holeCards];
      newHoleCards[index] = card;
      setHoleCards(newHoleCards);
    } else {
      const newBoardCards = [...boardCards];
      newBoardCards[index] = card;
      setBoardCards(newBoardCards);
    }
  };

  const returnCard = (card: Card, index: number, isHoleCard: boolean) => {
    setDeck([...deck, card]);
    if (isHoleCard) {
      const newHoleCards = [...holeCards];
      newHoleCards[index] = null;
      setHoleCards(newHoleCards);
    } else {
      const newBoardCards = [...boardCards];
      newBoardCards[index] = null;
      setBoardCards(newBoardCards);
    }
  };

  const renderCard = (card: Card) => {
    const suitSymbol = { h: '♥', d: '♦', c: '♣', s: '♠' }[card.suit];
    const rankSymbol = ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as Record<number, string>)[card.rank] || card.rank;
    const color = {
      h: 'text-red-500',
      d: 'text-blue-500',
      c: 'text-green-600',
      s: 'text-black'
    }[card.suit];

    return (
      <Text className={`text-2xl ${color}`}>
        {rankSymbol}{suitSymbol}
      </Text>
    );
  };

  return (
    <View className="flex-1 bg-green-100 p-4">
      <Text className="text-xl font-bold mb-4">Calc</Text>

      {/* Board cards row */}
      <View className="flex-row justify-center mb-8">
        {/* Flop group */}
        <View>
          <Text className="text-xs mb-1 text-center">the flop</Text>
          <View className="flex-row gap-4">
            {boardCards.slice(0, 3).map((card, index) => (
              <View key={index}>
                {card === null ? (
                  <CardPicker deck={deck} onCardPicked={handleCardPicked(index, false)} />
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

        {/* Turn card */}
        <View className="ml-8">
          <Text className="text-xs mb-1 text-center">the turn</Text>
          {boardCards.slice(3, 4).map((card, index) => (
            <View key={index}>
              {card === null ? (
                <CardPicker deck={deck} onCardPicked={handleCardPicked(3, false)} />
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

      {/* Hole cards row */}
      <View>
        <Text className="text-xs mb-1 text-center">your cards</Text>
        <View className="flex-row justify-center gap-4">
          {holeCards.map((card, index) => (
            <View key={index}>
              {card === null ? (
                <CardPicker deck={deck} onCardPicked={handleCardPicked(index, true)} />
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
