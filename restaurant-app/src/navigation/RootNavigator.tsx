import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@clerk/clerk-expo';
import AuthScreen from '../screens/AuthScreen';
import OrdersFeedScreen from '../screens/OrdersFeedScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import RestaurantManageScreen from '../screens/RestaurantManageScreen';
import AccountScreen from '../screens/AccountScreen';
import NotAuthorizedScreen from '../screens/NotAuthorizedScreen';
import { Loader } from '../ui';
import { useRole } from '../auth/useRole';

export type OrdersStackParamList = {
  OrdersFeed: undefined;
  OrderDetail: { orderId: string };
};

export type ManageStackParamList = {
  RestaurantManage: undefined;
};

export type AccountStackParamList = {
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  NotAuthorized: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ManageStack = createNativeStackNavigator<ManageStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const Tabs = createBottomTabNavigator();

const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';
const stackOpts = { headerShown: false } as const;

function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={stackOpts}>
      <OrdersStack.Screen name="OrdersFeed" component={OrdersFeedScreen} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrdersStack.Navigator>
  );
}

function ManageStackNav() {
  return (
    <ManageStack.Navigator screenOptions={stackOpts}>
      <ManageStack.Screen name="RestaurantManage" component={RestaurantManageScreen} />
    </ManageStack.Navigator>
  );
}

function AccountStackNav() {
  return (
    <AccountStack.Navigator screenOptions={stackOpts}>
      <AccountStack.Screen name="Account" component={AccountScreen} />
    </AccountStack.Navigator>
  );
}

function TabIcon({ glyph, label, focused }: { glyph: string; label: string; focused: boolean }) {
  return (
    <View className="items-center justify-center" style={{ minWidth: 60 }}>
      <Text style={{ fontSize: 18, color: focused ? '#1E3A8A' : '#94A3B8' }}>{glyph}</Text>
      <Text
        className={`text-[11px] mt-0.5 ${focused ? 'text-primary' : 'text-subtle'}`}
        style={{ fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_500Medium' }}
      >
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 84,
          paddingTop: 8,
          paddingBottom: 24,
        },
      }}
    >
      <Tabs.Screen
        name="OrdersTab"
        component={OrdersStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="\uD83D\uDCE6" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ManageTab"
        component={ManageStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="\u2699\uFE0F" label="Manage" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="AccountTab"
        component={AccountStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="\uD83D\uDC64" label="Account" focused={focused} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const isAuthed = isSignedIn || DEV_AUTH_BYPASS;
  const { canAccessRestaurantApp, loading: roleLoading, user } = useRole();

  if (!isLoaded || (isAuthed && roleLoading && !user)) {
    return <Loader fullscreen label="Loading..." />;
  }

  let stack: React.ReactNode;
  if (!isAuthed) {
    stack = <RootStack.Screen name="Auth" component={AuthScreen} />;
  } else if (!user || canAccessRestaurantApp || DEV_AUTH_BYPASS) {
    stack = <RootStack.Screen name="MainTabs" component={MainTabs} />;
  } else {
    stack = <RootStack.Screen name="NotAuthorized" component={NotAuthorizedScreen} />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={stackOpts}>{stack}</RootStack.Navigator>
    </NavigationContainer>
  );
}
