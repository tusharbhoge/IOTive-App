import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

// Define light and dark themes
const lightTheme = {
    background: '#FFFFFF',
    text: '#000000',
    icon: '#262626',
    header: '#FFFFFF',
    tabBar: '#FAFAFA',
    mode: 'light',
    placeholder: '#a9a9a9',
    card: '#f0f0f0',
    input: '#FFFFFF',
    primary: '#007bff',
    buttonText: '#FFFFFF',
    danger: '#ff4d4d',
    modal: '#FFFFFF',
    border: '#d3d3d3',
    secondary: '#6c757d',
    button: '#007bff',
};

const darkTheme = {
    background: '#121212',
    text: '#FFFFFF',
    icon: '#F5F5F5',
    header: '#1c1c1c',
    tabBar: '#1c1c1c',
    mode: 'dark',
    placeholder: '#a9a9a9',
    card: '#1e1e1e',
    input: '#2a2a2a',
    primary: '#1e90ff',
    buttonText: '#FFFFFF',
    danger: '#ff4d4d',
    modal: '#333333',
    border: '#333333',
    secondary: '#6c757d',
    button: '#1e90ff',
    themecolor:'#50C878'
};

export { lightTheme, darkTheme };


// Create Theme Context
const ThemeContext = createContext(lightTheme);

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
