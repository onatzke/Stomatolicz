import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DayScreen from './screens/DayScreen';
import WorkplacesScreen from './screens/WorkplacesScreen';
import PricingScreen from './screens/PricingScreen';
import { colors } from './lib/theme';

const Stack = createNativeStackNavigator();

export default function App() {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="Day"
                        component={DayScreen}
                        options={({ navigation }) => ({
                            title: 'Stomatolicz',
                            headerRight: () => (
                                <Pressable onPress={() => navigation.navigate('Workplaces')}>
                                    <Text style={{ color: colors.accent, fontSize: 15 }}>Ustawienia</Text>
                                </Pressable>
                            ),
                        })}
                    />
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