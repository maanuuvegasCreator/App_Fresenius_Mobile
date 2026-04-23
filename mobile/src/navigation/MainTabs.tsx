import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { CallsScreen } from '../screens/CallsScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { KeypadScreen } from '../screens/KeypadScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type MainTabParamList = {
  Calls: undefined;
  Keypad: undefined;
  Contacts: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const ACTIVE = '#0070C9';
const INACTIVE = '#8E8E93';

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: {
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          paddingTop: 6,
          height: 62,
        },
      }}>
      <Tab.Screen
        name="Calls"
        component={CallsScreen}
        options={{
          title: 'Llamadas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Keypad"
        component={KeypadScreen}
        options={{
          title: 'Teclado',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="keypad-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: 'Contactos',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Mi perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
