import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Image } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';

import { AuthService } from './src/services/AuthService';
import { SecureStorageService } from './src/services/SecureStorageService';

import HomeScreen from './src/screens/HomeScreen';
import CountriesScreen from './src/screens/CountriesScreen';
import MyESimsScreen from './src/screens/MyESimsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CountryPackagesScreen from './src/screens/CountryPackagesScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoadingScreen from './src/screens/LoadingScreen';

import { ApiProvider } from './src/context/ApiContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// ✅ PNG Icon Images from assets
const ShopIcon = require('./src/assets/shop.png');
const MyESimsIcon = require('./src/assets/esims.png');
const GuidesIcon = require('./src/assets/guides.png');
const ProfileIcon = require('./src/assets/profile.png');

// ✅ Nested Home stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
  </Stack.Navigator>
);

// ✅ Packages stack
const PackagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Countries" component={CountriesScreen} />
    <Stack.Screen name="CountryPackages" component={CountryPackagesScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ color, size, focused }) => {
        let iconSource;

        switch (route.name) {
          case 'Shop':
            iconSource = ShopIcon;
            break;
          case 'My eSIMs':
            iconSource = MyESimsIcon;
            break;
          case 'Guides':
            iconSource = GuidesIcon;
            break;
          case 'Profile':
            iconSource = ProfileIcon;
            break;
          default:
            iconSource = null;
        }

        return iconSource ? (
          <Image
            source={iconSource}
            style={{
              width: size,
              height: size,
              tintColor: focused ? '#000000' : '#8c8c8c',
            }}
          />
        ) : null;
      },
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#8c8c8c',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        height: 80,
        borderTopWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
        paddingBottom: 20,
        paddingTop: 5,
      },
      tabBarLabelStyle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
      },
    })}
  >
    <Tab.Screen name="Shop" component={HomeStack} />
    <Tab.Screen name="My eSIMs" component={MyESimsScreen} />
    <Tab.Screen name="Guides" component={MyESimsScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ✅ Main navigation flow: shows Login first, then Main tabs
const RootNavigator = () => {
  const { isAuthenticated, loading, isGlobalLoading } = useAuth();

  console.log('[AppContent] Auth states:', { isAuthenticated, loading, isGlobalLoading });

  if (loading || isGlobalLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Always show LoginScreen first until authenticated
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // After login, show MainNavigator (tabs)
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[App] Initializing app services...');

        // Initialize SecureStorageService
        try {
          if (SecureStorageService?.initialize) {
            await SecureStorageService.initialize();
          }
        } catch (error) {
          console.warn('SecureStorageService init failed:', error.message);
        }

        // Initialize AuthService
        try {
          if (AuthService?.initialize) {
            await AuthService.initialize();
          }
        } catch (error) {
          console.warn('AuthService init failed:', error.message);
        }

        console.log('[App] App services initialized successfully');
      } catch (error) {
        console.error('[App] Initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <StripeProvider publishableKey="pk_test_51S8H6yAONcgDIAVQ3Lci5NSm3PEJ3q8aoGUNJ2k7Nhp1T3D4yNEq6NbEgriJGU2yDQWEl6OfRhrmwPZcHgjbauGv00rpxbTeUT">
      <AuthProvider>
        <ApiProvider>
          <RootNavigator />
        </ApiProvider>
      </AuthProvider>
    </StripeProvider>
  );
};

export default App;