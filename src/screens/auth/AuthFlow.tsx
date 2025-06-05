import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Alert, Keyboard } from 'react-native';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
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

export default function AuthFlow() {
  const [currentScreen, setCurrentScreen] = useState<
    'welcome' | 'city' | 'sport' | 'signup' | 'login' | 'verification' | 'personal' | 'avatar' | 'forgot' | 'reset'
  >('welcome');

  const [userData, setUserData] = useState<Partial<UserData & { password: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  // Handle deep linking for password reset
  useEffect(() => {
    const handleDeepLink = async (event: Linking.EventType) => {
      console.log('🔗 AuthFlow deep link received:', event.url);
      console.log('🔍 Full URL details:', JSON.stringify(event, null, 2));
      
      try {
        // Parse URL parameters for detailed analysis
        const url = new URL(event.url);
        const urlParams = new URLSearchParams(url.search || url.hash?.substring(1) || '');
        console.log('🔍 URL params:', Object.fromEntries(urlParams.entries()));
        
        // Check if this is a reset password link
        if (event.url.includes('reset-password') || event.url.includes('type=recovery')) {
          console.log('🔑 Detected reset password link, navigating to reset screen');
          setCurrentScreen('reset');
          return;
        }
        
        // Check if this is an email confirmation link - be more comprehensive
        if (event.url.includes('type=email_confirmation') || 
            event.url.includes('confirmation=true') ||
            event.url.includes('access_token') ||
            event.url.includes('refresh_token') ||
            urlParams.get('type') === 'email_confirmation' ||
            urlParams.get('type') === 'signup') {
          console.log('📧 Detected email confirmation link');
          console.log('🔍 Confirmation parameters found');
          
          // Wait a moment for the auth state to update
          setTimeout(async () => {
            try {
              console.log('🔄 Checking user session after email confirmation...');
              const user = await authService.getCurrentUser();
              if (user) {
                console.log('✅ User confirmed, continuing to profile setup');
                setVerifiedUserId(user.id);
                setCurrentScreen('personal');
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
                    setCurrentScreen('personal');
                  } else {
                    console.log('❌ Still no user found, asking to sign in');
                    Alert.alert('Verification Complete', 'Please sign in to continue setting up your profile');
                    setCurrentScreen('login');
                  }
                }, 2000);
              }
            } catch (error) {
              console.error('Error after email confirmation:', error);
              Alert.alert('Verification Complete', 'Please sign in to continue');
              setCurrentScreen('login');
            }
          }, 1500);
          return;
        }
        
        console.log('ℹ️ Link not handled by AuthFlow, ignoring');
      } catch (error) {
        console.error('💥 Error handling deep link:', error);
        // Don't crash, just log and continue
      }
    };

    // Check if app was opened with a URL
    const checkInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🚀 AuthFlow opened with URL:', initialUrl);
          
          // Parse initial URL too
          try {
            const url = new URL(initialUrl);
            const urlParams = new URLSearchParams(url.search || url.hash?.substring(1) || '');
            console.log('🔍 Initial URL params:', Object.fromEntries(urlParams.entries()));
          } catch (parseError) {
            console.log('Could not parse initial URL params');
          }
          
          if (initialUrl.includes('reset-password') || initialUrl.includes('type=recovery')) {
            console.log('🔑 Initial URL is reset password, navigating to reset screen');
            setCurrentScreen('reset');
          }
        }
      } catch (error) {
        console.error('Error checking initial URL:', error);
        // Don't crash, just continue with normal flow
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
      console.log('🔍 Current userData state:', userData);
      
      if (!verifiedUserId) {
        console.error('❌ No verified user ID');
        Alert.alert('Error', 'User not verified');
        return;
      }

      if (!userData.name || !userData.lastname || !userData.level) {
        console.error('❌ Missing user data:', userData);
        console.error('❌ Missing fields - name:', !userData.name, 'lastname:', !userData.lastname, 'level:', !userData.level);
        Alert.alert('Error', 'Please complete all required information');
        return;
      }
      
      console.log('📋 Creating profile with data:', {
        userId: verifiedUserId,
        name: userData.name,
        lastname: userData.lastname,
        level: userData.level,
        city: userData.city,
        avatarUri: userData.avatarUri,
        email: userData.email
      });
      
      // Create profile for the verified user
      const response = await authService.createProfile(verifiedUserId, userData as UserData);
      
      if (response.success) {
        console.log('✅ Profile created successfully!');
        
        // Force multiple auth state refreshes to ensure the profile is detected
        console.log('🔄 Forcing auth state refresh...');
        await authService.forceAuthStateRefresh();
        
        // Wait a bit and try again to ensure the profile is cached and detected
        setTimeout(async () => {
          console.log('🔄 Second auth state refresh...');
          await authService.forceAuthStateRefresh();
        }, 1000);
        
        // Give a longer delay to ensure everything is processed
        setTimeout(async () => {
          console.log('🔄 Final auth state refresh...');
          await authService.forceAuthStateRefresh();
          console.log('✅ Auth state refresh completed - app should navigate to home now');
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

  const handleNext = useCallback((screen: typeof currentScreen, data?: Partial<UserData & { password: string }>) => {
    console.log('🔄 Navigating to screen:', screen);
    
    // Dismiss keyboard when navigating to avoid keyboard issues
    Keyboard.dismiss();
    
    if (data) {
      setUserData(prev => ({ ...prev, ...data }));
      console.log('💾 Updated userData:', data);
    }
    setCurrentScreen(screen);
  }, []);

  const handleBack = useCallback((screen: typeof currentScreen) => {
    console.log('🔙 Going back to screen:', screen);
    
    // Dismiss keyboard when navigating back
    Keyboard.dismiss();
    
    setCurrentScreen(screen);
  }, []);

  const signUpProps = useMemo(() => ({
    onSignUp: (email: string, password: string) => 
      handleNext('personal', { email, password }),
    onGoogleSignUp: () => {
      console.log('Google signup');
    },
    onLoginPress: () => {
      console.log('🔄 SignUpScreen onLoginPress called, navigating to login');
      handleNext('login');
    },
    onEmailVerificationRequired: (email: string, password: string) => {
      console.log('📧 Email verification required for:', email);
      // Store email and password for later account creation
      setUserData(prev => ({ ...prev, email, password }));
      handleNext('verification');
    },
    onBack: () => handleNext('sport')
  }), [handleNext]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onSignUp={() => handleNext('city')}
            onLogin={() => handleNext('login')}
          />
        );

      case 'city':
        return (
          <CitySelectionScreen
            onCitySelected={(city: string) => handleNext('sport', { city })}
            onBack={() => handleNext('welcome')}
          />
        );

      case 'sport':
        return (
          <SportSelectionScreen
            onSportSelected={() => handleNext('signup')}
            onBack={() => handleNext('city')}
          />
        );

      case 'signup':
        return (
          <SignUpScreen
            {...signUpProps}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onLogin={async (email: string, password: string) => {
              console.log('Login attempt with:', email);
              setIsLoading(true);
              try {
                const response = await authService.signIn(email, password);
                
                if (response.success) {
                  console.log('✅ Login successful!');
                  // Login successful - the App component should handle navigation
                  // through the onAuthStateChange listener
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
              console.log('🔑 Navigating to forgot password with email:', email);
              setUserData(prev => ({ ...prev, email }));
              handleNext('forgot');
            }}
            onBack={() => handleNext('welcome')}
            isLoading={isLoading}
          />
        );

      case 'forgot':
        return (
          <ForgotPasswordScreen
            onBack={() => handleNext('login')}
            onEmailSent={(email: string) => {
              console.log('📧 Reset email sent to:', email);
              Alert.alert(
                'Check Your Email',
                'We sent you a password reset link. Click the link in the email to reset your password.',
                [
                  {
                    text: 'OK',
                    onPress: () => handleNext('login')
                  }
                ]
              );
            }}
          />
        );

      case 'reset':
        return (
          <ResetPasswordScreen
            onBack={() => handleNext('login')}
            onPasswordReset={() => {
              console.log('✅ Password reset successful');
              handleNext('login');
            }}
          />
        );

      case 'personal':
        return (
          <PersonalInfoScreen
            onComplete={(personalData: { name: string; lastname: string; level: string }) => 
              handleNext('avatar', personalData)
            }
            onBack={() => handleNext('signup')}
            isCompletingRegistration={!!verifiedUserId}
          />
        );

      case 'avatar':
        return (
          <AvatarScreen
            onAvatarComplete={async (avatarUri: string) => {
              console.log('🖼️ Avatar selected, starting profile creation...');
              setUserData(prev => ({ ...prev, avatarUri }));
              // After avatar, create profile for the verified user
              await handleCreateProfile();
            }}
            userData={{
              name: userData.name || 'User',
              lastname: userData.lastname || '',
              level: userData.level || 'Beginner'
            }}
            onBack={() => handleNext('personal')}
          />
        );

      case 'verification':
        return (
          <EmailVerificationScreen
            email={userData.email || ''}
            password={userData.password}
            onVerificationComplete={async () => {
              console.log('📧 Email verification complete!');
              
              // Try to get the user from the current session
              try {
                const user = await authService.getCurrentUser();
                if (user) {
                  console.log('✅ User session found:', user.id);
                  setVerifiedUserId(user.id);
                  handleNext('personal');
                } else {
                  // If no user found, it might be a timing issue
                  // Wait a bit and try again
                  console.log('⏳ Waiting for session to be ready...');
                  setTimeout(async () => {
                    const retryUser = await authService.getCurrentUser();
                    if (retryUser) {
                      console.log('✅ User session found on retry:', retryUser.id);
                      setVerifiedUserId(retryUser.id);
                      handleNext('personal');
                    } else {
                      Alert.alert('Session Error', 'Please try logging in manually');
                      handleNext('login');
                    }
                  }, 1000);
                }
              } catch (error) {
                console.error('Error getting user session:', error);
                Alert.alert('Session Error', 'Please try logging in manually');
                handleNext('login');
              }
            }}
            onResendEmail={() => {
              console.log('📧 Resending verification email to:', userData.email);
            }}
            onStartOver={async () => {
              console.log('🔄 Starting over - clearing session and going to welcome');
              try {
                // Clear any existing session
                await authService.signOut();
                // Reset all state
                setUserData({});
                setVerifiedUserId(null);
                setCurrentScreen('welcome');
              } catch (error) {
                console.error('Error starting over:', error);
                setCurrentScreen('welcome');
              }
            }}
          />
        );

      default:
        return (
          <WelcomeScreen
            onSignUp={() => handleNext('city')}
            onLogin={() => handleNext('login')}
          />
        );
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
} 