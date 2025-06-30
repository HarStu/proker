import { Text, View, ActivityIndicator, Pressable } from "react-native";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";

export default function Profile() {
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadName = async () => {
      const storedName = await SecureStore.getItemAsync("userName");
      setUserName(storedName);
    };
    loadName();
  }, []);

  if (userName === null) {
    return (
      <View className="flex-1 items-center justify-center bg-green-100">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-green-100">
      <Text className="text-3xl font-bold">Hello, {userName}!</Text>
      {__DEV__ && (
        <Pressable
          className="mt-4 px-4 py-2 bg-red-500 rounded-md"
          onPress={async () => {
            await SecureStore.deleteItemAsync('userUUID');
            await SecureStore.deleteItemAsync('userName');
            router.replace('/welcome');      // jump back to the start
          }}
        >
          <Text className="text-white">Reset onboarding (DEV)</Text>
        </Pressable>
      )}
    </View>
  );
}