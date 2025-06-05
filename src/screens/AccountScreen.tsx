import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Users, Bell, HelpCircle, MessageSquare, LogOut } from 'lucide-react-native';

// Import custom components
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

import { authService } from '../services/authService';
import { gameService } from '../services/gameService';
import { Profile } from '../lib/supabase';
import { globalTextStyles, withGlobalFont } from '../styles/globalStyles';

interface AccountScreenProps {
  user: any;
  profile: Profile;
  onSignOut: () => void;
  onBack?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToDoublePartners?: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, profile, onSignOut, onBack, onNavigateToProfile, onNavigateToNotifications, onNavigateToDoublePartners }) => {
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    loadGamesPlayed();
  }, []);

  const loadGamesPlayed = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const userGames = await gameService.getUserGames(currentUser.id);
        const completedGames = userGames.filter(game => game.status === 'past');
        setGamesPlayed(completedGames.length);
      }
    } catch (error) {
      console.error('Error loading games played:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              onSignOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getSkillLevelDisplay = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const handlePreferencePress = (option: string) => {
    console.log(`${option} pressed`);
    
    switch (option) {
      case 'Manage Notifications':
        onNavigateToNotifications?.();
        break;
      case 'Manage Doubles Partners':
        onNavigateToDoublePartners?.();
        break;
      case 'Help':
        // TODO: Navigate to Help screen
        break;
      case 'Feedback':
        // TODO: Navigate to Feedback screen
        break;
      default:
        break;
    }
  };

  const handleProfilePress = () => {
    console.log('Profile pressed');
    onNavigateToProfile?.();
  };

  // Create chips for user profile info
  const userChips = [
    user?.email || profile?.email || 'Email not available', // First line, first chip (email with fallback)
    '', // First line, second chip (empty to keep email alone)
    getSkillLevelDisplay(profile.pickleball_level), // Second line, first chip
    `${gamesPlayed} Games`, // Second line, second chip
  ];

  // All chips with default gray background
  const chipBackgrounds = [
    'rgba(0, 0, 0, 0.07)', // Email chip
    'transparent', // Transparent for empty chip
    'rgba(0, 0, 0, 0.07)', // Skill level chip
    'rgba(0, 0, 0, 0.07)', // Games count chip
  ];

  // Profile picture for user
  const userAvatarIcon = (
    <View style={styles.profilePictureContainer}>
      {profile.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.profilePicture}
        />
      ) : (
        <View style={styles.profilePicturePlaceholder}>
          <Text style={styles.profilePictureInitials}>
            {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Account</Text>
        <Text style={styles.subtitle}>Manage your profile and preferences</Text>
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* User Profile ListItem */}
        <View style={styles.profileListContainer}>
          <ListItem
            title={profile.full_name}
            chips={userChips}
            chipBackgrounds={chipBackgrounds}
            avatarIcon={userAvatarIcon}
            style={styles.profileListItem}
            onPress={handleProfilePress}
          />
        </View>

        {/* Preferences Section */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferencesListContainer}>
            <ListItem
              title="Manage Notifications"
              avatarIcon={<Bell size={20} color="#000000" />}
              onPress={() => handlePreferencePress('Manage Notifications')}
              style={styles.preferenceListItem}
            />
            
            <ListItem
              title="Manage Doubles Partners"
              avatarIcon={<Users size={20} color="#000000" />}
              onPress={() => handlePreferencePress('Manage Doubles Partners')}
              style={styles.preferenceListItem}
            />
            
            <ListItem
              title="Help"
              avatarIcon={<HelpCircle size={20} color="#000000" />}
              onPress={() => handlePreferencePress('Help')}
              style={styles.preferenceListItem}
            />
            
            <ListItem
              title="Feedback"
              avatarIcon={<MessageSquare size={20} color="#000000" />}
              onPress={() => handlePreferencePress('Feedback')}
              style={styles.preferenceListItem}
            />
            
            <ListItem
              title="Sign out"
              avatarIcon={<LogOut size={20} color="#000000" />}
              onPress={handleSignOut}
              style={styles.preferenceListItem}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_SECONDARY,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  profileListContainer: {
    marginBottom: 24,
  },
  profileListItem: {
    marginBottom: 8,
  },
  profilePictureContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  profilePicturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
  },
  profilePictureInitials: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  preferencesSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 0,
  },
  preferencesListContainer: {
    marginBottom: 16,
  },
  preferenceListItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
});

export default AccountScreen; 