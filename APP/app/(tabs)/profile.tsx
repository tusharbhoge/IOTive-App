import React, { useContext } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useTheme } from '../../context/themeContext';
import { AuthContext } from '../../context/authContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const theme = useTheme();
  const authContext = useContext(AuthContext);
  const navigation = useNavigation();

  if (!authContext) return null;

  const handleLogout = async () => {
    try {
      await authContext.logout();
      Alert.alert("Success", "You have been logged out.");
      navigation.navigate("/(auth)/login");
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.text, { color: theme.text }]}>Profile Screen</Text>
      <Button title="Logout" color="#50C878" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold' },
});
