// AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AttendanceScreen from './screens/AttendanceScreen';
import StudentManagement from './screens/StudentManagement'; // no .tsx
import Profile from './screens/Profile';
import Settings from './screens/Settings';

export type RootStackParamList = {
  Attendance: undefined;
  StudentManagement: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Attendance">
        <Stack.Screen name="Attendance" component={AttendanceScreen} />
        <Stack.Screen name="StudentManagement" component={StudentManagement} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Settings" component={Settings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
