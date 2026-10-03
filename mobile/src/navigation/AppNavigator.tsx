import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import AssetDetailScreen from '../screens/AssetDetailScreen';
import TrackRecordScreen from '../screens/TrackRecordScreen';
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '📊',
    'Track Record': '📈',
    About: 'ℹ️',
  };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label] || '•'}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#3b82f6' : '#6b7280', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0f',
          borderTopColor: 'rgba(255,255,255,0.05)',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Track Record"
        component={TrackRecordScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Track Record" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="About" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0a0a0f' },
        }}
      >
        <Stack.Screen name="Home" component={HomeTabs} />
        <Stack.Screen name="AssetDetail" component={AssetDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
