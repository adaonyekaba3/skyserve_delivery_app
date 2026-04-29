import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import AuthScreen from '../screens/AuthScreen';
import RestaurantsScreen from '../screens/RestaurantsScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';

export type RootStackParamList = {
  Auth: undefined;
  Restaurants: undefined;
  RestaurantDetail: { restaurantId: string };
  Cart: { restaurantId: string };
  Checkout: { restaurantId: string };
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const DEV_AUTH_BYPASS = process.env.EXPO_PUBLIC_DEV_AUTH_BYPASS === 'true';

export default function RootNavigator() {
  const { isLoaded, isSignedIn } = useAuth();
  const isAuthed = isSignedIn || DEV_AUTH_BYPASS;

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthed ? (
          <>
            <Stack.Screen
              name="Restaurants"
              component={RestaurantsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RestaurantDetail"
              component={RestaurantDetailScreen}
              options={{ title: '' }}
            />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your cart' }} />
            <Stack.Screen
              name="Checkout"
              component={CheckoutScreen}
              options={{ title: 'Checkout' }}
            />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
              options={{ title: 'Tracking' }}
            />
            <Stack.Screen
              name="OrderHistory"
              component={OrderHistoryScreen}
              options={{ title: 'My orders' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
