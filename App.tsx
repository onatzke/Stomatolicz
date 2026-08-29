import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WorkplacesScreen from './screens/WorkplacesScreen';
import DayScreen from './screens/DayScreen';
import SummaryScreen from './screens/SummaryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Workplaces"
                        component={WorkplacesScreen}
                        options={{ title: 'Stomatolicz' }}
                    />
                    <Stack.Screen
                        name="Day"
                        component={DayScreen}
                        options={({ route }: any) => ({ title: route.params?.title ?? 'Dzień' })}
                    />
                    <Stack.Screen
                        name="Summary"
                        component={SummaryScreen}
                        options={{ title: 'Podsumowanie' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
        </SafeAreaProvider>
    );
}