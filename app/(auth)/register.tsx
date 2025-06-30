import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

export default function Register() {
  const [name, setName] = useState("");

  const generateUUID = (): string => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleRegister = async () => {
    try {
      // Ensure a UUID exists (generate if missing)
      let userId = await SecureStore.getItemAsync("userUUID");
      if (!userId) {
        userId = generateUUID();
        await SecureStore.setItemAsync("userUUID", userId);
      }

      await SecureStore.setItemAsync("userName", name);

      router.push("/profile");
    } catch (err) {
      console.warn("Failed to save registration info", err);
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-8 bg-green-100">
      <Text className="text-2xl font-bold">What's your name?</Text>
      <View className="flex-row items-center gap-2">
        <TextInput
          className="border-2 border-gray-300 bg-gray-100 w-48 rounded-md p-2"
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
        />
        <Pressable
          className={`rounded-md p-2 ${name.length > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}
          onPress={handleRegister}
          disabled={name.length === 0}
        >
          <Text className="text-white">Register</Text>
        </Pressable>
      </View>
    </View>
  );
}