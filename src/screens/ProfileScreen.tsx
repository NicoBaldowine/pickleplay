import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StatusBar, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Import custom components
import TopBar from '../components/ui/TopBar';

// Import colors and Supabase config
import { COLORS } from '../constants/colors';
import { Profile, supabaseClient } from '../lib/supabase';

interface ProfileScreenProps {
  profile: Profile;
  user: any;
  onBack: () => void;
  onSaveProfile: (updatedProfile: Partial<Profile>) => void;
}

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ profile, user, onBack, onSaveProfile }) => {
  // Enhanced debug logging to understand the user object structure
  console.log('🔍 ProfileScreen props debug:', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userDataStructure: user?.data,
    hasProfile: !!profile,
    profileId: profile?.id,
    profileEmail: profile?.email
  });
  
  const [firstName, setFirstName] = useState(profile.full_name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(profile.full_name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(user?.email || profile?.email || '');
  const [selectedLevel, setSelectedLevel] = useState<string>(profile.pickleball_level || 'beginner');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Avatar states with better image handling
  const [avatarUri, setAvatarUri] = useState<string | undefined>(profile.avatar_url);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Shimmer animation
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  // Log initial avatar state
  console.log('🖼️ Initial avatar state:', {
    profileAvatarUrl: profile.avatar_url,
    avatarUri: avatarUri,
    hasAvatarUri: !!avatarUri
  });

  // Monitor avatarUri changes
  useEffect(() => {
    console.log('🔄 avatarUri state changed to:', avatarUri);
  }, [avatarUri]);

  // Start shimmer animation
  useEffect(() => {
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmer();
  }, [shimmerAnimation]);

  // Shimmer component
  const SkeletonShimmer = () => {
    const translateX = shimmerAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 80],
    });

    return (
      <Animated.View 
        style={[
          styles.skeletonShimmer,
          {
            transform: [{ translateX }],
          },
        ]} 
      />
    );
  };

  // Function to get the best available user ID
  const getBestUserId = (): string | null => {
    // Try user.id first
    if (user?.id) {
      console.log('✅ Using user.id:', user.id);
      return user.id;
    }
    
    // Try unwrapping user.data.id if it exists
    if (user?.data?.id) {
      console.log('✅ Using user.data.id:', user.data.id);
      return user.data.id;
    }
    
    // Try profile.id as fallback
    if (profile?.id) {
      console.log('⚠️ Using profile.id as user ID fallback:', profile.id);
      return profile.id;
    }
    
    console.error('❌ No valid user ID found from any source');
    return null;
  };

  const handleSaveChanges = async () => {
    console.log('💾 Save changes initiated');
    
    if (firstName.trim().length === 0) {
      Alert.alert('First Name Required', 'Please enter your first name.');
      return;
    }
    if (lastName.trim().length === 0) {
      Alert.alert('Last Name Required', 'Please enter your last name.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updatedProfile: Partial<Profile> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        pickleball_level: selectedLevel as any,
      };

      console.log('👤 Profile data to update:', updatedProfile);
      console.log('🖼️ Current avatar URI:', avatarUri);
      console.log('🖼️ Original avatar URL:', profile.avatar_url);

      // Handle avatar upload if a new image was selected
      if (avatarUri && avatarUri !== profile.avatar_url) {
        console.log('🔄 Avatar changed, processing...');
        
        // Check if it's a local URI (needs uploading) or already a URL
        if (avatarUri.startsWith('file://') || avatarUri.startsWith('content://')) {
          console.log('📤 Uploading new avatar image...');
          const uploadedUrl = await uploadAvatarImage(avatarUri);
          if (uploadedUrl) {
            updatedProfile.avatar_url = uploadedUrl;
            console.log('✅ Avatar uploaded successfully:', uploadedUrl);
          } else {
            console.log('❌ Avatar upload failed, continuing without avatar update');
            Alert.alert(
              'Upload Failed', 
              'Failed to upload profile picture. The profile will be saved without the new image.'
            );
          }
        } else {
          // It's already a URL, use it directly
          console.log('🔗 Avatar is already a URL, using directly');
          updatedProfile.avatar_url = avatarUri;
        }
      } else {
        console.log('📷 No avatar change detected');
      }
      
      console.log('📊 Final profile data to save:', updatedProfile);
      
      await onSaveProfile(updatedProfile);
      Alert.alert('Success', 'Your profile has been updated successfully.');
      onBack();
    } catch (error) {
      console.error('💥 Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setShowLevelDropdown(false);
  };

  const getSelectedLevelLabel = () => {
    const level = levelOptions.find(option => option.id === selectedLevel);
    return level ? level.label : 'Select level';
  };

  const isFormValid = firstName.trim().length > 0 && lastName.trim().length > 0;
  const isButtonActive = isFormValid && !isSubmitting && !isUploadingAvatar;

  const requestPermissions = async () => {
    console.log('🔐 Requesting permissions...');
    
    try {
      // Check current permission status first
      const cameraPermissions = await ImagePicker.getCameraPermissionsAsync();
      const mediaPermissions = await ImagePicker.getMediaLibraryPermissionsAsync();
      
      console.log('📋 Current permissions:', {
        camera: cameraPermissions,
        media: mediaPermissions
      });
      
      // Request camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📷 Camera permission result:', cameraStatus);
      
      // Request media library permissions  
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📁 Media library permission result:', mediaStatus);
      
      if (cameraStatus !== 'granted') {
        console.log('❌ Camera permission denied');
      }
      
      if (mediaStatus !== 'granted') {
        console.log('❌ Media library permission denied');
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to let you choose a profile picture. Please enable photo library access in Settings.',
          [
            { text: 'Cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, this would ideally open Settings
              console.log('User should open Settings manually');
            }}
          ]
        );
        return false;
      }
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library permissions to let you upload a profile picture.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('✅ All permissions granted');
      return true;
    } catch (error) {
      console.error('💥 Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
      return false;
    }
  };

  const handleAvatarPress = async () => {
    console.log('🖼️ Avatar pressed - showing options');
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    Alert.alert(
      'Update Profile Picture',
      'Choose how you want to update your profile picture',
      [
        {
          text: 'Camera',
          onPress: takePhoto,
        },
        {
          text: 'Photo Library',
          onPress: selectImageFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const selectImageFromGallery = async () => {
    try {
      console.log('📷 Opening image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('📷 ImagePicker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length,
        firstAssetUri: result.assets?.[0]?.uri
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedUri = result.assets[0].uri;
        console.log('✅ Image selected from gallery:', selectedUri);
        console.log('🔄 Current avatarUri before update:', avatarUri);
        
        // Force update the avatar URI
        setAvatarUri(selectedUri);
        
        console.log('🖼️ Avatar URI updated to:', selectedUri);
      } else {
        console.log('📷 Image selection cancelled or no assets found');
      }
    } catch (error) {
      console.error('Error opening image library:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📸 Opening camera...');
      
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

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('✅ Photo taken:', result.assets[0].uri);
        setAvatarUri(result.assets[0].uri);
        console.log('🖼️ Avatar URI set to:', result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('📷 Camera error:', error);
      if (error.message?.includes('timeout')) {
        Alert.alert(
          'Camera Issue',
          'Camera launch timed out (common in simulators). Please try "Photo Library" instead.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to open camera. Please try the gallery option.');
      }
    }
  };

  const uploadAvatarImage = async (imageUri: string): Promise<string | null> => {
    try {
      setIsUploadingAvatar(true);
      console.log('🚀 Starting avatar upload for:', imageUri);
      
      // Get user ID using the best available method
      const userId = getBestUserId();
      if (!userId) {
        Alert.alert(
          'Authentication Error',
          'Could not determine current user. Please try signing out and signing back in.',
          [{ text: 'OK' }]
        );
        return null;
      }
      
      // Try to get a valid session for authenticated upload
      let accessToken = null;
      try {
        const session = await supabaseClient.auth.getSession();
        if (session?.data?.session?.access_token) {
          accessToken = session.data.session.access_token;
          console.log('✅ Using fresh session token');
        } else {
          const storedSession = await AsyncStorage.getItem('supabase_session');
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData?.access_token) {
              accessToken = sessionData.access_token;
              console.log('✅ Using stored session token');
            }
          }
        }
      } catch (sessionError) {
        console.log('⚠️ Could not get session for authenticated upload:', sessionError);
      }
      
      // Create a unique filename
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`;
      
      // Create a file blob from the image URI
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      console.log('📦 File prepared:', { fileName, size: blob.size, type: blob.type });
      
      // First attempt: Try with session token if available
      if (accessToken) {
        console.log('📤 Attempting authenticated upload...');
        
        const uploadResponse = await fetch(
          `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/avatars/${fileName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': blob.type || 'image/jpeg',
            },
            body: blob,
          }
        );
        
        if (uploadResponse.ok) {
          const publicURL = `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/public/avatars/${fileName}`;
          console.log('✅ Authenticated upload successful:', publicURL);
          return publicURL;
        } else {
          const errorText = await uploadResponse.text();
          console.log('⚠️ Authenticated upload failed, trying anon key:', errorText);
        }
      }
      
      // Second attempt: Use anon key for public bucket access
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbmRicW5pbXp5eHVxY2F5eHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxMzY3MDUsImV4cCI6MjA2MzcxMjcwNX0._bqV7vwHn9jCdk1H984u8pPMw9qYq0MWySsHBtVye3Y';
      
      console.log('📤 Attempting anon key upload to public bucket...');
      
      const anonUploadResponse = await fetch(
        `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/avatars/${fileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': blob.type || 'image/jpeg',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: blob,
        }
      );
      
      console.log('📡 Anon upload response status:', anonUploadResponse.status);
      
      if (anonUploadResponse.ok) {
        // Get the public URL
        const publicURL = `https://bcndbqnimzyxuqcayxqn.supabase.co/storage/v1/object/public/avatars/${fileName}`;
        console.log('✅ Anon upload successful:', publicURL);
        return publicURL;
      } else {
        const errorText = await anonUploadResponse.text();
        console.error('❌ Anon upload failed:', errorText);
        
        // Show helpful error message based on status
        if (anonUploadResponse.status === 404 || anonUploadResponse.status === 400) {
          Alert.alert(
            'Storage Setup Required',
            'The "avatars" storage bucket needs to be created:\n\n1. Go to your Supabase Dashboard\n2. Navigate to Storage\n3. Create a new bucket called "avatars"\n4. Make it Public\n5. Try uploading again',
            [{ text: 'OK' }]
          );
        } else if (anonUploadResponse.status === 403) {
          Alert.alert(
            'Permission Error',
            'Upload failed due to storage permissions. The bucket may need to be configured as public or with proper RLS policies.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Upload Failed',
            `Failed to upload profile picture (Status: ${anonUploadResponse.status}). Please try again.`,
            [{ text: 'OK' }]
          );
        }
        
        return null;
      }
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload profile picture. Please try again.');
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Profile"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                  <ActivityIndicator size="large" color="#000000" />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              ) : avatarUri ? (
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                    {/* Skeleton background while image loads */}
                    <SkeletonShimmer />
                  </View>
                  <Image 
                    key={avatarUri}
                    source={{ uri: avatarUri }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.log('🖼️ Avatar image load error:', error.nativeEvent?.error || error);
                      console.log('🖼️ Failed URI was:', avatarUri);
                    }}
                    onLoadStart={() => {
                      console.log('🖼️ Avatar image loading started for URI:', avatarUri);
                    }}
                    onLoadEnd={() => {
                      console.log('🖼️ Avatar image loading finished successfully for URI:', avatarUri);
                    }}
                    onLoad={() => {
                      console.log('🖼️ Avatar image loaded successfully for URI:', avatarUri);
                    }}
                  />
                  <View style={styles.cameraOverlay}>
                    <Camera size={20} color="#FFFFFF" />
                  </View>
                </View>
              ) : (
                <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                  <Text style={styles.avatarInitials}>
                    {firstName.charAt(0)}{lastName.charAt(0)}
                  </Text>
                  <View style={styles.cameraOverlay}>
                    <Camera size={20} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* First Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Last Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Email Input (Read-only) */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, styles.readOnlyInput]}
              value={email}
              editable={false}
            />
          </View>

          {/* Level Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowLevelDropdown(true)}
            >
              <Text style={styles.dropdownText}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Changes Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.saveButton,
              !isButtonActive && styles.saveButtonDisabled
            ]} 
            onPress={handleSaveChanges}
            disabled={!isButtonActive}
          >
            <Text style={[
              styles.saveButtonText,
              !isButtonActive && styles.saveButtonTextDisabled
            ]}>
              {isUploadingAvatar ? 'Uploading Image...' : (isSubmitting ? 'Saving Changes...' : 'Save Changes')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Level Selection Modal */}
      <Modal
        visible={showLevelDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLevelDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLevelDropdown(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Skill Level</Text>
            {levelOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.modalOption}
                onPress={() => handleLevelSelect(option.id)}
              >
                <Text style={styles.modalOptionText}>{option.label}</Text>
                {selectedLevel === option.id && (
                  <Check size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 24,
    paddingBottom: 140,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },
  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  saveButtonTextDisabled: {
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  avatarSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginTop: 8,
  },
  avatarWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#000000',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitials: {
    fontSize: 24,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
  },
  uploadingText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginTop: 8,
  },
  avatarSkeleton: {
    backgroundColor: '#F5E9CF',
    overflow: 'hidden',
  },
  skeletonShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 40,
    width: 20,
    height: '100%',
  },
});

export default ProfileScreen; 