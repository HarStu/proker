// app/index.tsx
import { Redirect } from "expo-router";

export default function Index() {
  // send / ➜ /(auth)/welcome
  return <Redirect href="/(auth)/welcome" />;
}