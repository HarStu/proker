import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-50 px-4">
      <View className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          Welcome to Proker! 🚀
        </Text>
        <Text className="text-lg text-gray-600 text-center mb-6">
          NativeWind is now fully configured and working!
        </Text>
        <View className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl">
          <Text className="text-white text-center font-semibold">
            Edit app/index.tsx to edit this screen
          </Text>
        </View>
      </View>
    </View>
  );
}
