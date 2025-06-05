import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import WelcomeScreen from './WelcomeScreen';
import CitySelectionScreen from './CitySelectionScreen';
import SportSelectionScreen from './SportSelectionScreen';
import SignUpScreen from './SignUpScreen';
import LoginScreen from './LoginScreen';
import PersonalInfoScreen from './PersonalInfoScreen';
import AvatarScreen from './AvatarScreen';
import EmailVerificationScreen from './EmailVerificationScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ResetPasswordScreen from './ResetPasswordScreen';
import { UserData } from '../../lib/supabase';
import { authService } from '../../services/authService';

const AuthStack = createNativeStackNavigator();

export default function AuthFlow() {
  const [userData, setUserData] = useState<Partial<UserData & { password: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [initialRouteName, setInitialRouteName] = useState('Welcome');

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
          setInitialRouteName('Reset');
          return;
        }
        
        // Check if this is an email confirmation link
        if (event.url.includes('type=email_confirmation') || 
            event.url.includes('confirmation=true') ||
            event.url.includes('access_token') ||
            event.url.includes('refresh_token') ||
            urlParams.get('type') === 'email_confirmation' ||
            urlParams.get('type') === 'signup') {
          console.log('📧 Detected email confirmation link');
          
          // Wait a moment for the auth state to update
          setTimeout(async () => {
            try {
              console.log('🔄 Checking user session after email confirmation...');
              const user = await authService.getCurrentUser();
              if (user) {
                console.log('✅ User confirmed, continuing to profile setup');
                setVerifiedUserId(user.id);
                setInitialRouteName('Personal');
              } else {
                console.log('⚠️ No user found after confirmation, trying to refresh session...');
                
                // Try to refresh the session first
                await authService.forceAuthStateRefresh();
                
                // Wait a bit more and try again
                setTimeout(async () => {
                  const retryUser = await authService.getCurrentUser();
                  if (retryUser) {
                    console.log('✅ User found on retry, continuing to profile setup');
                    setVerifiedUserId(retryUser.id);
                    setInitialRouteName('Personal');
                  } else {
                    console.log('❌ Still no user found, asking to sign in');
                    Alert.alert('Verification Complete', 'Please sign in to continue setting up your profile');
                    setInitialRouteName('Login');
                  }
                }, 2000);
              }
            } catch (error) {
              console.error('Error after email confirmation:', error);
              Alert.alert('Verification Complete', 'Please sign in to continue');
              setInitialRouteName('Login');
            }
          }, 1500);
          return;
        }
        
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
            setInitialRouteName('Reset');
          }
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
  }, []);

  const handleCreateProfile = useCallback(async () => {
    try {
      console.log('🚀 Creating profile for verified user:', verifiedUserId);
      
      if (!verifiedUserId) {
        console.error('❌ No verified user ID');
        Alert.alert('Error', 'User not verified');
        return;
      }

      if (!userData.name || !userData.lastname || !userData.level) {
        console.error('❌ Missing user data:', userData);
        Alert.alert('Error', 'Please complete all required information');
        return;
      }
      
      // Create profile for the verified user
      const response = await authService.createProfile(verifiedUserId, userData as UserData);
      
      if (response.success) {
        console.log('✅ Profile created successfully!');
        
        // Force auth state refresh
        await authService.forceAuthStateRefresh();
        
        // Additional refreshes with delays
        setTimeout(async () => {
          await authService.forceAuthStateRefresh();
        }, 1000);
        
        setTimeout(async () => {
          await authService.forceAuthStateRefresh();
        }, 2000);
        
      } else {
        console.error('❌ Failed to create profile:', response.error);
        Alert.alert('Profile Creation Failed', response.error || 'Failed to create profile');
      }
    } catch (error: any) {
      console.error('💥 Profile creation error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    }
  }, [verifiedUserId, userData]);

  const updateUserData = useCallback((data: Partial<UserData & { password: string }>) => {
    setUserData(prev => ({ ...prev, ...data }));
  }, []);

  return (
    <NavigationContainer>
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
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="City">
          {({ navigation }) => (
            <CitySelectionScreen
              onCitySelected={(city: string) => {
                updateUserData({ city });
                navigation.navigate('Sport');
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Sport">
          {({ navigation }) => (
            <SportSelectionScreen
              onSportSelected={() => navigation.navigate('SignUp')}
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
                Alert.alert(
                  'Check Your Email',
                  'We sent you a password reset link. Click the link in the email to reset your password.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate('Login')
                    }
                  ]
                );
              }}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Reset">
          {({ navigation }) => (
            <ResetPasswordScreen
              onBack={() => navigation.navigate('Login')}
              onPasswordReset={() => {
                console.log('✅ Password reset successful');
                navigation.navigate('Login');
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
              onBack={() => navigation.goBack()}
              isCompletingRegistration={!!verifiedUserId}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Avatar">
          {({ navigation }) => (
            <AvatarScreen
              onAvatarComplete={async (avatarUri: string) => {
                console.log('🖼️ Avatar selected, starting profile creation...');
                updateUserData({ avatarUri });
                await handleCreateProfile();
              }}
              userData={{
                name: userData.name || 'User',
                lastname: userData.lastname || '',
                level: userData.level || 'Beginner'
              }}
              onBack={() => navigation.goBack()}
            />
          )}
        </AuthStack.Screen>

        <AuthStack.Screen name="Verification">
          {({ navigation }) => (
            <EmailVerificationScreen
              email={userData.email || ''}
              password={userData.password}
              onVerificationComplete={async () => {
                console.log('📧 Email verification complete!');
                
                try {
                  const user = await authService.getCurrentUser();
                  if (user) {
                    console.log('✅ User session found:', user.id);
                    setVerifiedUserId(user.id);
                    navigation.navigate('Personal');
                  } else {
                    console.log('⏳ Waiting for session to be ready...');
                    setTimeout(async () => {
                      const retryUser = await authService.getCurrentUser();
                      if (retryUser) {
                        console.log('✅ User session found on retry:', retryUser.id);
                        setVerifiedUserId(retryUser.id);
                        navigation.navigate('Personal');
                      } else {
                        Alert.alert('Session Error', 'Please try logging in manually');
                        navigation.navigate('Login');
                      }
                    }, 1000);
                  }
                } catch (error) {
                  console.error('Error getting user session:', error);
                  Alert.alert('Session Error', 'Please try logging in manually');
                  navigation.navigate('Login');
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