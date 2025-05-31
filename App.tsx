import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Search, Calendar, Trophy, User, Home } from 'lucide-react-native';

// Import fonts
import { fonts, fontFamily } from './src/config/fonts';
import { globalTextStyles } from './src/styles/globalStyles';

// Import colors
import { COLORS } from './src/constants/colors';

// Import the actual screens from src/screens
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import GamesScreen from './src/screens/GamesScreen';
import AccountScreen from './src/screens/AccountScreen';
import SchedulesScreen from './src/screens/SchedulesScreen';
import ScheduleDetails from './src/screens/ScheduleDetails';
import FindDetails from './src/screens/FindDetails';
import FindReview from './src/screens/FindReview';
import UpcomingDetails from './src/screens/UpcomingDetails';
import ProfileScreen from './src/screens/ProfileScreen';
import ManageNotificationsScreen from './src/screens/ManageNotificationsScreen';
import ManageDoublePartnersScreen from './src/screens/ManageDoublePartnersScreen';

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
const MainStack = createNativeStackNavigator();

const ACTIVE_COLOR = COLORS.TEXT_PRIMARY;
const INACTIVE_COLOR = COLORS.TEXT_SECONDARY;

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
function FindDetailsWrapper({ route, navigation, setGamesRefreshTrigger, user, profile }: any) {
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
      user={user}
      profile={profile}
      onBack={handleBack}
      onAcceptGame={handleAcceptGame}
    />
  );
}

// CreateGameFlow wrapper for navigation
function CreateGameFlowWrapper({ route, navigation, setScheduleRefreshTrigger }: any) {
  const handleClose = () => {
    navigation.goBack();
  };

  const handleGameCreated = (gameId: string) => {
    console.log('Game created with ID:', gameId);
    
    // Trigger schedule refresh
    setScheduleRefreshTrigger((prev: number) => prev + 1);
    
    // Navigate back to schedules
    navigation.goBack();
  };

  return (
    <CreateGameFlow 
      onClose={handleClose} 
      onGameCreated={handleGameCreated}
    />
  );
}

// FindReview wrapper for navigation
function FindReviewWrapper({ route, navigation, setGamesRefreshTrigger, user, profile }: any) {
  const { game, onAcceptGame } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleAcceptGame = async (gameId: string, phoneNumber: string, notes?: string) => {
    try {
      const { authService } = await import('./src/services/authService');
      const { gameService } = await import('./src/services/gameService');
      
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Here you could save phone number and notes to user profile if needed
        const result = await gameService.joinGame(gameId, currentUser.id);
        if (result.success) {
          console.log('Game accepted successfully!');
          
          // Trigger games refresh
          setGamesRefreshTrigger((prev: number) => prev + 1);
          
          // Navigate to Games tab
          navigation.navigate('TabNavigator', { screen: 'Games' });
        } else {
          console.error('Failed to accept game:', result.error);
        }
      }
    } catch (error) {
      console.error('Error accepting game:', error);
    }
  };

  return (
    <FindReview
      game={game}
      user={user}
      profile={profile}
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

// ProfileScreen wrapper for navigation
function ProfileScreenWrapper({ route, navigation }: any) {
  const { user, profile, onSaveProfile } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleSaveProfile = async (updatedProfile: Partial<Profile>) => {
    try {
      // TODO: Implement actual profile update logic with authService
      console.log('Saving profile:', updatedProfile);
      if (onSaveProfile) {
        await onSaveProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  return (
    <ProfileScreen
      user={user}
      profile={profile}
      onBack={handleBack}
      onSaveProfile={handleSaveProfile}
    />
  );
}

// ManageNotificationsScreen wrapper for navigation
function ManageNotificationsScreenWrapper({ route, navigation }: any) {
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ManageNotificationsScreen
      onBack={handleBack}
    />
  );
}

// ManageDoublePartnersScreen wrapper for navigation
function ManageDoublePartnersScreenWrapper({ route, navigation }: any) {
  const handleBack = () => {
    navigation.goBack();
  };

  const handleCreateNewPartner = () => {
    // TODO: Navigate to CreatePartnerStep or similar
    console.log('Create new partner pressed');
  };

  const handleSelectPartner = (partnerName: string) => {
    // TODO: Handle partner selection
    console.log('Selected partner:', partnerName);
  };

  return (
    <ManageDoublePartnersScreen
      onBack={handleBack}
      onCreateNewPartner={handleCreateNewPartner}
      onSelectPartner={handleSelectPartner}
    />
  );
}

// Tab Navigator Component
function TabNavigator({ user, profile, onCreateGame, refreshTrigger, gamesRefreshTrigger, onNavigateToSchedules, onNavigateToGames, onSignOut, navigationRef }: any) {
  
  const handleNavigateToProfile = () => {
    navigationRef.current?.navigate('Profile', { 
      user, 
      profile,
      onSaveProfile: async (updatedProfile: Partial<Profile>) => {
        // TODO: Implement profile update logic
        console.log('Saving profile:', updatedProfile);
      }
    });
  };

  const handleNavigateToNotifications = () => {
    navigationRef.current?.navigate('ManageNotifications');
  };

  const handleNavigateToDoublePartners = () => {
    navigationRef.current?.navigate('ManageDoublePartners');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'InterTight-ExtraBold',
          fontWeight: '800',
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
              strokeWidth={2}
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
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Search 
              size={24} 
              color={focused ? ACTIVE_COLOR : INACTIVE_COLOR}
              strokeWidth={2}
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
              strokeWidth={2}
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
              strokeWidth={2}
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
              strokeWidth={2}
            />
          ),
        }}
      >
        {() => (
          <AccountScreen
            user={user}
            profile={profile!}
            onSignOut={onSignOut}
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToNotifications={handleNavigateToNotifications}
            onNavigateToDoublePartners={handleNavigateToDoublePartners}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
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
    navigationRef.current?.navigate('CreateGameFlow');
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
        <ExpoStatusBar style="dark" />
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
        <ExpoStatusBar style="dark" />
        <AuthFlow onAuthComplete={handleAuthComplete} />
      </SafeAreaProvider>
    );
  }

  // Show main app if authenticated
  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="dark" />
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
                  navigationRef={navigationRef}
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
                  user={user}
                  profile={profile}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="FindReview"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <FindReviewWrapper
                  route={route}
                  navigation={navigation}
                  setGamesRefreshTrigger={setGamesRefreshTrigger}
                  user={user}
                  profile={profile}
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
            <MainStack.Screen
              name="CreateGameFlow"
              options={{
                headerShown: false,
                presentation: 'modal',
                animationTypeForReplace: 'push',
                animation: 'slide_from_bottom',
              }}
            >
              {({ route, navigation }: any) => (
                <CreateGameFlowWrapper
                  route={route}
                  navigation={navigation}
                  setScheduleRefreshTrigger={setScheduleRefreshTrigger}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="Profile"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <ProfileScreenWrapper
                  route={route}
                  navigation={navigation}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="ManageNotifications"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <ManageNotificationsScreenWrapper
                  route={route}
                  navigation={navigation}
                />
              )}
            </MainStack.Screen>
            <MainStack.Screen
              name="ManageDoublePartners"
              options={{ headerShown: false }}
            >
              {({ route, navigation }: any) => (
                <ManageDoublePartnersScreenWrapper
                  route={route}
                  navigation={navigation}
                />
              )}
            </MainStack.Screen>
          </MainStack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
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
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingBottom: 48,
    paddingTop: 0,
    height: 100,
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