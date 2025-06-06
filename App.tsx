import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, LogBox } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Search, Calendar, Trophy, User, Home } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { InterTight_800ExtraBold } from '@expo-google-fonts/inter-tight';

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
import FilterScreen from './src/screens/FilterScreen';
import CreatePartnerScreen from './src/screens/CreatePartnerScreen';
import EditPartnerScreen from './src/screens/EditPartnerScreen';

// Import the CreateGameFlow component
import CreateGameFlow from './src/components/create_game_flow/CreateGameFlow';

// Import the AuthFlow component
import AuthFlow from './src/screens/auth/AuthFlow';

// Import auth service and types
import { authService } from './src/services/authService';
import { gameService } from './src/services/gameService';
import { Profile } from './src/lib/supabase';

// Import UI components for fallback CreateScreen
import TopBar from './src/components/ui/TopBar';

// Import notification service
import { notificationService } from './src/services/notificationService';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const MainStack = createNativeStackNavigator();

const ACTIVE_COLOR = COLORS.TEXT_PRIMARY;
const INACTIVE_COLOR = COLORS.TEXT_SECONDARY;

const linking = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      ResetPassword: 'reset-password',
    },
  },
};

// ScheduleDetails wrapper for navigation
function ScheduleDetailsWrapper({ route, navigation, setScheduleRefreshTrigger }: any) {
  const { schedule, user, onRefresh } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!user?.id) return;

    try {
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
      const currentUser = await authService.getCurrentUser();
      if (currentUser && profile) {
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
    console.log('Game scheduled with ID:', gameId);
    
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
      const currentUser = await authService.getCurrentUser();
      if (currentUser && profile) {
        // Note: phoneNumber and notes are collected in UI but joinGame only needs gameId and userId
        const result = await gameService.joinGame(gameId, currentUser.id);
        if (result.success) {
          console.log('Game accepted successfully!');
          
          // Trigger games refresh
          setGamesRefreshTrigger((prev: number) => prev + 1);
          
          // Show success alert and navigate to Games
          Alert.alert(
            'Game Accepted!',
            `You've successfully joined the game. The game details have been added to your Games tab.`,
            [
              {
                text: 'View My Games',
                onPress: () => {
                  // Navigate to Games tab
                  navigation.navigate('TabNavigator', { screen: 'Games' });
                },
              },
            ],
            { cancelable: false }
          );
        } else {
          console.error('Failed to accept game:', result.error);
          
          // Check if the error is about session expiration
          if (result.error?.includes('Session expired') || result.error?.includes('JWT expired')) {
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please log in again to continue.',
              [
                { text: 'OK', onPress: () => {
                  // Navigate back to previous screen
                  navigation.goBack();
                }}
              ]
            );
          } else {
            Alert.alert('Error', result.error || 'Failed to join the game. Please try again.');
          }
        }
      } else {
        Alert.alert('Error', 'Please log in to join games.');
      }
    } catch (error: any) {
      console.error('Error accepting game:', error);
      
      // Check for JWT expired in catch block too
      if (error.message?.includes('JWT expired') || error.message?.includes('Session expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again to continue.',
          [
            { text: 'OK', onPress: () => {
              navigation.goBack();
            }}
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      }
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
      console.log('Saving profile:', updatedProfile);
      
      // Get current user - with fallback to props user
      let currentUser = await authService.getCurrentUser();
      
      // If getCurrentUser fails, use the user from props as fallback
      if (!currentUser && user?.id) {
        console.log('⚠️ getCurrentUser returned null, using user from props as fallback');
        currentUser = user;
      }
      
      // If user.id is still undefined, try to use profile.id as ultimate fallback
      if ((!currentUser || !currentUser.id) && profile?.id) {
        console.log('⚠️ User ID is undefined, using profile.id as fallback');
        currentUser = { ...currentUser, id: profile.id };
      }
      
      if (!currentUser || !currentUser.id) {
        console.error('❌ No valid user found for profile update');
        throw new Error('No valid session found. Please log in again.');
      }
      
      console.log('✅ Using user for profile update:', currentUser.id);
      
      // Update profile using authService
      const result = await authService.updateProfile(currentUser.id, updatedProfile);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }
      
      console.log('✅ Profile updated successfully');
      
      // The auth state listener will automatically refresh the profile data
      
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

  const handleNavigateToCreatePartner = () => {
    navigation.navigate('CreatePartner');
  };

  const handleNavigateToEditPartner = (partner: any) => {
    navigation.navigate('EditPartner', { partner });
  };

  return (
    <ManageDoublePartnersScreen
      onBack={handleBack}
      onNavigateToCreatePartner={handleNavigateToCreatePartner}
      onNavigateToEditPartner={handleNavigateToEditPartner}
    />
  );
}

// CreatePartnerScreen wrapper for navigation
function CreatePartnerScreenWrapper({ route, navigation }: any) {
  const handleBack = () => {
    navigation.goBack();
  };

  const handlePartnerCreated = () => {
    // Navigate back and refresh the calling screen
    navigation.goBack();
  };

  return (
    <CreatePartnerScreen
      onBack={handleBack}
      onPartnerCreated={handlePartnerCreated}
    />
  );
}

// FilterScreen wrapper for navigation
function FilterScreenWrapper({ route, navigation }: any) {
  const { filters } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handleApplyFilters = (newFilters: any) => {
    // Use setParams to return the filters to the calling screen
    navigation.navigate({
      name: 'TabNavigator',
      params: { 
        screen: 'Search',
        params: { appliedFilters: newFilters }
      },
      merge: true,
    });
  };

  return (
    <FilterScreen
      filters={filters}
      onBack={handleBack}
      onApplyFilters={handleApplyFilters}
    />
  );
}

// EditPartnerScreen wrapper for navigation
function EditPartnerScreenWrapper({ route, navigation }: any) {
  const { partner } = route.params;
  
  const handleBack = () => {
    navigation.goBack();
  };

  const handlePartnerUpdated = () => {
    // Navigate back and refresh the calling screen
    navigation.goBack();
  };

  return (
    <EditPartnerScreen
      partner={partner}
      onBack={handleBack}
      onPartnerUpdated={handlePartnerUpdated}
    />
  );
}

// Tab Navigator Component
function TabNavigator({ user, profile, onCreateGame, refreshTrigger, gamesRefreshTrigger, onNavigateToSchedules, onNavigateToGames, onNavigateToDoublePartners, onSignOut, navigationRef, onProfileUpdate }: any) {
  
  const handleNavigateToProfile = () => {
    navigationRef.current?.navigate('Profile', { 
      user, 
      profile,
      onSaveProfile: async (updatedProfile: Partial<Profile>) => {
        try {
          console.log('📋 TabNavigator - Saving profile:', updatedProfile);
          
          // Get current user
          let currentUser = await authService.getCurrentUser();
          
          // Fallbacks for user ID
          if (!currentUser && user?.id) {
            currentUser = user;
          }
          if ((!currentUser || !currentUser.id) && profile?.id) {
            currentUser = { ...currentUser, id: profile.id };
          }
          
          if (!currentUser || !currentUser.id) {
            throw new Error('No valid session found. Please log in again.');
          }
          
          // Update profile using authService
          const result = await authService.updateProfile(currentUser.id, updatedProfile);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to update profile');
          }
          
          console.log('✅ TabNavigator - Profile updated successfully');
          
          // Force refresh the profile data in the main app
          if (onProfileUpdate) {
            console.log('🔄 Triggering profile refresh in main app');
            await onProfileUpdate(currentUser.id);
          }
          
        } catch (error) {
          console.error('💥 TabNavigator - Error saving profile:', error);
          throw error;
        }
      }
    });
  };

  const handleNavigateToNotifications = () => {
    navigationRef.current?.navigate('ManageNotifications');
  };

  const handleNavigateToDoublePartners = () => {
    navigationRef.current?.navigate('ManageDoublePartners');
  };

  const handleNavigateToAccount = () => {
    navigationRef.current?.navigate('TabNavigator', { screen: 'Account' });
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
            onSignOut={onSignOut}
            onNavigateToAccount={handleNavigateToAccount}
            onNavigateToDoublePartners={onNavigateToDoublePartners}
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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const [gamesRefreshTrigger, setGamesRefreshTrigger] = useState(0);

  const navigationRef = React.useRef<any>(null);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    InterTight_800ExtraBold,
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (currentUser, currentProfile) => {
        console.log('🔄 Auth state changed in App:', { 
          hasUser: !!currentUser, 
          hasProfile: !!currentProfile 
        });
        
        if (currentUser && currentProfile) {
          setUser(currentUser);
          setProfile(currentProfile);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Initialize notifications
    const initNotifications = async () => {
      const success = await notificationService.initialize();
      if (success) {
        console.log('🔔 Notifications initialized successfully');
      } else {
        console.log('❌ Failed to initialize notifications');
      }
    };

    initNotifications();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Current user found:', currentUser.id);
        // Intentar obtener el perfil sin hacer logs de error
        try {
          const userProfile = await authService.getProfile(currentUser.id);
          
          if (userProfile) {
            console.log('✅ Profile loaded successfully');
            setUser(currentUser);
            setProfile(userProfile);
            setIsAuthenticated(true);
          } else {
            // Es normal que no haya perfil si el usuario es nuevo
            console.log('📝 No profile yet - user needs to complete profile setup');
            setUser(currentUser);
            setProfile(null);
            setIsAuthenticated(false); // No está completamente autenticado hasta que tenga perfil
          }
        } catch (profileError: any) {
          // Si es un error 406 (no rows found), es esperado para usuarios nuevos
          if (profileError.message?.includes('No rows found')) {
            console.log('📝 New user - needs to create profile');
            setUser(currentUser);
            setProfile(null);
            setIsAuthenticated(false);
          } else {
            // Solo loggear errores reales
            console.error('Error getting profile:', profileError);
            setIsAuthenticated(false);
          }
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

  // Function to refresh profile data from database
  const refreshProfile = async (userId: string) => {
    try {
      console.log('🔄 Refreshing profile data for user:', userId);
      
      // Clear any cached profile data
      await AsyncStorage.removeItem(`profile_${userId}`);
      await AsyncStorage.removeItem(`profile_cache_time_${userId}`);
      
      // Get fresh profile data
      const freshProfile = await authService.getProfile(userId);
      if (freshProfile) {
        console.log('✅ Profile refreshed successfully');
        setProfile(freshProfile);
      } else {
        console.log('⚠️ No profile found during refresh');
      }
    } catch (error) {
      console.error('💥 Error refreshing profile:', error);
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
    navigationRef.current?.navigate('CreateGameFlow', {
      fromSchedules: true,
    });
  };

  const handleNavigateToSchedules = () => {
    navigationRef.current?.navigate('TabNavigator', { screen: 'Schedules' });
  };

  const handleNavigateToGames = () => {
    navigationRef.current?.navigate('TabNavigator', { screen: 'Search' });
  };

  const handleNavigateToDoublePartners = () => {
    navigationRef.current?.navigate('ManageDoublePartners');
  };

  // Determine which screen to show
  if (isLoading || !fontsLoaded) {
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

  // ONLY show main app if user has BOTH account AND complete profile
  if (user && profile) {
    console.log('📱 Showing main app - User:', !!user, 'Profile:', !!profile);
    console.log('✅ User has complete profile, showing main app');
    
    return (
      <SafeAreaProvider>
        <ExpoStatusBar style="dark" />
        <SafeAreaView style={styles.container} edges={['top']}>
          <NavigationContainer ref={navigationRef} linking={linking}>
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
                    onNavigateToDoublePartners={handleNavigateToDoublePartners}
                    onSignOut={handleSignOut}
                    navigationRef={navigationRef}
                    onProfileUpdate={refreshProfile}
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
              <MainStack.Screen
                name="CreatePartner"
                options={{ headerShown: false }}
              >
                {({ route, navigation }: any) => (
                  <CreatePartnerScreenWrapper
                    route={route}
                    navigation={navigation}
                  />
                )}
              </MainStack.Screen>
              <MainStack.Screen
                name="Filter"
                options={{ headerShown: false }}
              >
                {({ route, navigation }: any) => (
                  <FilterScreenWrapper
                    route={route}
                    navigation={navigation}
                  />
                )}
              </MainStack.Screen>
              <MainStack.Screen
                name="EditPartner"
                options={{ headerShown: false }}
              >
                {({ route, navigation }: any) => (
                  <EditPartnerScreenWrapper
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

  // If user exists but no profile, OR no user at all, show auth flow
  if (user && !profile) {
    console.log('⚠️ User exists but profile incomplete - showing auth flow to complete registration');
  } else {
    console.log('🔑 No user found - showing auth flow');
  }
  
  return (
    <SafeAreaProvider>
      <ExpoStatusBar style="dark" />
      <AuthFlow />
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