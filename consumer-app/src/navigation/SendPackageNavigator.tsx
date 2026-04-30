import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Step1Sender from '../screens/sendPackage/Step1Sender';
import Step2Recipient from '../screens/sendPackage/Step2Recipient';
import Step3Package from '../screens/sendPackage/Step3Package';
import Step4Delivery from '../screens/sendPackage/Step4Delivery';
import Step5Confirm from '../screens/sendPackage/Step5Confirm';

export type SendPackageStackParamList = {
  Step1Sender: undefined;
  Step2Recipient: undefined;
  Step3Package: undefined;
  Step4Delivery: undefined;
  Step5Confirm: undefined;
};

const Stack = createNativeStackNavigator<SendPackageStackParamList>();

export default function SendPackageNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Step1Sender" component={Step1Sender} />
      <Stack.Screen name="Step2Recipient" component={Step2Recipient} />
      <Stack.Screen name="Step3Package" component={Step3Package} />
      <Stack.Screen name="Step4Delivery" component={Step4Delivery} />
      <Stack.Screen name="Step5Confirm" component={Step5Confirm} />
    </Stack.Navigator>
  );
}
