import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '@clerk/clerk-expo';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import BankTransferScreen from '../screens/BankTransferScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AccountScreen from '../screens/AccountScreen';
import PackageTrackingScreen from '../screens/PackageTrackingScreen';
import SendPackageNavigator from './SendPackageNavigator';
import { Loader, Icon, type IconName } from '../ui';
import { useCart } from '../store/cart';

export type HomeStackParamList = {
  Home: undefined;
  RestaurantDetail: { restaurantId: string };
};

export type OrdersStackParamList = {
  OrderHistory: undefined;
  OrderTracking: { orderId: string };
};

export type CartStackParamList = {
  Cart: { restaurantId?: string } | undefined;
  Checkout: {
    restaurantId?: string;
    orderId?: string;
    totalAmount?: string;
    flow?: 'food' | 'package';
  };
  BankTransfer: {
    paymentId: string;
    orderId: string;
    instructions: import('../services/types').BankTransferInstructions;
    flow?: 'food' | 'package';
  };
  OrderTracking: { orderId: string };
};

export type AccountStackParamList = {
  Account: undefined;
};

export type MainTabsParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  CartTab: undefined;
  AccountTab: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  SendPackage: undefined;
  PackageTracking: {
    packageId: string;
    trackingToken: string;
    orderId: string;
    amount?: string;
  };
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const CartStack = createNativeStackNavigator<CartStackParamList>();
const AccountStack = createNativeStackNavigator<AccountStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

const stackOpts = { headerShown: false } as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackOpts}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
      />
    </HomeStack.Navigator>
  );
}

function OrdersStackNav() {
  return (
    <OrdersStack.Navigator screenOptions={stackOpts}>
      <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <OrdersStack.Screen
        name="OrderTracking"
        component={OrderTrackingScreen}
      />
    </OrdersStack.Navigator>
  );
}

function CartStackNav() {
  return (
    <CartStack.Navigator screenOptions={stackOpts}>
      <CartStack.Screen name="Cart" component={CartScreen} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} />
      <CartStack.Screen name="BankTransfer" component={BankTransferScreen} />
      <CartStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </CartStack.Navigator>
  );
}

function AccountStackNav() {
  return (
    <AccountStack.Navigator screenOptions={stackOpts}>
      <AccountStack.Screen name="Account" component={AccountScreen} />
    </AccountStack.Navigator>
  );
}

interface TabIconProps {
  name: IconName;
  label: string;
  focused: boolean;
  badge?: number;
}

function TabIcon({ name, label, focused, badge }: TabIconProps) {
  const color = focused ? '#0B1C2C' : '#94A3B8';
  return (
    <View className="items-center justify-center" style={{ minWidth: 64 }}>
      <View
        style={{
          transform: [{ scale: focused ? 1.08 : 1 }],
        }}
      >
        <Icon name={name} size={22} color={color} />
        {badge && badge > 0 ? (
          <View
            className="absolute bg-accent items-center justify-center"
            style={{
              top: -6,
              right: -10,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 4,
            }}
          >
            <Text
              className="text-primary"
              style={{ fontSize: 10, fontFamily: 'Inter_700Bold' }}
            >
              {badge > 9 ? '9+' : String(badge)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        className={`text-[11px] mt-1 ${focused ? 'text-primary' : 'text-subtle'}`}
        style={{
          fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_500Medium',
        }}
      >
        {label}
      </Text>
      <View
        className="mt-1 rounded-full"
        style={{
          height: 3,
          width: 3,
          backgroundColor: focused ? '#C6A052' : 'transparent',
        }}
      />
    </View>
  );
}

function MainTabs() {
  const cartCount = useCart((s) => s.totalCount());
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          height: 84,
          paddingTop: 10,
          paddingBottom: 22,
        },
      }}
    >
      <Tabs.Screen
        name="HomeTab"
        component={HomeStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="OrdersTab"
        component={OrdersStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="file-text" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="CartTab"
        component={CartStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name="shopping-cart"
              label="Cart"
              focused={focused}
              badge={cartCount}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="AccountTab"
        component={AccountStackNav}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name="user" label="Account" focused={focused} />
          ),
        }}
      />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const isAuthed = isSignedIn || DEV_AUTH_BYPASS;

  if (!isLoaded) {
    return <Loader fullscreen label="Loading..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={stackOpts}>
        {isAuthed ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="SendPackage"
              component={SendPackageNavigator}
            />
            <RootStack.Screen
              name="PackageTracking"
              component={PackageTrackingScreen}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
