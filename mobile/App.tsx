import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthContext, useAuthProvider } from "./src/hooks/useAuth";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const auth = useAuthProvider();

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={auth}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
