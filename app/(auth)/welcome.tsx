import { Text, View } from "react-native";

export default function Welcome() {
  return (
    <View className="flex-1 bg-blue-500 items-center justify-center">
      <Text className="text-white text-2xl font-bold">
        Welcome Screen
      </Text>
      <Text className="text-blue-100 mt-2">
        Group route: (auth)/welcome.tsx → URL: /welcome
      </Text>
    </View>
  );
} 