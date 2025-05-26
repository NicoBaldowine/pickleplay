import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Home, MessageSquare, Plus, Search, Calendar, Gamepad2, Trophy, User } from 'lucide-react-native';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Import fonts
import { fonts, fontFamily } from './src/config/fonts';
import { globalTextStyles } from './src/styles/globalStyles';

// Import the actual screens from src/screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import GamesScreen from './src/screens/GamesScreen';
import AccountScreen from './src/screens/AccountScreen';
import SchedulesScreen from './src/screens/SchedulesScreen';
import ScheduleDetails from './src/screens/ScheduleDetails';
import FindDetails from './src/screens/FindDetails';
import UpcomingDetails from './src/screens/UpcomingDetails';

// Import the CreateGameFlow component
import CreateGameFlow from './src/components/create_game_flow/CreateGameFlow';

// Import the AuthFlow component
import AuthFlow from './src/components/auth_flow/AuthFlow';

// Import auth service and types
import { authService } from './src/services/authService';
import { Profile } from './src/lib/supabase';

// Import UI components for fallback CreateScreen
import TopBar from './src/components/ui/TopBar';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const MainStack = createStackNavigator();

const ACTIVE_COLOR = '#000000';
const INACTIVE_COLOR = '#8E8E93';

// ScheduleDetails wrapper for navigation
function ScheduleDetailsWrapper({ route, navigation, setScheduleRefreshTrigger }: any) {
  const { schedule, user, onRefresh } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!user?.id) return;

    try {
      const { gameService } = await import('./src/services/gameService');
      const result = await gameService.deleteSchedule(scheduleId, user.id);
      if (result.success) {
        console.log('Schedule deleted successfully!');
        
        // Trigger refresh if callback provided
        if (onRefresh) {
          onRefresh();
        }
        
        // Also trigger the global schedule refresh for HomeScreen
        if (setScheduleRefreshTrigger) {
          setScheduleRefreshTrigger((prev: number) => prev + 1);
        }
        
        navigation.goBack();
      } else {
        console.error('Failed to delete schedule:', result.error);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  return (
    <ScheduleDetails
      schedule={schedule}
      onBack={handleBack}
      onDeleteSchedule={handleDeleteSchedule}
    />
  );
}

// FindDetails wrapper for navigation
function FindDetailsWrapper({ route, navigation, setGamesRefreshTrigger }: any) {
  const { game } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleAcceptGame = async (gameId: string, shouldNavigateToGames: boolean = false) => {
    try {
      const { authService } = await import('./src/services/authService');
      const { gameService } = await import('./src/services/gameService');
      
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const result = await gameService.joinGame(gameId, currentUser.id);
        if (result.success) {
          console.log('Game accepted successfully!');
          
          // Trigger games refresh
          setGamesRefreshTrigger((prev: number) => prev + 1);
          
          if (shouldNavigateToGames) {
            // Navigate to Games tab
            navigation.navigate('TabNavigator', { screen: 'Games' });
          } else {
            navigation.goBack();
          }
        } else {
          console.error('Failed to accept game:', result.error);
        }
      }
    } catch (error) {
      console.error('Error accepting game:', error);
    }
  };

  return (
    <FindDetails
      game={game}
      onBack={handleBack}
      onAcceptGame={handleAcceptGame}
    />
  );
}

// UpcomingDetails wrapper for navigation
function UpcomingDetailsWrapper({ route, navigation, setGamesRefreshTrigger }: any) {
  const { game } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleCancelGame = async (gameId: string) => {
    try {
      const { authService } = await import('./src/services/authService');
      const { gameService } = await import('./src/services/gameService');
      
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const result = await gameService.cancelGame(gameId, currentUser.id);
        if (result.success) {
          console.log('Game cancelled successfully!');
          
          // Trigger games refresh
          if (setGamesRefreshTrigger) {
            setGamesRefreshTrigger((prev: number) => prev + 1);
          }
          
          navigation.goBack();
        } else {
          console.error('Failed to cancel game:', result.error);
        }
      }
    } catch (error) {
      console.error('Error cancelling game:', error);
    }
  };

  return (
    <UpcomingDetails
      game={game}
      onBack={handleBack}
      onCancelGame={handleCancelGame}
    />
  );
}

