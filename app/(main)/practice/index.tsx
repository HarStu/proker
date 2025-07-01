import { Text, View, Pressable, ScrollView, Animated, Dimensions } from "react-native";
import { useState, useEffect, useRef } from "react";
import { generateCallPracticeScenario, CallPracticeScenario } from "../../../libs/poker";

type GamePhase = 'decision' | 'results';
type PlayerDecision = 'call' | 'fold' | null;

const { width: screenWidth } = Dimensions.get('window');

export default function Practice() {
  const [scenario, setScenario] = useState<CallPracticeScenario | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('decision');
  const [playerDecision, setPlayerDecision] = useState<PlayerDecision>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const generateNewScenario = () => {
    const newScenario = generateCallPracticeScenario();
    setScenario(newScenario);
    setGamePhase('decision');
    setPlayerDecision(null);
    // Reset to decision view
    slideAnim.setValue(0);
  };

  const handleDecision = (decision: 'call' | 'fold') => {
    setPlayerDecision(decision);
    // Slide to results view
    Animated.timing(slideAnim, {
      toValue: -screenWidth,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setGamePhase('results');
    });
  };

  const resetToNewScenario = () => {
    // Slide back to decision view first, then generate new scenario
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      // Generate new scenario after animation completes
      const newScenario = generateCallPracticeScenario();
      setScenario(newScenario);
      setPlayerDecision(null);
      setGamePhase('decision');
    });
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
    return { rank, suit };
  };

  const getSuitColor = (suit: string) => {
    switch (suit) {
      case '♥': return 'text-red-600';    // Hearts - Red
      case '♦': return 'text-blue-600';   // Diamonds - Blue
      case '♣': return 'text-green-600';  // Clubs - Green
      case '♠': return 'text-black';      // Spades - Black
      default: return 'text-black';
    }
  };

  if (!scenario) {
    return (
      <View className="flex-1 bg-green-100 justify-center items-center">
        <Text className="text-lg">Loading scenario...</Text>
      </View>
    );
  }

  const isCorrect = playerDecision === scenario.correctDecision;

  // Decision Phase Component
  const DecisionView = () => (
    <View className="flex-1">
      {/* Header */}
      <View className="pt-16 px-4 pb-4">
        <Text className="text-2xl font-bold text-center mb-2">Call Practice</Text>
        <Text className="text-sm text-center text-gray-600">Count your outs and decide: Call or Fold?</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-end p-4">
        {/* Scenario Card */}
        <View className="bg-white rounded-lg p-6 shadow-lg">
          {/* Hole Cards */}
          <View className="mb-8">
            <Text className="text-lg font-semibold mb-4">Your Hole Cards:</Text>
            <View className="flex-row justify-center gap-3">
              {scenario.holeCards.map((card, index) => {
                const { rank, suit } = formatCard(card);
                return (
                  <View key={index} className="bg-white px-4 py-3 rounded-lg border-2 border-gray-300 shadow-sm">
                    <Text className="text-2xl font-bold text-center">
                      <Text className="text-black">{rank}</Text>
                      <Text className={getSuitColor(suit)}>{suit}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Board Cards */}
          <View className="mb-8">
            <Text className="text-lg font-semibold mb-4">Board:</Text>
            <View className="flex-row justify-center gap-3">
              {scenario.boardCards.map((card, index) => {
                const { rank, suit } = formatCard(card);
                return (
                  <View key={index} className="bg-white px-4 py-3 rounded-lg border-2 border-gray-300 shadow-sm">
                    <Text className="text-2xl font-bold text-center">
                      <Text className="text-black">{rank}</Text>
                      <Text className={getSuitColor(suit)}>{suit}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Pot and Call Info */}
          <View className="mb-8 bg-blue-50 p-4 rounded-lg">
            <Text className="text-lg font-semibold mb-3 text-center">Action to You:</Text>
            <View className="flex-row justify-between">
              <Text className="text-xl">Pot Size: <Text className="font-bold text-green-700">${scenario.potAmount}</Text></Text>
              <Text className="text-xl">Call: <Text className="font-bold text-red-700">${scenario.callAmount}</Text></Text>
            </View>
          </View>

          {/* Decision Buttons */}
          <View className="flex-row gap-4">
            <Pressable
              className="flex-1 bg-green-600 py-4 px-6 rounded-lg"
              onPress={() => handleDecision('call')}
            >
              <Text className="text-white font-bold text-xl text-center">CALL</Text>
            </Pressable>
            <Pressable
              className="flex-1 bg-red-600 py-4 px-6 rounded-lg"
              onPress={() => handleDecision('fold')}
            >
              <Text className="text-white font-bold text-xl text-center">FOLD</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  // Results Phase Component
  const ResultsView = () => (
    <View className="flex-1">
      {/* Header */}
      <View className="pt-16 px-4 pb-4">
        <Text className="text-2xl font-bold text-center mb-2">Results</Text>
        <Text className="text-sm text-center text-gray-600">Review your decision and analysis</Text>
      </View>

      {/* Content */}
      <View className="flex-1 justify-end p-4">
        {/* Result Status */}
        <View className="mb-4">
          <View className={`p-3 rounded-lg ${isCorrect ? 'bg-green-200' : 'bg-red-200'}`}>
            <Text className={`text-lg font-bold text-center ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {isCorrect ? '✅ CORRECT!' : '❌ INCORRECT'}
            </Text>
            <Text className="text-center text-base">
              You: <Text className="font-bold">{playerDecision?.toUpperCase()}</Text> | Correct: <Text className="font-bold">{scenario.correctDecision.toUpperCase()}</Text>
            </Text>
          </View>
        </View>

        {/* Compact Scenario Display */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-lg">
          {/* Cards in one row */}
          <View className="mb-3">
            <Text className="text-sm font-semibold mb-2">Hand:
              {scenario.holeCards.map((card, index) => {
                const { rank, suit } = formatCard(card);
                return (
                  <Text key={index} className="ml-1">
                    <Text className="text-black">{rank}</Text>
                    <Text className={getSuitColor(suit)}>{suit}</Text>
                  </Text>
                );
              })}
              {' | '}Board:
              {scenario.boardCards.map((card, index) => {
                const { rank, suit } = formatCard(card);
                return (
                  <Text key={index} className="ml-1">
                    <Text className="text-black">{rank}</Text>
                    <Text className={getSuitColor(suit)}>{suit}</Text>
                  </Text>
                );
              })}
            </Text>
            <Text className="text-sm">Pot: <Text className="font-bold">${scenario.potAmount}</Text> | Call: <Text className="font-bold">${scenario.callAmount}</Text></Text>
          </View>
        </View>

        {/* Compact Analysis */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-lg">
          <Text className="text-lg font-bold mb-2">Analysis</Text>

          {/* Outs Summary */}
          <View className="mb-3">
            <Text className="text-sm">
              <Text className="font-semibold">Total Outs: {scenario.outs}</Text>
              {scenario.outBreakdown.primaryOuts > 0 && (
                <Text> | Primary: {scenario.outBreakdown.primaryOuts} ({scenario.outBreakdown.primaryType})</Text>
              )}
              {scenario.outBreakdown.secondaryOuts > 0 && (
                <Text> | Secondary: {scenario.outBreakdown.secondaryOuts} ({scenario.outBreakdown.secondaryTypes.join(', ')})</Text>
              )}
            </Text>
          </View>

          {/* Compact Out Cards Display */}
          {(scenario.outCards.primary.length > 0 || scenario.outCards.secondary.length > 0) && (
            <View className="mb-3">
              <Text className="text-sm font-semibold mb-1">Your Outs:</Text>
              <View className="flex-row flex-wrap">
                {/* Primary Outs */}
                {scenario.outCards.primary.slice(0, 12).map((card, index) => {
                  const { rank, suit } = formatCard(card);
                  return (
                    <View key={`primary-${index}`} className="px-1 py-0.5 rounded border mr-1 mb-1 bg-blue-100 border-blue-300">
                      <Text className="text-xs font-bold">
                        <Text className="text-black">{rank}</Text>
                        <Text className={getSuitColor(suit)}>{suit}</Text>
                      </Text>
                    </View>
                  );
                })}
                {/* Secondary Outs */}
                {scenario.outCards.secondary.slice(0, 6).map((card, index) => {
                  const { rank, suit } = formatCard(card);
                  return (
                    <View key={`secondary-${index}`} className="px-1 py-0.5 rounded border mr-1 mb-1 bg-yellow-100 border-yellow-300">
                      <Text className="text-xs font-bold">
                        <Text className="text-black">{rank}</Text>
                        <Text className={getSuitColor(suit)}>{suit}</Text>
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Math and Explanation */}
          <View className="mb-3">
            <Text className="text-sm">
              <Text className="font-semibold">Equity: {scenario.equity.toFixed(1)}%</Text> |
              <Text className="font-semibold"> Pot Odds: {scenario.potOdds.toFixed(1)}%</Text>
            </Text>
          </View>

          <View className="bg-gray-50 p-2 rounded">
            <Text className="text-xs text-gray-700">
              {scenario.correctDecision === 'call'
                ? `Equity (${scenario.equity.toFixed(1)}%) > Pot Odds (${scenario.potOdds.toFixed(1)}%) = Profitable Call`
                : `Equity (${scenario.equity.toFixed(1)}%) < Pot Odds (${scenario.potOdds.toFixed(1)}%) = Fold`
              }
            </Text>
          </View>
        </View>

        {/* Try Again Button */}
        <Pressable
          className="bg-blue-600 py-3 px-6 rounded-lg"
          onPress={resetToNewScenario}
        >
          <Text className="text-white font-bold text-lg text-center">Try New Scenario</Text>
        </Pressable>
      </View>
    </View>
  );

  // Main render with sliding stack
  return (
    <View className="flex-1 bg-green-100">
      <View className="flex-1 overflow-hidden">
        {/* Decision View */}
        <Animated.View
          className="absolute inset-0"
          style={{
            transform: [{ translateX: slideAnim }],
          }}
        >
          <DecisionView />
        </Animated.View>

        {/* Results View */}
        <Animated.View
          className="absolute inset-0"
          style={{
            transform: [{ translateX: Animated.add(slideAnim, screenWidth) }],
          }}
        >
          <ResultsView />
        </Animated.View>
      </View>
    </View>
  );
} 