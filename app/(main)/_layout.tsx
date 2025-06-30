import { Tabs } from "expo-router";

export default function MainLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="calc" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="practice" />
    </Tabs>
  );
}