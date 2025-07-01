import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function PracticeResult() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-green-100 justify-center items-center">
      <Text className="mb-8 text-xl font-bold">Result Placeholder</Text>
      <Pressable
        className="px-6 py-3 bg-gray-600 rounded-lg"
        onPress={() => router.back()}
      >
        <Text className="text-white font-bold text-lg">Back to Practice</Text>
      </Pressable>
    </View>
  );
} 