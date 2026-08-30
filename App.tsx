import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './lib/ThemeContext';
import WorkplacesScreen from './screens/WorkplacesScreen';
import DayScreen from './screens/DayScreen';
import SummaryScreen from './screens/SummaryScreen';
import ThemeToggle from './components/ThemeToggle';
import DialogHost from './components/DialogHost';

const Stack = createNativeStackNavigator();

function Root() {
    const { name, colors, ready } = useTheme();

    if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

    const navTheme = {
        ...(name === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
            ...(name === 'dark' ? DarkTheme : DefaultTheme).colors,
            background: colors.bg,
            card: colors.bg,
            text: colors.text,
            border: colors.border,
            primary: colors.accent,
        },
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
            <NavigationContainer theme={navTheme}>
                <Stack.Navigator
                    screenOptions={{
                        headerRight: () => <ThemeToggle />,
                        headerShadowVisible: false,
                        // bez tego ekran jest przezroczysty i w trakcie przejścia
                        // prześwituje białe tło okna
                        contentStyle: { backgroundColor: colors.bg },
                    }}
                >
                    <Stack.Screen
                        name="Workplaces"
                        component={WorkplacesScreen}
                        options={{ title: 'Stomatolicz' }}
                    />
                    {/* własny nagłówek w ekranie, żeby nazwa miejsca pracy
                        i zmiana dnia tworzyły jeden blok */}
                    <Stack.Screen
                        name="Day"
                        component={DayScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Summary"
                        component={SummaryScreen}
                        options={{ title: 'Podsumowanie' }}
                    />
                </Stack.Navigator>
            </NavigationContainer>
            <DialogHost />
        </View>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <Root />
            </ThemeProvider>
        </SafeAreaProvider>
    );
}