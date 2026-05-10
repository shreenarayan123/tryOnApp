import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {storageService} from '../services/storageService';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import ProScreen from '../screens/Pro/ProScreen';
import AvatarSetupScreen from '../screens/Onboarding/AvatarSetupScreen';
import {useUserStore} from '../store/useUserStore';

const RootStack = createNativeStackNavigator<RootStackParamList>();

const AvatarSetupModalScreen = (props: any) => <AvatarSetupScreen {...props} />;

const RootNavigator = () => {
  const [isReady, setIsReady] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);
  const resetDailyCountIfNewDay = useUserStore(
    state => state.resetDailyCountIfNewDay,
  );

  useEffect(() => {
    const onboardingComplete = storageService.getBoolean('onboarding_complete');
    setCompletedOnboarding(Boolean(onboardingComplete));
    resetDailyCountIfNewDay();
    setIsReady(true);
  }, [resetDailyCountIfNewDay]);

  if (!isReady) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={completedOnboarding ? 'Main' : 'Onboarding'}>
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen
          name="AvatarSetupModal"
          component={AvatarSetupModalScreen}
          options={{presentation: 'modal'}}
        />
        <RootStack.Screen
          name="ProModal"
          component={ProScreen}
          options={{presentation: 'modal'}}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