// Tab Navigator Component
function TabNavigator({ user, profile, onCreateGame, refreshTrigger, gamesRefreshTrigger, onNavigateToSchedules, onNavigateToGames, onSignOut }: any) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          ...globalTextStyles.tabLabel,
          marginBottom: 2,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
          marginTop: 6,
        },
        tabBarItemStyle: {
          paddingBottom: 6,
          paddingTop: 6,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => (
            <Home 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      >
        {() => (
          <HomeScreen
            user={user}
            profile={profile || undefined}
            onNavigateToSchedules={onNavigateToSchedules}
            onNavigateToGames={onNavigateToGames}
            onSchedulePressFromHome={onNavigateToSchedules}
            refreshTrigger={refreshTrigger}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Find"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Search 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Schedules"
        options={{
          tabBarIcon: ({ focused }) => (
            <Calendar 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      >
        {() => (
          <SchedulesScreen
            user={user}
            profile={profile || undefined}
            onCreateGame={onCreateGame}
            refreshTrigger={refreshTrigger}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Games"
        options={{
          tabBarIcon: ({ focused }) => (
            <Trophy 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      >
        {() => (
          <GamesScreen
            refreshTrigger={gamesRefreshTrigger}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Account"
        options={{
          tabBarIcon: ({ focused }) => (
            <User 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR} 
            />
          ),
        }}
      >
        {() => (
          <AccountScreen
            user={user}
            profile={profile!}
            onSignOut={onSignOut}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const [gamesRefreshTrigger, setGamesRefreshTrigger] = useState(0);
  const navigationRef = useRef<any>(null);

  // Load fonts
  const [fontsLoaded] = useFonts(fonts);

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // Check authentication state on app start
  useEffect(() => {
    if (fontsLoaded) {
      checkAuthState();
    }
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange((user, profile) => {
      setUser(user);
      setProfile(profile);
      setIsAuthenticated(!!user && !!profile);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fontsLoaded]);

  const checkAuthState = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Current user found:', currentUser.id);
        const userProfile = await authService.getProfile(currentUser.id);
        
        if (userProfile) {
          console.log('✅ Profile loaded successfully');
          setUser(currentUser);
          setProfile(userProfile);
          setIsAuthenticated(true);
        } else {
          console.log('⚠️ No profile found for user');
          setIsAuthenticated(false);
        }
      } else {
        console.log('❌ No current user found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthComplete = (authenticatedUser: any, userProfile: Profile) => {
    setUser(authenticatedUser);
    setProfile(userProfile);
    setIsAuthenticated(true);
  };

  const handleSignOut = () => {
    setUser(null);
    setProfile(null);
    setIsAuthenticated(false);
  };

  const handleCreateGameFromSchedules = () => {
    setShowCreateModal(true);
  };

  const handleNavigateToSchedules = () => {
    navigationRef.current?.navigate('TabNavigator', { screen: 'Schedules' });
  };

  const handleNavigateToGames = () => {
    navigationRef.current?.navigate('TabNavigator', { screen: 'Games' });
  };

  // Show loading screen while checking auth state or loading fonts
  if (!fontsLoaded || isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // Show auth flow if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthFlow onAuthComplete={handleAuthComplete} />
      </SafeAreaProvider>
    );
  }

  // Show main app if authenticated
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.container} edges={['top']}>
        <NavigationContainer ref={navigationRef}>
          <MainStack.Navigator
            screenOptions={{
              headerShown: false,
            }}
          >
            <MainStack.Screen
              name="TabNavigator"
              options={{ headerShown: false }}
            >
              {() => (
                <TabNavigator
                  user={user}
                  profile={profile}
                  onCreateGame={handleCreateGameFromSchedules}
                  refreshTrigger={scheduleRefreshTrigger}
                  gamesRefreshTrigger={gamesRefreshTrigger}
                  onNavigateToSchedules={handleNavigateToSchedules}
                  onNavigateToGames={handleNavigateToGames}
                  onSignOut={handleSignOut}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="ScheduleDetails"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <ScheduleDetailsWrapper
                  route={route}
                  navigation={navigation}
                  setScheduleRefreshTrigger={setScheduleRefreshTrigger}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="FindDetails"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <FindDetailsWrapper
                  route={route}
                  navigation={navigation}
                  setGamesRefreshTrigger={setGamesRefreshTrigger}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="UpcomingDetails"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <UpcomingDetailsWrapper
                  route={route}
                  navigation={navigation}
                  setGamesRefreshTrigger={setGamesRefreshTrigger}
                />
              )}
            </MainStack.Screen>
          </MainStack.Navigator>

          <Modal
            visible={showCreateModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCreateModal(false)}
          >
            <CreateGameFlow 
              onClose={() => setShowCreateModal(false)} 
              onGameCreated={(gameId: string) => {
                console.log('Game created with ID:', gameId);
                setShowCreateModal(false);
                // Trigger schedule refresh
                setScheduleRefreshTrigger(prev => prev + 1);
              }}
            />
          </Modal>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...globalTextStyles.h2,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    ...globalTextStyles.h5,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...globalTextStyles.body,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
  tabBar: {
    backgroundColor: '#FEF2D6',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 40,
    paddingTop: 8,
    height: 100,
  },
  tabBarLabel: {
    ...globalTextStyles.tabLabel,
    marginBottom: 2,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...globalTextStyles.h5,
    color: '#333',
  },
});

// Registrar el componente principal con Expo
registerRootComponent(App); 