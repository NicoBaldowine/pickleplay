import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, ActivityIndicator, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronDown, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TopBar from '../components/ui/TopBar';
import { COLORS } from '../constants/colors';
import { doublePartnersService, DoublePartner } from '../services/doublePartnersService';
import { supabaseClient } from '../lib/supabase';
import { authService } from '../services/authService';

interface EditPartnerScreenProps {
  partner: DoublePartner;
  onBack: () => void;
  onPartnerUpdated?: () => void; // Callback to refresh the list
}

const levelOptions = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'expert', label: 'Expert' },
];

const EditPartnerScreen: React.FC<EditPartnerScreenProps> = ({ partner, onBack, onPartnerUpdated }) => {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Avatar states
  const [partnerAvatarUri, setPartnerAvatarUri] = useState<string | undefined>(partner?.avatar_url);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Shimmer animation
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  // Initialize form with partner data
  useEffect(() => {
    if (partner) {
      // Split the partner name into first and last name
      const nameParts = partner.partner_name?.split(' ') || ['', ''];
      setName(nameParts[0] || '');
      setLastname(nameParts.slice(1).join(' ') || ''); // Handle names with multiple parts
      setSelectedLevel(partner.partner_level || 'intermediate');
      setPartnerAvatarUri(partner.avatar_url);
    }
  }, [partner]);

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
            `Failed to upload partner picture (Status: ${anonUploadResponse.status}). The changes will be saved without updating the picture.`,
            [{ text: 'OK' }]
          );
        }
        
        return null;
      }
      
    } catch (error) {
      console.error('💥 Upload error:', error);
      Alert.alert('Upload Error', 'Failed to upload partner picture. The changes will be saved without updating the picture.');
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveChanges = async () => {
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
      // Get current user for potential avatar upload
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        Alert.alert('Error', 'User not found. Please sign in again.');
        return;
      }

      let avatarUrl = partnerAvatarUri;

      // Handle avatar upload if a new image was selected
      if (partnerAvatarUri && partnerAvatarUri !== partner.avatar_url && (partnerAvatarUri.startsWith('file://') || partnerAvatarUri.startsWith('content://'))) {
        console.log('📤 Uploading updated partner avatar image...');
        const uploadedUrl = await uploadAvatarImage(partnerAvatarUri, currentUser.id);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          console.log('✅ Partner avatar uploaded successfully:', uploadedUrl);
        } else {
          console.log('❌ Partner avatar upload failed, continuing with current avatar');
          avatarUrl = partner.avatar_url; // Keep the existing avatar if upload fails
        }
      }

      // Update partner in database
      console.log('🎯 Starting partner update in UI...');
      const result = await doublePartnersService.updatePartner(partner.id, {
        partner_name: `${name.trim()} ${lastname.trim()}`,
        partner_level: selectedLevel as 'beginner' | 'intermediate' | 'advanced' | 'expert',
        avatar_url: avatarUrl || undefined
      });

      console.log('🎯 Update result received in UI:', result);

      if (!result.success) {
        console.log('❌ Update failed in UI with error:', result.error);
        
        // Check if the error is about session expiration (only if refresh also failed)
        if (result.error?.includes('Session expired and could not be refreshed') || 
            result.error?.includes('Please log in again')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again to continue.',
            [
              { text: 'OK', onPress: () => {
                onBack(); // Go back to the previous screen
              }}
            ]
          );
          return;
        }
        
        // Don't show PGRST301 errors - these are handled automatically by refresh
        if (result.error?.includes('PGRST301') || result.error?.includes('JWT expired')) {
          Alert.alert('Error', 'Session issue occurred but was handled automatically. Please try again.');
          return;
        }
        
        Alert.alert('Error', result.error || 'Failed to update partner');
        return;
      }

      console.log('✅ Partner updated successfully in UI');
      
      // Show success message
      Alert.alert(
        'Partner Updated',
        `${name} ${lastname} has been updated successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              try {
                console.log('🔄 Calling onPartnerUpdated callback...');
                onPartnerUpdated?.(); // Refresh the list
                console.log('🏠 Navigating back...');
                onBack(); // Go back to the previous screen
              } catch (callbackError) {
                console.error('❌ Error in success callbacks:', callbackError);
                // Still navigate back even if callback fails
                onBack();
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('💥 Caught error in EditPartner UI:', error);
      
      // Check for JWT expired in catch block too (should not happen with new auto-refresh)
      if (error.message?.includes('JWT expired') || error.message?.includes('Session expired') || error.code === 'PGRST301') {
        console.log('⚠️ PGRST301 error caught in UI - this should not happen with auto-refresh');
        Alert.alert(
          'Session Issue',
          'A session issue occurred. The operation may have succeeded. Please check and try again if needed.',
          [
            { text: 'OK', onPress: () => {
              // Refresh the list and go back
              try {
                onPartnerUpdated?.();
              } catch (refreshError) {
                console.error('Error refreshing list:', refreshError);
              }
              onBack();
            }}
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'An error occurred while updating the partner.');
      }
    } finally {
      setIsLoading(false);
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

  const isFormValid = name.trim().length > 0 && lastname.trim().length > 0 && selectedLevel !== '';
  const isButtonDisabled = !isFormValid || isLoading || isUploadingAvatar;

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Check if partner is being used in active games
  const checkPartnerInActiveGames = async (partnerId: string): Promise<{ inUse: boolean; gameCount: number }> => {
    try {
      console.log('🔍 Checking if partner is in active games:', partnerId);
      
      // Query game_users to see if this partner is in any active games
      const result = await supabaseClient.query('game_users', {
        select: `
          id,
          game_id,
          games!inner (
            id,
            status,
            scheduled_date,
            scheduled_time
          )
        `,
        filters: { partner_id: partnerId }
      });

      if (result.error) {
        console.error('Error checking partner in games:', result.error);
        return { inUse: false, gameCount: 0 };
      }

      // Filter for active games (not cancelled or completed)
      const activeGames = (result.data || []).filter((gameUser: any) => {
        const gameStatus = gameUser.games?.status;
        return gameStatus && ['open', 'full', 'in_progress'].includes(gameStatus);
      });

      console.log(`✅ Found ${activeGames.length} active games for partner ${partnerId}`);
      return { inUse: activeGames.length > 0, gameCount: activeGames.length };

    } catch (error) {
      console.error('💥 Error checking partner in games:', error);
      return { inUse: false, gameCount: 0 };
    }
  };

  const handleDeletePartner = async () => {
    try {
      console.log('🗑️ Delete partner requested for:', partner.partner_name);

      // First check if partner is being used in active games
      const { inUse, gameCount } = await checkPartnerInActiveGames(partner.id);

      if (inUse) {
        Alert.alert(
          'Cannot Delete Partner',
          `${partner.partner_name} is currently involved in ${gameCount} active game${gameCount > 1 ? 's' : ''}. You cannot delete a partner who is participating in upcoming or ongoing games.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Delete Partner',
        `Are you sure you want to delete ${partner.partner_name}? This action cannot be undone.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsLoading(true);
                
                const result = await doublePartnersService.deletePartner(partner.id);
                
                if (result.success) {
                  Alert.alert(
                    'Partner Deleted',
                    `${partner.partner_name} has been deleted successfully.`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          try {
                            console.log('🔄 Calling onPartnerUpdated callback after delete...');
                            onPartnerUpdated?.(); // Refresh the list
                            console.log('🏠 Navigating back after delete...');
                            onBack(); // Go back to the previous screen
                          } catch (callbackError) {
                            console.error('❌ Error in delete callbacks:', callbackError);
                            // Still navigate back even if callback fails
                            onBack();
                          }
                        }
                      }
                    ]
                  );
                } else {
                  Alert.alert('Error', result.error || 'Failed to delete partner');
                }
              } catch (error: any) {
                console.error('💥 Error deleting partner:', error);
                Alert.alert('Error', error.message || 'An error occurred while deleting the partner.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ],
        { cancelable: true }
      );

    } catch (error: any) {
      console.error('💥 Error in handleDeletePartner:', error);
      Alert.alert('Error', 'An error occurred while checking partner status.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <TopBar
          title="Edit Partner"
          leftIcon={<ArrowLeft size={24} color="#000000" />}
          onLeftIconPress={onBack}
          rightIcon={
            <Text style={styles.deleteText}>Delete</Text>
          }
          onRightIconPress={handleDeletePartner}
          style={styles.topBar}
          titleContainerStyle={styles.titleContainer}
          titleStyle={styles.titleStyle}
        />

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
                </View>
              ) : (
                <View style={[styles.avatarPlaceholder, styles.avatarSkeleton]}>
                  <Camera size={40} color="#000000" />
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
              onPress={() => setShowLevelDropdown(true)}
            >
              <Text style={[styles.dropdownText, selectedLevel === '' && styles.placeholderText]}>
                {getSelectedLevelLabel()}
              </Text>
              <ChevronDown size={18} color="#888" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Save Changes Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isButtonDisabled && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={isButtonDisabled}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveButtonText, isButtonDisabled && styles.saveButtonTextDisabled]}>
                {isUploadingAvatar ? 'Uploading Image...' : 'Save Changes'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

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
    </TouchableWithoutFeedback>
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
  deleteText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingTop: 20,
    paddingBottom: 140,
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

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
  teamPhotoTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EditPartnerScreen; 