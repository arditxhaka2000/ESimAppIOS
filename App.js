import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { StatusBar, StyleSheet } from 'react-native';

// Services
import { AuthService } from './src/services/AuthService';
import { GloesimApiService } from './src/services/GloesimApiService';
import { SecureStorageService } from './src/services/SecureStorageService';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CountriesScreen from './src/screens/CountriesScreen';
import MyESimsScreen from './src/screens/MyESimsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CountryPackagesScreen from './src/screens/CountryPackagesScreen';

// Context
import { ApiProvider } from './src/context/ApiContext';
import { AuthProvider } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
  </Stack.Navigator>
);

const PackagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Countries" component={CountriesScreen} />
    <Stack.Screen name="CountryPackages" component={CountryPackagesScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Packages':
            iconName = 'language';
            break;
          case 'MyeSims':
            iconName = 'sim-card';
            break;
          case 'Settings':
            iconName = 'settings';
            break;
          default:
            iconName = 'circle';
        }
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#9b7373ff',
      tabBarInactiveTintColor: '#ffffffff',
      tabBarStyle: {
        backgroundColor: '#dc2626',
        borderTopWidth: 0,
        elevation: 8,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: -2 },
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeStack}
      options={{ tabBarLabel: 'Home' }}
    />
    <Tab.Screen 
      name="Packages" 
      component={PackagesStack}
      options={{ tabBarLabel: 'Packages' }}
    />
    <Tab.Screen 
      name="MyeSims" 
      component={MyESimsScreen}
      options={{ tabBarLabel: 'My eSIMs' }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ tabBarLabel: 'Settings' }}
    />
  </Tab.Navigator>
);

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize services
        await SecureStorageService.initialize();
        await AuthService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsInitialized(true); // Still proceed even if there's an error
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return null; // Or loading screen
  }

  return (
    <AuthProvider>
      <ApiProvider>
        <NavigationContainer>
          <StatusBar 
            barStyle="light-content" 
            backgroundColor="#dc2626" 
            translucent={false}
          />
          <TabNavigator />
        </NavigationContainer>
      </ApiProvider>
    </AuthProvider>
  );
};

export default App;