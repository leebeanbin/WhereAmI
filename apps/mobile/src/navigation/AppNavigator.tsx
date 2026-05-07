import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TrackingScreen } from '@/screens/TrackingScreen';
import { HistoryScreen } from '@/screens/HistoryScreen';
import { ILocationAdapter } from '@whereami/core';

const Tab = createBottomTabNavigator();

interface Props {
  geolocationAdapter: ILocationAdapter;
}

export function AppNavigator({ geolocationAdapter }: Props) {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="추적">
          {() => <TrackingScreen geolocationAdapter={geolocationAdapter} />}
        </Tab.Screen>
        <Tab.Screen name="기록" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
