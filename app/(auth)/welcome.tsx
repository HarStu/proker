import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import * as SecureStore from "expo-secure-store";

export default function Welcome() {
  const handleTap = async () => {
    try {
      const userId = await SecureStore.getItemAsync("userUUID");
      const userName = await SecureStore.getItemAsync("userName");

      if (userId && userName) {
        router.push("/profile");
      } else {
        router.push("/register");
      }
    } catch (err) {
      console.warn("Failed to access stored user data", err);
      router.push("/register");
    }
  }

  return (
    <Pressable className="flex-1 bg-green-100 items-center justify-center" onPress={handleTap}>
      <Text className="white text-2xl font-bold" >
        welcome to proker
      </Text >
      <Text className="mt-2 items-center text-center">
        tap to continue
      </Text>
    </Pressable>
  );
} 