import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WorkplacesScreen from './screens/WorkplacesScreen';
import PricingScreen from './screens/PricingScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
                name="Workplaces"
                component={WorkplacesScreen}
                options={{ title: 'Miejsca pracy' }}
            />
            <Stack.Screen
                name="Pricing"
                component={PricingScreen}
                options={({ route }: any) => ({ title: route.params?.title ?? 'Cennik' })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
  );
}