import React, {useEffect} from 'react';
import {StatusBar, useColorScheme, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {COLORS} from './src/constants/colors';

const App = () => {
  const isDarkMode = useColorScheme() !== 'light';

  useEffect(() => {
    mobileAds().initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <View style={{flex: 1, backgroundColor: COLORS.background}}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={COLORS.background}
          />
          <RootNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
