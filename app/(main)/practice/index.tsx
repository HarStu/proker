import { Text, View, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { generateCallPracticeScenario, CallPracticeScenario } from "../../../libs/poker";

export default function Practice() {
  const [scenario, setScenario] = useState<CallPracticeScenario | null>(null);

  const generateNewScenario = () => {
    const newScenario = generateCallPracticeScenario();
    setScenario(newScenario);
  };

  useEffect(() => {
    generateNewScenario();
  }, []);

  const formatCard = (card: { rank: number; suit: string }) => {
    const rank = card.rank === 11 ? 'J' :
      card.rank === 12 ? 'Q' :
        card.rank === 13 ? 'K' :
          card.rank === 14 ? 'A' :
            card.rank.toString();
    const suit = card.suit === 'h' ? '♥' :
      card.suit === 'd' ? '♦' :
        card.suit === 'c' ? '♣' : '♠';
    return `${rank}${suit}`;
  };

  if (!scenario) {
    return (
      <View className="flex-1 bg-green-100 justify-center items-center">
        <Text className="text-lg">Loading scenario...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-100 p-4">
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-center mb-2">Call Practice</Text>
        <Text className="text-lg text-center text-gray-700">Count your outs and decide: Call or Fold?</Text>
      </View>

      {/* Scenario Card */}
      <View className="bg-white rounded-lg p-6 mb-6 shadow-lg">
        {/* Hole Cards */}
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2">Your Hole Cards:</Text>
          <View className="flex-row space-x-2">
            {scenario.holeCards.map((card, index) => (
              <View key={index} className="bg-gray-100 px-3 py-2 rounded border">
                <Text className="text-xl font-bold text-center">{formatCard(card)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Board Cards */}
        <View className="mb-4">
          <Text className="text-lg font-semibold mb-2">Board:</Text>
          <View className="flex-row space-x-2">
            {scenario.boardCards.map((card, index) => (
              <View key={index} className="bg-gray-100 px-3 py-2 rounded border">
                <Text className="text-xl font-bold text-center">{formatCard(card)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pot and Call Info */}
        <View className="mb-4 bg-blue-50 p-4 rounded">
          <Text className="text-lg font-semibold mb-2">Action to You:</Text>
          <Text className="text-base mb-1">Pot Size: <Text className="font-bold">${scenario.potAmount}</Text></Text>
          <Text className="text-base">Call Amount: <Text className="font-bold">${scenario.callAmount}</Text></Text>
        </View>

        {/* Answer Section */}
        <View className="bg-gray-50 p-4 rounded mb-4">
          <Text className="text-lg font-bold mb-3">Analysis:</Text>

          <View className="mb-3">
            <Text className="text-base mb-1">Outs: <Text className="font-bold">{scenario.outs}</Text></Text>
            <Text className="text-base mb-1">Equity: <Text className="font-bold">{scenario.equity.toFixed(1)}%</Text></Text>
            <Text className="text-base mb-1">Pot Odds: <Text className="font-bold">{scenario.potOdds.toFixed(1)}%</Text></Text>
          </View>

          <View className={`p-3 rounded ${scenario.correctDecision === 'call' ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-lg font-bold text-center ${scenario.correctDecision === 'call' ? 'text-green-800' : 'text-red-800'}`}>
              Correct Decision: {scenario.correctDecision.toUpperCase()}
            </Text>
          </View>

          <View className="mt-3">
            <Text className="text-sm text-gray-600">
              {scenario.correctDecision === 'call'
                ? `Your equity (${scenario.equity.toFixed(1)}%) is greater than the pot odds (${scenario.potOdds.toFixed(1)}%), making this a profitable call.`
                : `Your equity (${scenario.equity.toFixed(1)}%) is less than the pot odds (${scenario.potOdds.toFixed(1)}%), making this an unprofitable call. You should fold.`
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Refresh Button */}
      <Pressable
        className="bg-blue-600 py-4 px-6 rounded-lg"
        onPress={generateNewScenario}
      >
        <Text className="text-white font-bold text-lg text-center">Generate New Scenario</Text>
      </Pressable>
    </View>
  );
} 