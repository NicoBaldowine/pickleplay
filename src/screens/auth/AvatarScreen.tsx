import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import colors and utilities
import { COLORS } from '../../constants/colors';
import { createAvatarsBucket } from '../../utils/createAvatarsBucket';
import { supabaseClient } from '../../lib/supabase';

interface AvatarScreenProps {
  onBack: () => void;
  onAvatarComplete: (imageUri: string) => Promise<void>;
  userData: {
    name: string;
    lastname: string;
    level: string;
  };
}

const AvatarScreen: React.FC<AvatarScreenProps> = ({ onBack, onAvatarComplete, userData }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Upload avatar image to Supabase Storage
  const uploadAvatarImage = async (imageUri: string): Promise<string | null> => {
    try {
      console.log('📤 Starting avatar upload...');
      
      // Use anon key instead of service role - this works for authenticated users
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';
      
      // Get fresh session for current user
      let accessToken = SUPABASE_ANON_KEY; // Default to anon key
      
      try {
        // Try to get the current session from AsyncStorage
        const storedSession = await AsyncStorage.getItem('supabase_session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          if (sessionData?.access_token && sessionData.expires_at > Date.now()) {
            accessToken = sessionData.access_token;
            console.log('✅ Using valid user session token');
          } else {
            console.log('⚠️ Session expired, using anon key');
          }
        } else {
          console.log('⚠️ No stored session, using anon key');
        }
      } catch (sessionError) {
        console.log('⚠️ Error reading session, using anon key:', sessionError);
      }

      console.log('✅ Proceeding with upload using available token');

      // Convert image to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Generate unique filename
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('📂 Uploading to path:', filePath);

      // Create form data
      const formData = new FormData();
      formData.append('file', blob as any, fileName);

      // Upload to Supabase Storage
      const uploadResponse = await fetch(
        'https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/avatars/' + filePath,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        // Get public URL
        const publicUrl = `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/public/avatars/${filePath}`;
        console.log('✅ Avatar uploaded successfully:', publicUrl);
        return publicUrl;
      } else {
        const uploadError = await uploadResponse.text();
        console.error('❌ Upload failed:', uploadError);
        
        // If bucket doesn't exist, create it with JS client
        if (uploadResponse.status === 404 || uploadResponse.status === 400) {
          console.log('🪣 Bucket not found, creating with JS client...');
          
          const bucketResult = await createAvatarsBucket();
          if (bucketResult.success) {
            console.log('✅ Bucket created with JS client, retrying upload...');
            
            // Retry upload
            const retryResponse = await fetch(
              'https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/avatars/' + filePath,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
              }
            );

            if (retryResponse.ok) {
              const publicUrl = `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/public/avatars/${filePath}`;
              console.log('✅ Avatar uploaded successfully after bucket creation:', publicUrl);
              return publicUrl;
            } else {
              const retryError = await retryResponse.text();
              console.error('❌ Retry upload failed:', retryError);
              return null;
            }
          } else {
            console.error('❌ Failed to create bucket with JS client:', bucketResult.error);
            return null;
          }
        }
        
        return null;
      }
      
    } catch (error) {
      console.error('💥 Error uploading avatar:', error);
      return null;
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'We need camera and photo library permissions to let you upload a profile picture.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to add your profile picture',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Photo Library',
          onPress: openImageLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      setIsLoading(true);
      
      // Add timeout to detect camera hangs (common in simulators)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Camera launch timeout - this often happens in simulators')), 10000);
      });

      const cameraPromise = ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      const result = await Promise.race([cameraPromise, timeoutPromise]) as ImagePicker.ImagePickerResult;

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('📷 Camera error:', error);
      if (error.message?.includes('timeout')) {
        Alert.alert(
          'Camera Issue',
          'Camera launch timed out (common in simulators). Please try "📱 Select from Gallery" instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to open camera. Please try the gallery option.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openImageLibrary = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    setIsCreatingAccount(true);
    try {
      if (selectedImage) {
        console.log('🖼️ Uploading avatar before creating profile...');
        
        // Upload image to Supabase Storage first
        const uploadedImageUrl = await uploadAvatarImage(selectedImage);
        
        if (uploadedImageUrl) {
          console.log('✅ Avatar uploaded, completing profile with URL:', uploadedImageUrl);
          await onAvatarComplete(uploadedImageUrl);
        } else {
          console.log('⚠️ Avatar upload failed, completing profile without avatar');
          Alert.alert(
            'Upload Failed',
            'Failed to upload profile picture. Your account will be created without a profile picture.',
            [
              {
                text: 'Continue',
                onPress: async () => {
                  await onAvatarComplete('');
                }
              },
              {
                text: 'Try Again',
                style: 'cancel'
              }
            ]
          );
        }
      } else {
        console.log('📝 No image selected, creating account without avatar...');
        await onAvatarComplete('');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const fullName = `${userData.name} ${userData.lastname}`;
  const skillLevel = userData.level.charAt(0).toUpperCase() + userData.level.slice(1);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Picture</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={showImagePickerOptions}
            disabled={isLoading || isCreatingAccount}
          >
            {isLoading ? (
              <View style={styles.avatarPlaceholder}>
                <ActivityIndicator size="large" color={COLORS.TEXT_PRIMARY} />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera size={40} color={COLORS.TEXT_PRIMARY} />
              </View>
            )}
          </TouchableOpacity>
          
          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{fullName}</Text>
            <Text style={styles.userLevel}>{skillLevel}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.createButton, isCreatingAccount && styles.createButtonDisabled]} 
          onPress={handleCreateAccount}
          disabled={isCreatingAccount}
        >
          {isCreatingAccount ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="white" />
              <Text style={[styles.createButtonText, styles.loadingText]}>
                {selectedImage ? 'Uploading & Creating Account...' : 'Creating Account...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>
              Create account
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
  },
  buttonContainer: {
    padding: 16,
  },
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AvatarScreen; 