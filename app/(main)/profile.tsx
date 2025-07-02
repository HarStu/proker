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
      const history = await dbOperations.getHistory(10); // Get last 10 attempts
      console.log('Practice history loaded:', history.length, 'attempts');
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
              {practiceHistory.filter(a => a.isCorrect).length}
            </Text>
            <Text className="text-sm text-gray-600">Correct</Text>
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold text-purple-600">
              {practiceHistory.length > 0
                ? Math.round((practiceHistory.filter(a => a.isCorrect).length / practiceHistory.length) * 100)
                : 0}%
            </Text>
            <Text className="text-sm text-gray-600">Accuracy</Text>
          </View>
        </View>
      </View>

      {/* Dev Reset Button */}
      {__DEV__ && (
        <Pressable
          className="mt-6 px-4 py-2 bg-red-500 rounded-md self-center"
          onPress={async () => {
            await SecureStore.deleteItemAsync('userUUID');
            await SecureStore.deleteItemAsync('userName');
            router.replace('/welcome');
          }}
        >
          <Text className="text-white">Reset onboarding (DEV)</Text>
        </Pressable>
      )}
    </View>
  );
}