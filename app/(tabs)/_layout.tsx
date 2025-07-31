import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Octicons from '@expo/vector-icons/Octicons';
import { HapticTab } from '@/components/HapticTab';
//import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

//import '@/services/mqttService'; // ← activa conexión global al arrancar la app

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      {/* Pestaña 1: "Ventana" */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ventana',
          tabBarIcon: ({ color }) => (
            // Usa el icono que prefieras de tu set (ej. SF Symbols, Ionicons, etc.).
            // Aquí supongo que "rectangle.grid.2x2.fill" es válido en tu IconSymbol
            <MaterialCommunityIcons name="window-closed-variant" size={24} color="white" />
          ),
        }}
      />

      {/* Pestaña 2: "Configuración" */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Configuración',
          headerShown: true,
          headerTitleAlign: 'center',
          tabBarIcon: ({ color }) => (
            <Octicons name="gear" size={24} color="white" />
          ),
        }}
      />
    </Tabs>
  );
}

