import { Text, View, Pressable, Modal } from "react-native";
import { useState } from "react";

interface HandPickerProps {
  /**
   * Callback fired when a hand is selected.
   */
  onHandSelected?: (hand: string) => void;
}

export default function HandPicker({ onHandSelected }: HandPickerProps) {
  const [selectedHand, setSelectedHand] = useState<string>("");
  const [isHandPickerOpen, setIsHandPickerOpen] = useState(false);

  const hands = [
    "Royal Flush",
    "Straight Flush",
    "Four of a Kind",
    "Full House",
    "Flush",
    "Straight",
    "Three of a Kind",
    "Two Pair",
    "Pair",
    "High Card"
  ];

  const handleHandSelect = (hand: string) => {
    setSelectedHand(hand);
    setIsHandPickerOpen(false);
    onHandSelected?.(hand);
  };

  return (
    <View className="mt-4 p-4 bg-green-100 rounded-lg">
      <Text className="text-base font-bold mb-4 text-black">What hand are you drawing to?</Text>
      <Pressable
        className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50"
        onPress={() => setIsHandPickerOpen(true)}
      >
        <Text className={selectedHand ? "text-black" : "text-gray-500"}>
          {selectedHand || "Select a hand..."}
        </Text>
      </Pressable>

      {/* Hand Picker Modal */}
      <Modal
        visible={isHandPickerOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsHandPickerOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-green-100 rounded-t-xl p-4">
            <Text className="text-base font-bold mb-4 text-center text-black">Select Hand</Text>
            {hands.map((hand) => (
              <Pressable
                key={hand}
                className="p-4 border-b border-gray-200"
                onPress={() => handleHandSelect(hand)}
              >
                <Text className="text-base text-black">{hand}</Text>
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
    </View>
  );
} 