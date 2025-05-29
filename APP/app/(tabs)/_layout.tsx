import React from 'react';
import { Tabs, useNavigation } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../context/themeContext'; // Updated path

export default function TabLayout() {
  const navigation = useNavigation();
  const theme = useTheme(); // Get current theme

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerTitle: route.name === "index" ? "IOTIVE" : route.name.charAt(0).toUpperCase() + route.name.slice(1),
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 30 }} 
            onPress={() => navigation.navigate('Notification' as never)}
          >
            <FontAwesome name="heart" size={20} color={theme.icon} />
          </TouchableOpacity>
        ),
        headerTitleStyle: { fontSize: 20, fontWeight: 'bold', color: "#50C878" },
        headerStyle: { backgroundColor: theme.header, elevation: 4,  }, // Add header styles
        tabBarStyle: { backgroundColor: theme.tabBar, borderTopWidth: 0, elevation: 4, height: 70, paddingTop: 10 }, // Add tab bar styles
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', color: theme.icon }, // Add tab labels
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'IOTIVE', // This ensures the tabBarLabel remains 'IOTIVE'
          tabBarLabel: 'Control Panel', // Show text under icon
          tabBarIcon: ({ color, size }) => <FontAwesome name="sliders" size={20} color={theme.icon} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule', // Show text under icon
          tabBarIcon: ({ color, size }) => <FontAwesome name="calendar" size={20} color={theme.icon} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile', // Show text under icon
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={20} color={theme.icon} />,
        }}
      />
    </Tabs>
  );
}
