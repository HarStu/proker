import { Text, View } from "react-native";
import BoardSetup from "@/components/board-setup";
import HandPicker from "@/components/hand-picker";
import CashSelector from "@/components/cash-selector";
import CalcResult from "@/components/calc-result";
import type { Card, Deck } from "@/libs/poker";
import { useState } from "react";

export default function Calc() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [targetHand, setTargetHand] = useState<string>("");
  const [potAmount, setPotAmount] = useState<number>(0);
  const [callAmount, setCallAmount] = useState<number>(0);
  const [isCashValid, setIsCashValid] = useState<boolean>(true);

  const handleBoardChange = (selected: Card[], remaining: Deck) => {
    setSelectedCards(selected);
    console.log("selected", selected);
    console.log("remaining", remaining.length);
  };

  const handleHandSelected = (hand: string) => {
    setTargetHand(hand);
    console.log("selected hand:", hand);
  };

  const handleCashChange = (pot: number, call: number, isValid: boolean) => {
    setPotAmount(pot);
    setCallAmount(call);
    setIsCashValid(isValid);
    console.log("pot:", pot, "call:", call, "valid:", isValid);
  };

  return (
    <View className="flex-1 bg-green-100">
      <View className="pt-20 px-4 pb-4">
        {/* Results at the top */}
        <CalcResult
          selectedCards={selectedCards}
          targetHand={targetHand}
          potAmount={potAmount}
          callAmount={callAmount}
          isCashValid={isCashValid}
        />

        {/* Setup components */}
        <BoardSetup onChange={handleBoardChange} />
        <HandPicker onHandSelected={handleHandSelected} />
        <CashSelector onChange={handleCashChange} />
      </View>
    </View>
  );
}
