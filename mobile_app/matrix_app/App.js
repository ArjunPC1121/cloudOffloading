import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import MatrixMultiplicationScreen from './screens/MatrixMultiplicationScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mobile Cloud Offloading' }} />
        <Stack.Screen name="MatrixMultiplication" component={MatrixMultiplicationScreen} options={{ title: 'Matrix Multiplication' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
