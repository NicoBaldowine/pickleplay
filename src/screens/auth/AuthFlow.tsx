import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WelcomeScreen from './WelcomeScreen';
import CitySelectionScreen from './CitySelectionScreen';
import SignUpScreen from './SignUpScreen';
import LoginScreen from './LoginScreen';
import PersonalInfoScreen from './PersonalInfoScreen';
import AvatarScreen from './AvatarScreen';
import EmailVerificationScreen from './EmailVerificationScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import SetNewPasswordScreen from './SetNewPasswordScreen';
import ForgotPasswordVerificationScreen from './ForgotPasswordVerificationScreen';
import { UserData } from '../../lib/supabase';
import { authService } from '../../services/authService';

const AuthStack = createNativeStackNavigator();

interface AuthFlowProps {
  initialRouteName?: string;
  verifiedUserId?: string;
  userEmail?: string;
}

export default function AuthFlow({ 
  initialRouteName: propInitialRouteName = 'Welcome',
  verifiedUserId: propVerifiedUserId,
  userEmail: propUserEmail
}: AuthFlowProps) {
  const [userData, setUserData] = useState<Partial<UserData & { password: string }>>({
    email: propUserEmail || '', // Pre-populate email if provided
  });
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(propVerifiedUserId || null);
  const [initialRouteName, setInitialRouteName] = useState(propInitialRouteName);
  const [navigationRef, setNavigationRef] = useState<any>(null);

  // Log props for debugging
  useEffect(() => {
    console.log('🚀 AuthFlow mounted with props:', {
      propInitialRouteName,
      propVerifiedUserId,
      propUserEmail,
      finalInitialRouteName: initialRouteName,
      finalVerifiedUserId: verifiedUserId
    });
  }, [propInitialRouteName, propVerifiedUserId, propUserEmail, initialRouteName, verifiedUserId]);

  // Handle deep linking for password reset
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 AuthFlow deep link received:', event.url);
      
      try {
        // Parse URL parameters for detailed analysis
        const url = new URL(event.url);
        const urlParams = new URLSearchParams(url.search || url.hash?.substring(1) || '');
        
        // Check if this is a reset password link
        if (event.url.includes('reset-password') || event.url.includes('type=recovery')) {
          console.log('🔑 Detected reset password link, navigating to reset screen');
          
          // Extract and set session tokens from deep link
          try {
            const fragment = url.hash?.substring(1) || '';
            const params = new URLSearchParams(fragment);
            
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
              console.log('🔑 Found tokens in deep link, setting session...');
              
              // Import supabaseClient here to avoid circular dependencies
              const { supabaseClient } = require('../../lib/supabase');
              
              // Set the session using the tokens from the deep link
              await supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              console.log('✅ Session set successfully with tokens from deep link');
            }
          } catch (tokenError) {
            console.error('⚠️ Error setting session from tokens:', tokenError);
          }
          
          // If navigation is available, navigate directly
          if (navigationRef?.current) {
            console.log('🚀 Navigation available, resetting to Reset screen');
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'Reset' }],
            });
          } else {
            console.log('⚠️ Navigation not ready, setting initial route');
            setInitialRouteName('Reset');
          }
          return;
        }
        
        // Email verification will be handled directly by the verification system
        // Don't interfere with deep link routing here
        
        console.log('ℹ️ Link not handled by AuthFlow, ignoring');
      } catch (error) {
        console.error('💥 Error handling deep link:', error);
      }
    };

    // Check if app was opened with a URL
    const checkInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🚀 AuthFlow opened with URL:', initialUrl);
          
          if (initialUrl.includes('reset-password') || initialUrl.includes('type=recovery')) {
            console.log('🔑 Initial URL is reset password, navigating to reset screen');
            
            // Extract and set session tokens from initial URL
            try {
              const url = new URL(initialUrl);
              const fragment = url.hash?.substring(1) || '';
              const params = new URLSearchParams(fragment);
              
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              
              if (accessToken && refreshToken) {
                console.log('🔑 Found tokens in initial URL, setting session...');
                
                // Import supabaseClient here to avoid circular dependencies
                const { supabaseClient } = require('../../lib/supabase');
                
                // Set the session using the tokens from the initial URL
                await supabaseClient.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken
                });
                
                console.log('✅ Session set successfully with tokens from initial URL');
              }
            } catch (tokenError) {
              console.error('⚠️ Error setting session from initial URL tokens:', tokenError);
            }
            
            setInitialRouteName('Reset');
          }
          // Email verification URLs will be handled by the app's auth system
        }
      } catch (error) {
        console.error('Error checking initial URL:', error);
      }
    };

    checkInitialURL();

    // Listen for URL changes
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      linkingSubscription.remove();
    };
  }, [navigationRef]);

  const handleCreateProfile = useCallback(async (avatarUri?: string) => {
    try {
      console.log('🚀 Creating profile for verified user:', verifiedUserId);
      console.log('📋 User data for profile creation:', JSON.stringify(userData, null, 2));
      console.log('🖼️ Avatar URI for profile creation:', avatarUri);
      
      let effectiveUserId = verifiedUserId;
      
      if (!effectiveUserId) {
        console.log('⚠️ No verifiedUserId, trying to get current user...');
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          effectiveUserId = currentUser.id;
          console.log('✅ Got user ID from getCurrentUser:', effectiveUserId);
        } else {
          console.error('❌ No verified user ID and no current user');
          Alert.alert('Error', 'User not verified. Please try logging in again.');
          return;
        }
      }
      
      console.log('🎯 Using user ID for profile creation:', effectiveUserId);

      if (!userData.name || !userData.lastname || !userData.level) {
        console.error('❌ Missing user data:', JSON.stringify({
          hasName: !!userData.name,
          hasLastname: !!userData.lastname,
          hasLevel: !!userData.level,
          fullUserData: userData
        }, null, 2));
        Alert.alert('Error', 'Please complete all required information');
        return;
      }
      
      console.log('✅ All required data present, calling createProfile...');
      
      // Ensure email is included in userData
      const currentUser = await authService.getCurrentUser();
      const fullUserData = {
        ...userData,
        email: userData.email || currentUser?.email || '',
        avatarUri: avatarUri // Pass avatar URI directly
      };
      
      console.log('📋 Final userData with email and avatar:', JSON.stringify(fullUserData, null, 2));
      
      // Create profile for the verified user - use direct method for registration
      console.log('🔧 Using createProfileDirect for registration flow...');
      const response = await authService.createProfileDirect(effectiveUserId as string, fullUserData as UserData);
      
      console.log('📦 Profile creation response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('✅ Profile created successfully! Registration complete!');
        
        // Clear all cached data to force fresh load
        console.log('🧹 Clearing cached data...');
        await AsyncStorage.removeItem(`profile_${effectiveUserId}`);
        await AsyncStorage.removeItem(`profile_cache_time_${effectiveUserId}`);
        
        // Profile created successfully - force App.tsx to detect the change
        console.log('🎉 Registration flow completed! Forcing auth state refresh...');
        
        // Force refresh to trigger App.tsx auth state listener
        await authService.forceAuthStateRefresh();
        
        console.log('🔄 Auth state refreshed - App.tsx should now detect the profile and navigate to main app.');
        
      } else {
        console.error('❌ Failed to create profile:', response.error);
        console.error('📋 Full error response:', JSON.stringify(response, null, 2));
        Alert.alert('Profile Creation Failed', response.error || 'Failed to create profile. Please try again.');
      }
    } catch (error: any) {
      console.error('💥 Profile creation error:', error);
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', error.message || 'An unexpected error occurred. Please try again.');
    }
  }, [verifiedUserId, userData]);

  const updateUserData = useCallback((data: Partial<UserData & { password: string }>) => {
    setUserData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <NavigationContainer
      ref={(ref) => setNavigationRef(ref)}
    >
      <AuthStack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right', // Same as main app
        }}
      >
        <AuthStack.Screen name="Welcome">
          {({ navigation }) => (
            <WelcomeScreen
              onSignUp={() => navigation.navigate('City')}
              onLogin={() => navigation.navigate('Login')}
              hideSessionButton={true} // Always hide during auth flow
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="City">
          {({ navigation }) => (
            <CitySelectionScreen
              onCitySelected={(city: string) => {
                updateUserData({ city });
                navigation.navigate('SignUp');
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="SignUp">
          {({ navigation }) => (
            <SignUpScreen
              onSignUp={(email: string, password: string) => {
                updateUserData({ email, password });
                navigation.navigate('Personal');
              }}
              onGoogleSignUp={() => {
                console.log('Google signup');
              }}
              onLoginPress={() => navigation.navigate('Login')}
              onEmailVerificationRequired={(email: string, password: string) => {
                updateUserData({ email, password });
                navigation.navigate('Verification');
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onLogin={async (email: string, password: string) => {
                console.log('Login attempt with:', email);
                setIsLoading(true);
                try {
                  const response = await authService.signIn(email, password);
                  
                  if (response.success) {
                    console.log('✅ Login successful!');
                  } else {
                    setIsLoading(false);
                    Alert.alert(
                      'Login Failed', 
                      response.error || 'Invalid email or password'
                    );
                  }
                } catch (error: any) {
                  setIsLoading(false);
                  console.error('Login error:', error);
                  Alert.alert(
                    'Error', 
                    error.message || 'An unexpected error occurred'
                  );
                }
              }}
              onForgotPassword={(email: string) => {
                updateUserData({ email });
                navigation.navigate('Forgot');
              }}
              onBack={() => navigation.goBack()}
              isLoading={isLoading}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Forgot">
          {({ navigation }) => (
            <ForgotPasswordScreen
              onBack={() => navigation.goBack()}
              onEmailSent={(email: string) => {
                updateUserData({ email });
                navigation.navigate('ForgotVerification');
              }}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="ForgotVerification">
          {({ navigation }) => (
            <ForgotPasswordVerificationScreen
              email={userData.email || ''}
              onBack={() => navigation.goBack()}
              onPasswordResetLinkClicked={() => {
                console.log('🔑 Password reset link clicked, navigating to reset screen');
                navigation.navigate('Reset');
              }}
              onResendEmail={() => {
                console.log('📧 Resending password reset email');
                // TODO: Add resend functionality
              }}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Reset">
          {({ navigation }) => (
            <SetNewPasswordScreen
              onBack={() => navigation.navigate('Login')}
              onPasswordUpdated={() => {
                console.log('✅ Password updated successfully');
                Alert.alert(
                  'Password Updated!',
                  'Your password has been successfully updated. You can now log in with your new password.',
                  [
                    {
                      text: 'Continue to Login',
                      onPress: () => navigation.navigate('Login')
                    }
                  ]
                );
              }}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Personal">
          {({ navigation }) => (
            <PersonalInfoScreen
              onComplete={(personalData: { name: string; lastname: string; level: string }) => {
                updateUserData(personalData);
                navigation.navigate('Avatar');
              }}
              onProfileCreated={() => {
                console.log('✅ Profile created successfully from PersonalInfo! Navigating to avatar...');
                navigation.navigate('Avatar');
              }}
              onBack={() => navigation.goBack()}
              isCompletingRegistration={!!verifiedUserId}
              verifiedUserId={verifiedUserId || undefined}
              userData={userData}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Avatar">
          {({ navigation }) => (
            <AvatarScreen
              userData={{
                name: userData.name || 'User',
                lastname: userData.lastname || '',
                level: userData.level || 'Beginner'
              }}
              onBack={() => navigation.navigate('Personal')}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Verification">
          {({ navigation }) => (
            <EmailVerificationScreen
              email={userData.email || ''}
              password={userData.password}
              onVerificationComplete={async () => {
                console.log('📧 Email verification complete! Navigating to PersonalInfoScreen...');
                
                try {
                  // Get current user WITHOUT forcing auth refresh (avoid App.tsx interference)
                  const user = await authService.getCurrentUser();
                  if (user) {
                    console.log('✅ User session found after verification:', user.id);
                    console.log('🔧 Setting verifiedUserId to:', user.id);
                    setVerifiedUserId(user.id);
                    console.log('🚀 Navigating directly to Personal screen...');
                    navigation.navigate('Personal');
                  } else {
                    console.log('⚠️ No user found after verification, this is unexpected during registration');
                    Alert.alert('Verification Issue', 'Please try the registration process again.');
                    navigation.navigate('SignUp');
                  }
                } catch (error) {
                  console.error('Error in onVerificationComplete:', error);
                  Alert.alert('Verification Error', 'Please try the registration process again.');
                  navigation.navigate('SignUp');
                }
              }}
              onResendEmail={() => {
                console.log('📧 Resending verification email to:', userData.email);
              }}
              onStartOver={async () => {
                console.log('🔄 Starting over - clearing session and going to welcome');
                try {
                  await authService.signOut();
                  setUserData({});
                  setVerifiedUserId(null);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                  });
                } catch (error) {
                  console.error('Error starting over:', error);
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Welcome' }],
                  });
                }
              }}
            />
          )}
        </AuthStack.Screen>
      </AuthStack.Navigator>
    </NavigationContainer>
  );
} 