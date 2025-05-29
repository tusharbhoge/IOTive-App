import React, { useState, useContext } from "react";
import Constants from "expo-constants";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { AuthContext } from "../../context/authContext";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

interface UserData {
  id: string;
  name: string;
  role: "user" | "admin";
  token: string;
}

const LoginScreen = () => {
  const authContext = useContext(AuthContext);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authContext) return null;

  const { setUser } = authContext;

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    console.log("🟡 Starting login process...");

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed. Please try again.");
      }

      const data = await response.json();
      console.log("🔵 Backend Response:", data);

      // Check if `data.user` exists
      if (!data.user) {
        throw new Error("User data not found in the response.");
      }

      const userData: UserData = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        token: data.token,
      };

      setUser(userData);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      console.log("✅ Login Successful:", userData);
      router.replace("/");
    } catch (error: unknown) {
      console.error("❌ Login Error:", error);
      Alert.alert("Login Failed", error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      console.log("🔵 Finished login process. Stopping loader.");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="large" color="#50C878" />
        ) : (
          <Button title="Login" color="#50C878" onPress={handleLogin} disabled={loading} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  card: {
    width: "85%",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
});

export default LoginScreen;