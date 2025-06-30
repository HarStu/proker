import { Text, View } from "react-native";
import BoardSetup from "@/components/board-setup";
import type { Card, Deck } from "@/libs/poker";

export default function Calc() {
  const handleChange = (selected: Card[], remaining: Deck) => {
    // For now, just log – parent can use as needed
    console.log("selected", selected);
    console.log("remaining", remaining.length);
  };

  return (
    <View className="flex-1 bg-green-100 p-4">
      <Text className="text-xl font-bold mb-4">Calc</Text>
      <BoardSetup onChange={handleChange} />
    </View>
  );
}
