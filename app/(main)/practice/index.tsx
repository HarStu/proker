import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function Practice() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-green-100 justify-center items-center">
      <Text className="mb-8 text-xl font-bold">Practice</Text>
      <Pressable
        className="px-6 py-3 bg-blue-600 rounded-lg"
        onPress={() => router.push("/practice/result")}
      >
        <Text className="text-white font-bold text-lg">Show Result</Text>
      </Pressable>
    </View>
  );
} 