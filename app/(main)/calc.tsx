import { Text, View } from "react-native";
import { useState } from "react";
import { Deck, Card, generateDeck } from "@/libs/poker";
import CardPicker from "@/components/card-picker";

export default function Calc() {
  const [deck, setDeck] = useState<Deck>(generateDeck());
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const handleCardPicked = (card: Card) => {
    // Remove the selected card from the deck
    setDeck(deck.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    setSelectedCards([...selectedCards, card]);
    console.log(selectedCards);
  };

  return (
    <View className="flex-1 bg-green-100">
      <Text>Calc</Text>
      <CardPicker deck={deck} onCardPicked={handleCardPicked} />
    </View>
  );
}
