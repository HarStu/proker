import React from "react";
import { Text, View, ActivityIndicator, Pressable } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter, useFocusEffect } from "expo-router";
import { dbOperations } from "../../libs/db";

export default function Profile() {
  const [userName, setUserName] = useState<string | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = async () => {
    try {
      const storedName = await SecureStore.getItemAsync("userName");
      setUserName(storedName);

      console.log('Loading practice history...');
      // Load practice history
      const history = await dbOperations.getAllAttempts(); // Get all attempts for stats
      console.log('Practice history loaded:', history.length, 'attempts');
      console.log('History details:', history.map(h => ({ id: h.id, isCorrect: h.isCorrect, description: h.description })));
      setPracticeHistory(history);
    } catch (error) {
      console.warn("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on initial mount
  useEffect(() => {
    loadData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Profile screen focused - reloading data');
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-green-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-100 p-4 pt-16">
      <Text className="text-3xl font-bold text-center mb-6">Hello, {userName}!</Text>

      {/* Stats Summary */}
      <View className="bg-white rounded-lg p-6">
        <Text className="text-xl font-semibold mb-4 text-center">Quick Stats</Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-3xl font-bold text-blue-600">
              {practiceHistory.length}
            </Text>
            <Text className="text-sm text-gray-600">Total Attempts</Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-green-600">
              {(() => {
                const correct = practiceHistory.filter(a => a.isCorrect).length;
                console.log('Calculating correct answers:', correct, 'out of', practiceHistory.length);
                return correct;
              })()}
            </Text>
            <Text className="text-sm text-gray-600">Correct</Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-purple-600">
              {(() => {
                const correct = practiceHistory.filter(a => a.isCorrect).length;
                const total = practiceHistory.length;
                const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
                console.log('Calculating accuracy:', correct, '/', total, '=', accuracy + '%');
                return accuracy;
              })()}%
            </Text>
            <Text className="text-sm text-gray-600">Accuracy</Text>
          </View>
        </View>
      </View>

      {/* Dev Reset Buttons */}
      {__DEV__ && (
        <View className="mt-6 gap-2">
          <Pressable
            className="px-4 py-2 bg-red-500 rounded-md self-center"
            onPress={async () => {
              await SecureStore.deleteItemAsync('userUUID');
              await SecureStore.deleteItemAsync('userName');
              router.replace('/welcome');
            }}
          >
            <Text className="text-white">Reset onboarding (DEV)</Text>
          </Pressable>
          <Pressable
            className="px-4 py-2 bg-orange-500 rounded-md self-center"
            onPress={async () => {
              await dbOperations.resetDatabase();
              loadData();
            }}
          >
            <Text className="text-white">Reset database (DEV)</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}