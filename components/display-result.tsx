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
    >
      <View className="flex-row justify-between">
        {/* Outs */}
        <View className="flex-1 items-center">
          <Text className="text-xs font-semibold mb-1">Outs</Text>
          <Text className="text-lg font-bold">
            {canShowOuts ? outs : "---"}
          </Text>
        </View>
        {/* Pot Odds / Call Cost */}
        <View className="flex-1 items-center">
          <Text className="text-xs font-semibold mb-1">{isDrawAchieved ? "Call %" : "Pot Odds"}</Text>
          <Text className="text-lg font-bold">
            {canShowFullResults ? `${potOdds.toFixed(1)}:1` : "---"}
          </Text>
        </View>
        {/* Equity */}
        <View className="flex-1 items-center">
          <Text className="text-xs font-semibold mb-1">Equity</Text>
          {!canShowFullResults ? (
            <Text className="text-lg font-bold">---</Text>
          ) : isDrawAchieved ? (
            <Text className="text-lg font-bold">Draw Achieved</Text>
          ) : (
            <Text className="text-lg font-bold">
              {equity.toFixed(1)}%
            </Text>
          )}
        </View>
        {/* Expected Value / Guaranteed Profit */}
        <View className="flex-1 items-center">
          <Text className="text-xs font-semibold mb-1">{isDrawAchieved ? "Profit" : "EV"}</Text>
          <Text className={`text-lg font-bold ${canShowFullResults && ev >= 0 ? 'text-green-700' : canShowFullResults && ev < 0 ? 'text-red-700' : ''}`}>
            {canShowFullResults ? `${ev >= 0 ? '+' : ''}${ev.toFixed(1)}` : "---"}
          </Text>
        </View>
      </View>
      {/* Status Message */}
      {statusMessages.length > 0 && (
        <View className="mt-2">
          <Text className="text-xs text-center text-gray-600">{statusMessages[0]}</Text>
        </View>
      )}
    </Animated.View>
  );
} 