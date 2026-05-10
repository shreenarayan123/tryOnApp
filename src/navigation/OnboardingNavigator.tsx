import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/Onboarding/WelcomeScreen';
import AvatarSetupScreen from '../screens/Onboarding/AvatarSetupScreen';
import PermissionsScreen from '../screens/Onboarding/PermissionsScreen';
import {OnboardingStackParamList} from '../types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AvatarSetup" component={AvatarSetupScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
