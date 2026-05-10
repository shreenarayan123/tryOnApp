import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import CameraScreen from '../screens/Main/CameraScreen';
import ProcessingScreen from '../screens/Main/ProcessingScreen';
import ResultScreen from '../screens/Main/ResultScreen';
import HistoryScreen from '../screens/Main/HistoryScreen';
import SettingsScreen from '../screens/Main/SettingsScreen';
import {COLORS} from '../constants/colors';
import {MainTabParamList, CameraStackParamList} from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const CameraStack = createNativeStackNavigator<CameraStackParamList>();

const CameraStackNavigator = () => (
  <CameraStack.Navigator screenOptions={{headerShown: false}}>
    <CameraStack.Screen name="Camera" component={CameraScreen} />
    <CameraStack.Screen name="Processing" component={ProcessingScreen} />
    <CameraStack.Screen name="Result" component={ResultScreen} />
  </CameraStack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 64,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: {width: 0, height: -4},
          elevation: 12,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarIcon: ({color, focused, size}) => {
          const icons: Record<keyof MainTabParamList, string> = {
            CameraTab: 'camera-outline',
            HistoryTab: 'view-grid-outline',
            SettingsTab: 'cog-outline',
          };

          return (
            <View
              style={{
                transform: [{scale: focused ? 1.08 : 1}],
              }}>
              <MaterialCommunityIcons name={icons[route.name]} size={size} color={color} />
            </View>
          );
        },
      })}>
      <Tab.Screen name="CameraTab" component={CameraStackNavigator} />
      <Tab.Screen name="HistoryTab" component={HistoryScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
