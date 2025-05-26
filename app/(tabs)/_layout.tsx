import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Edit, Plus, Search, Gamepad2 } from 'lucide-react-native';

const ACTIVE_COLOR = '#007AFF';
const INACTIVE_COLOR = '#8E8E93';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="request"
        options={{
          title: 'Request',
          tabBarIcon: ({ color, focused }) => (
            <Edit 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <Plus 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Search 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: 'Games',
          tabBarIcon: ({ color, focused }) => (
            <Gamepad2 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
    </Tabs>
  );
} 