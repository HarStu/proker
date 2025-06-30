import { Text, View } from "react-native";
import type { Card } from "@/libs/poker";

interface CalcResultProps {
  /**
   * Selected board and hole cards
   */
  selectedCards: Card[];
  /**
   * Target hand the player is drawing to
   */
  targetHand: string;
  /**
   * Chips in the pot
   */
  potAmount: number;
  /**
   * Chips needed to call
   */
  callAmount: number;
  /**
   * Whether the cash values are valid
   */
  isCashValid: boolean;
}

export default function CalcResult({
  selectedCards,
  targetHand,
  potAmount,
  callAmount,
  isCashValid
}: CalcResultProps) {
  // Placeholder calculations - these would be replaced with actual poker math
  const potOdds = callAmount > 0 ? (callAmount / (potAmount + callAmount)) * 100 : 0;
  const equity = 25.5; // Placeholder - would calculate based on cards and target hand
  const ev = isCashValid ? (equity / 100) * potAmount - callAmount : 0;

  return (
    <View className="p-3 bg-green-100 rounded-lg">
      <Text className="text-sm font-bold mb-2 text-center">Results</Text>

      <View className="flex-row justify-between">
        {/* Pot Odds */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-600">Pot Odds</Text>
          <Text className="text-lg font-bold">
            {potOdds.toFixed(1)}%
          </Text>
        </View>

        {/* Equity */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-600">Equity</Text>
          <Text className="text-lg font-bold">
            {equity.toFixed(1)}%
          </Text>
        </View>

        {/* Expected Value */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-gray-600">EV</Text>
          <Text className={`text-lg font-bold ${ev >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {ev >= 0 ? '+' : ''}{ev.toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Status Messages */}
      {(!isCashValid || selectedCards.length < 2) && (
        <View className="mt-2 items-center">
          {!isCashValid && (
            <Text className="text-red-600 text-xs">⚠️ Invalid amounts</Text>
          )}
          {selectedCards.length < 2 && (
            <Text className="text-yellow-600 text-xs">ℹ️ Need 2+ cards</Text>
          )}
        </View>
      )}
    </View>
  );
} 