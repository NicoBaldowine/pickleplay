import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Animated, ActionSheetIOS } from 'react-native';
import { ArrowLeft, X, ChevronDown, Check, Camera } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';
import { doublePartnersService } from '../../services/doublePartnersService';
import { authService } from '../../services/authService';
import { supabaseClient } from '../../lib/supabase';

interface CreatePartnerStepProps {
  onClose: () => void;
  onBack: () => void;
  onCreatePartner: (partnerData: { name: string; lastname: string; level: string; id?: string }) => void;
  onPartnerCreated?: () => void;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_DROPDOWN = 18;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';
const ICON_COLOR_BLUE = '#007AFF';
const STROKE_WIDTH_STANDARD = 1.8;

const levelOptions = [
  { 
    id: 'beginner', 
    label: 'Beginner', 
    description: 'Learning basic rules and strokes',
    range: '1.0-2.5'
  },
  { 
    id: 'intermediate', 
    label: 'Intermediate', 
    description: 'Consistent serves and developing strategy',
    range: '3.0-3.5'
  },
  { 
    id: 'advanced', 
    label: 'Advanced', 
    description: 'Powerful shots and tournament play',
    range: '4.0-4.5'
  },
  { 
    id: 'expert', 
    label: 'Expert', 
    description: 'Tournament player',
    range: '5.0+'
  },
];

const CreatePartnerStep: React.FC<CreatePartnerStepProps> = ({ onClose, onBack, onCreatePartner, onPartnerCreated }) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  
  // Avatar states
  const [partnerAvatarUri, setPartnerAvatarUri] = useState<string | undefined>(undefined);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Shimmer animation
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

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
    // We'll get the user ID from authService.getCurrentUser() in the handleCreatePartner function
    return null;
  };

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
          'We need access to your photo library to let you choose a partner picture. Please enable photo library access in Settings.',
          [
            { text: 'Cancel' },
            { text: 'Open Settings', onPress: () => {
              console.log('User should open Settings manually');
            }}
          ]
        );
        return false;
      }
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'We need camera and photo library permissions to let you upload a partner picture.',
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
      'Update Partner Picture',
      'Choose how you want to update the partner picture',
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
        setPartnerAvatarUri(selectedUri);
        console.log('🖼️ Partner avatar URI updated to:', selectedUri);
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
        setPartnerAvatarUri(result.assets[0].uri);
        console.log('🖼️ Partner avatar URI set to:', result.assets[0].uri);
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

  const uploadAvatarImage = async (imageUri: string, userId: string): Promise<string | null> => {
    try {
      setIsUploadingAvatar(true);
      console.log('🚀 Starting partner avatar upload for:', imageUri);
      
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
      
      // Create a unique filename for partner avatar
      const fileExtension = imageUri.split('.').pop() || 'jpg';
      const fileName = `partner_avatar_${userId}_${Date.now()}.${fileExtension}`;
      
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
            'The "avatars" storage bucket needs to be created. Please contact support.',
            [{ text: 'OK' }]
          );
        } else if (anonUploadResponse.status === 403) {
          Alert.alert(
            'Permission Error',
            'Upload failed due to storage permissions. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Upload Failed',
            `Failed to upload partner picture (Status: ${anonUploadResponse.status}). The partner will be created without a picture.`,
            [{ text: 'OK' }]
          );
        }
        
        return null;
      }
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload partner picture. The partner will be created without a picture.');
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCreatePartner = async () => {
    if (name.trim().length === 0) {
      Alert.alert('Name Required', 'Please enter the partner\'s first name.');
      return;
    }
    if (lastname.trim().length === 0) {
      Alert.alert('Last Name Required', 'Please enter the partner\'s last name.');
      return;
    }
    if (selectedLevel === '') {
      Alert.alert('Level Required', 'Please select the partner\'s skill level.');
      return;
    }

    setIsLoading(true);

    try {
      const partnerData = {
      name: name.trim(),
      lastname: lastname.trim(),
      level: selectedLevel,
      };

      // Get current user to save partner to database
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        return;
      }

      let avatarUrl = null;

      // Handle avatar upload if a new image was selected
      if (partnerAvatarUri && (partnerAvatarUri.startsWith('file://') || partnerAvatarUri.startsWith('content://'))) {
        console.log('📤 Uploading partner avatar image...');
        avatarUrl = await uploadAvatarImage(partnerAvatarUri, currentUser.id);
        if (avatarUrl) {
          console.log('✅ Partner avatar uploaded successfully:', avatarUrl);
        } else {
          console.log('❌ Partner avatar upload failed, continuing without avatar');
        }
      }

      // Save partner to database
      const result = await doublePartnersService.createPartner(currentUser.id, {
        partner_name: `${partnerData.name} ${partnerData.lastname}`,
        partner_level: partnerData.level as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        avatar_url: avatarUrl || undefined
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to create partner');
        return;
      }

      console.log('✅ Partner saved to database successfully');
      
      // Return partner data with database ID to parent component
      onCreatePartner({
        name: partnerData.name,
        lastname: partnerData.lastname,
        level: partnerData.level,
        id: result.partnerId
      });
    } catch (error) {
      console.error('Error creating partner:', error);
      Alert.alert('Error', 'An error occurred while creating the partner.');
    } finally {
      setIsLoading(false);
    }
  };



  const getSelectedLevelLabel = () => {
    const level = levelOptions.find(option => option.id === selectedLevel);
    return level ? `${level.label}, ${level.range}` : 'Select level';
  };

  const handleLevelPress = () => {
    if (Platform.OS === 'ios') {
      // Create options array with level and range
      const options = levelOptions.map(option => `${option.label} (${option.range})`);
      options.push('Cancel');

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: options.length - 1,
          title: 'Select skill level',
        },
        (buttonIndex) => {
          if (buttonIndex < levelOptions.length) {
            setSelectedLevel(levelOptions[buttonIndex].id);
          }
        }
      );
    } else {
      // Android fallback - could use an Alert with options
      const alertOptions = levelOptions.map(option => ({
        text: `${option.label} (${option.range})`,
        onPress: () => setSelectedLevel(option.id)
      }));
      alertOptions.push({ text: 'Cancel', onPress: () => {} });
      
      Alert.alert(
        'Select Skill Level',
        'Choose the partner\'s skill level',
        alertOptions
      );
    }
  };

  const isFormValid = name.trim().length > 0 && lastname.trim().length > 0 && selectedLevel !== '';
  const isButtonDisabled = !isFormValid || isLoading || isUploadingAvatar;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
            <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButtonRight}>
            <X size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainTitle}>Create a New Partner</Text>

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
              ) : partnerAvatarUri ? (
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                    {/* Skeleton background while image loads */}
                    <SkeletonShimmer />
                  </View>
                  <Image 
                    key={partnerAvatarUri}
                    source={{ uri: partnerAvatarUri }} 
                    style={styles.avatarImage}
                    onError={(error) => {
                      console.log('🖼️ Partner avatar image load error:', error.nativeEvent?.error || error);
                      console.log('🖼️ Failed URI was:', partnerAvatarUri);
                    }}
                    onLoadStart={() => {
                      console.log('🖼️ Partner avatar image loading started for URI:', partnerAvatarUri);
                    }}
                    onLoadEnd={() => {
                      console.log('🖼️ Partner avatar image loading finished successfully for URI:', partnerAvatarUri);
                    }}
                    onLoad={() => {
                      console.log('🖼️ Partner avatar image loaded successfully for URI:', partnerAvatarUri);
                    }}
                  />
                  <View style={styles.cameraOverlay}>
                    <Camera size={20} color="#FFFFFF" />
                  </View>
                </View>
              ) : (
                <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                  {(name.trim() || lastname.trim()) ? (
                    <>
                      <Text style={styles.avatarInitials}>
                        {name.charAt(0)}{lastname.charAt(0)}
                      </Text>
                      <View style={styles.cameraOverlay}>
                        <Camera size={20} color="#FFFFFF" />
                      </View>
                    </>
                  ) : (
                    <Camera size={24} color="#888888" />
                  )}
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.teamPhotoTitle}>Your Team Photo</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.textInput}
              placeholder=""
              value={name}
              onChangeText={setName}
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
              value={lastname}
              onChangeText={setLastname}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Level Dropdown */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Skill Level</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={handleLevelPress}
            >
              <Text style={[styles.dropdownText, selectedLevel === '' && styles.placeholderText]}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={ICON_SIZE_DROPDOWN} color={ICON_COLOR_MEDIUM} />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Create Partner Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.createButton, isButtonDisabled && styles.disabledButton]}
            onPress={handleCreatePartner}
            disabled={isButtonDisabled}
          >
            <Text style={[styles.createButtonText, isButtonDisabled && styles.disabledButtonText]}>
              {isUploadingAvatar ? 'Uploading Image...' : (isLoading ? 'Creating Partner...' : 'Create Partner')}
            </Text>
          </TouchableOpacity>
        </View>


      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerButtonLeft: {
    padding: 8,
  },
  headerButtonRight: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 140,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
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
    fontSize: 12,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
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
  placeholderText: {
    color: '#999',
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
  createButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  disabledButtonText: {
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
  teamPhotoTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default CreatePartnerStep;
