import { Text, View, Animated } from "react-native";
import React from "react";
import type { Card, HandRanking } from "@/libs/poker";
import { calculatePotOdds, countOuts, calculateEquity } from "@/libs/poker";
import { useEffect, useRef } from "react";

interface CalcResultProps {
  /**
   * Selected board and hole cards
   */
  selectedCards: Card[];
  /**
   * Remaining deck after cards are selected
   */
  remainingDeck: Card[];
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
  remainingDeck,
  targetHand,
  potAmount,
  callAmount,
  isCashValid
}: CalcResultProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Separate hole cards and board cards properly
  // BoardSetup returns cards in order: board cards first, then hole cards last
  const totalCards = selectedCards.length;
  const holeCards = totalCards >= 2 ? selectedCards.slice(-2) : []; // Last 2 cards are hole cards
  const boardCards = totalCards > 2 ? selectedCards.slice(0, -2) : []; // Rest are board cards

  // Calculate pot odds
  const potOdds = calculatePotOdds(potAmount, callAmount);

  // Calculate equity with validation
  let equity = 0;
  const hasRequiredCards = holeCards.length === 2;
  const hasValidFlop = boardCards.length === 0 || boardCards.length >= 3;
  const isValidSetup = hasRequiredCards && hasValidFlop && targetHand && isCashValid;

  if (isValidSetup) {
    const outs = countOuts(holeCards, boardCards, targetHand as HandRanking, remainingDeck);
    const cardsToSee = Math.max(0, 5 - boardCards.length); // Cards still to come
    equity = calculateEquity(outs, cardsToSee);
  }

  // Calculate expected value
  const ev = isValidSetup && potAmount > 0 && equity > 0 ?
    (equity / 100) * (potAmount + callAmount) - callAmount : 0;

  // Animation when results update
  useEffect(() => {
    if (hasRequiredCards && hasValidFlop && targetHand && isCashValid) {
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
  }, [equity, potOdds, ev, scaleAnim]);

  const isDrawAchieved = equity >= 100;

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }] }}
      className="p-3 bg-green-100 rounded-lg"
    >
      <Text className="text-sm font-bold mb-2 text-center text-black">Results</Text>

      <View className="flex-row justify-between">
        {/* Pot Odds / Call Cost */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">{isDrawAchieved ? "Call %" : "Pot Odds"}</Text>
          <Text className="text-lg font-bold text-black">
            {isValidSetup ? `${potOdds.toFixed(1)}%` : "---"}
          </Text>
        </View>

        {/* Equity */}
        <View className="flex-1 items-center">
          <Text className="text-xs text-black">Equity</Text>
          {!isValidSetup ? (
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
          <Text className={`text-lg font-bold ${isValidSetup && ev >= 0 ? 'text-green-600' : isValidSetup && ev < 0 ? 'text-red-600' : 'text-black'}`}>
            {isValidSetup ? `${ev >= 0 ? '+' : ''}${ev.toFixed(1)}` : "---"}
          </Text>
        </View>
      </View>

      {/* Status Messages */}
      <View className="mt-2 items-center h-6">
        {(!isCashValid || !hasRequiredCards || !hasValidFlop || !targetHand) ? (
          <>
            {!isCashValid && (
              <Text className="text-xs text-black">⚠️ Invalid amounts</Text>
            )}
            {!hasRequiredCards && (
              <Text className="text-xs text-black">ℹ️ Need 2 hole cards</Text>
            )}
            {!hasValidFlop && boardCards.length > 0 && (
              <Text className="text-xs text-black">ℹ️ Complete the flop (3 cards)</Text>
            )}
            {!targetHand && hasRequiredCards && hasValidFlop && (
              <Text className="text-xs text-black">ℹ️ Select target hand</Text>
            )}
          </>
        ) : (
          <Text className="text-xs text-black opacity-0">Placeholder</Text>
        )}
      </View>
    </Animated.View>
  );
} 