import { Text, View, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import type { PokerCalcResult } from "@/libs/poker";

interface DisplayResultProps {
  result: PokerCalcResult;
}

export default function DisplayResult({ result }: DisplayResultProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { potOdds, equity, ev, isDrawAchieved, isValidSetup, statusMessages, outs, canShowOuts, canShowFullResults } = result;

  useEffect(() => {
    if (isValidSetup) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [equity, potOdds, ev, scaleAnim, isValidSetup]);

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }] }}
      className="p-3 bg-green-100 rounded-lg"
    >
      <Text className="text-sm font-bold mb-2 text-center text-black">Results</Text>
      <View className="flex-row justify-between">
        {/* Outs */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">Outs</Text>
          <Text className="text-lg font-bold text-black">
            {canShowOuts ? outs : "---"}
          </Text>
        </View>
        {/* Pot Odds / Call Cost */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">{isDrawAchieved ? "Call %" : "Pot Odds"}</Text>
          <Text className="text-lg font-bold text-black">
            {canShowFullResults ? `${potOdds.toFixed(1)}%` : "---"}
          </Text>
        </View>
        {/* Equity */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">Equity</Text>
          {!canShowFullResults ? (
            <Text className="text-lg font-bold text-black">---</Text>
          ) : isDrawAchieved ? (
            <Text className="text-lg font-bold text-black">Draw Achieved</Text>
          ) : (
            <Text className="text-lg font-bold text-black">
              {equity.toFixed(1)}%
            </Text>
          )}
        </View>
        {/* Expected Value / Guaranteed Profit */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">{isDrawAchieved ? "Profit" : "EV"}</Text>
          <Text className={`text-lg font-bold ${canShowFullResults && ev >= 0 ? 'text-green-600' : canShowFullResults && ev < 0 ? 'text-red-600' : 'text-black'}`}>
            {canShowFullResults ? `${ev >= 0 ? '+' : ''}${ev.toFixed(1)}` : "---"}
          </Text>
        </View>
      </View>
      {/* Status Message */}
      <View className="mt-2 items-center h-6">
        {statusMessages.length > 0 ? (
          <Text className="text-xs text-black">{statusMessages[0]}</Text>
        ) : (
          <Text className="text-xs text-black opacity-0">Placeholder</Text>
        )}
      </View>
    </Animated.View>
  );
} 