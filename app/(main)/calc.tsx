import { Text, View, Pressable, Modal, ScrollView } from "react-native";
import BoardSetup from "@/components/board-setup";
import type { Card, Deck } from "@/libs/poker";
import { useState } from "react";

export default function Calc() {
  const [selectedHand, setSelectedHand] = useState<string>("");
  const [isHandPickerOpen, setIsHandPickerOpen] = useState(false);

  const hands = [
    "High Card",
    "Pair",
    "Two Pair",
    "Three of a Kind",
    "Straight",
    "Flush",
    "Full House",
    "Four of a Kind",
    "Straight Flush",
    "Royal Flush"
  ];

  const handleChange = (selected: Card[], remaining: Deck) => {
    // For now, just log – parent can use as needed
    console.log("selected", selected);
    console.log("remaining", remaining.length);
  };

  return (
    <ScrollView className="flex-1 bg-green-100">
      <View className="p-4">
        <Text className="text-xl font-bold mb-4">Calc</Text>
        <BoardSetup onChange={handleChange} />

        {/* Hand Selection */}
        <View className="mt-8 p-4 bg-white rounded-lg">
          <Text className="text-lg font-bold mb-4">What hand are you drawing to?</Text>
          <Pressable
            className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50"
            onPress={() => setIsHandPickerOpen(true)}
          >
            <Text className={selectedHand ? "text-black" : "text-gray-500"}>
              {selectedHand || "Select a hand..."}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Hand Picker Modal */}
      <Modal
        visible={isHandPickerOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHandPickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-xl p-4">
            <Text className="text-lg font-bold mb-4 text-center">Select Hand</Text>
            {hands.map((hand) => (
              <Pressable
                key={hand}
                className="p-4 border-b border-gray-200"
                onPress={() => {
                  setSelectedHand(hand);
                  setIsHandPickerOpen(false);
                }}
              >
                <Text className="text-lg">{hand}</Text>
              </Pressable>
            ))}
            <Pressable
              className="p-4 mt-2"
              onPress={() => setIsHandPickerOpen(false)}
            >
              <Text className="text-center text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
