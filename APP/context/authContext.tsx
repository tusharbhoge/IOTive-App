import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

// Define User Interface
interface User {
  id: string;
  name: string;
  role: "user" | "admin";
  token: string;
}

// Define Auth Context Interface
interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  loading: boolean;
}

// Create Context
export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("🔍 Checking AsyncStorage for user data...");
        const userData = await AsyncStorage.getItem("user");

        if (userData) {
          console.log("✅ User data found in AsyncStorage:", JSON.parse(userData));
          setUser(JSON.parse(userData));
        } else {
          console.log("❌ No user data found.");
        }
      } catch (error) {
        console.error("⚠️ Error loading user session:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    try {
      console.log("🔴 Logging out...");
      setUser(null);
      await AsyncStorage.removeItem("user");
      console.log("✅ User logged out successfully.");
    } catch (error) {
      console.error("⚠️ Error during logout:", error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
