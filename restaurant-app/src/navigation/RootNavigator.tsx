import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@clerk/clerk-expo';
import AuthScreen from '../screens/AuthScreen';
import OrdersFeedScreen from '../screens/OrdersFeedScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import RestaurantManageScreen from '../screens/RestaurantManageScreen';

export type RootStackParamList = {
  Auth: undefined;
  OrdersFeed: undefined;
  OrderDetail: { orderId: string };
  RestaurantManage: undefined;
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
              name="OrdersFeed"
              component={OrdersFeedScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OrderDetail"
              component={OrderDetailScreen}
              options={{ title: 'Order detail' }}
            />
            <Stack.Screen
              name="RestaurantManage"
              component={RestaurantManageScreen}
              options={{ title: 'Restaurant & menu' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
