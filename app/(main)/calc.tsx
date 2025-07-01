import { Text, View } from "react-native";
import BoardSetup from "@/components/board-setup";
import HandPicker from "@/components/hand-picker";
import CashSelector from "@/components/cash-selector";
import DisplayResult from "@/components/display-result";
import { calculateResult } from "@/libs/poker";
import type { Card, Deck } from "@/libs/poker";
import { useState } from "react";

export default function Calc() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [remainingDeck, setRemainingDeck] = useState<Deck>([]);
  const [targetHand, setTargetHand] = useState<string>("");
  const [potAmount, setPotAmount] = useState<number>(0);
  const [callAmount, setCallAmount] = useState<number>(0);
  const [isCashValid, setIsCashValid] = useState<boolean>(true);

  // Split board and hole cards for calculation
  const totalCards = selectedCards.length;
  const holeCards = totalCards >= 2 ? selectedCards.slice(-2) : [];
  const boardCards = totalCards > 2 ? selectedCards.slice(0, -2) : [];

  const result = calculateResult({
    holeCards,
    boardCards,
    remainingDeck,
    targetHand,
    potAmount,
    callAmount,
    isCashValid
  });

  const handleBoardChange = (selected: Card[], remaining: Deck) => {
    setSelectedCards(selected);
    setRemainingDeck(remaining);
  };

  return (
    <View className="flex-1 bg-green-100">
      {/* Header */}
      <View className="pt-16 px-4 pb-4">
        <Text className="text-2xl font-bold text-center mb-2">Poker Calculator</Text>
        <Text className="text-sm text-center text-gray-600">Calculate your odds and expected value</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-end px-4 pb-8">
        {/* Results Card */}
        <View className="bg-white rounded-lg p-4 shadow-lg mb-4">
          <DisplayResult result={result} />
        </View>

        {/* Setup Sections */}
        <View className="bg-white rounded-lg p-4 shadow-lg">
          <BoardSetup onChange={handleBoardChange} />
          <HandPicker onHandSelected={setTargetHand} />
          <CashSelector onChange={(pot, call, valid) => {
            setPotAmount(pot);
            setCallAmount(call);
            setIsCashValid(valid);
          }} />
        </View>
      </View>
    </View>
  );
}
