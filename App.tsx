import React, {useEffect} from 'react';
import {StatusBar, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {COLORS} from './src/constants/colors';

const AppShell = () => {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}
      edges={['top', 'bottom']}>
      <View style={{flex: 1, backgroundColor: COLORS.background}}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <RootNavigator />
      </View>
    </SafeAreaView>
  );
};

const App = () => {

  useEffect(() => {
    mobileAds().initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
