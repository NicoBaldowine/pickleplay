import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Users, Bell, HelpCircle, MessageSquare, LogOut } from 'lucide-react-native';
import TopBar from '../components/ui/TopBar';
import { authService } from '../services/authService';
import { gameService } from '../services/gameService';
import { Profile } from '../lib/supabase';
import { globalTextStyles, withGlobalFont } from '../styles/globalStyles';

interface AccountScreenProps {
  user: any;
  profile: Profile;
  onSignOut: () => void;
  onBack?: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ user, profile, onSignOut, onBack }) => {
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
    // TODO: Navigate to respective screens
  };

  const renderPreferenceItem = (icon: React.ReactNode, title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.preferenceItem} onPress={onPress}>
      <View style={styles.preferenceLeft}>
        {icon}
        <Text style={styles.preferenceText}>{title}</Text>
      </View>
      <ChevronRight size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <TopBar
        title="Account"
        leftIcon={onBack ? <ChevronLeft size={24} color="#007AFF" /> : undefined}
        onLeftIconPress={onBack}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
            </Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{profile.full_name}</Text>
            <Text style={styles.userLocation}>San Francisco</Text>
            <Text style={styles.gamesPlayed}>{gamesPlayed} events attended</Text>
            
            <View style={styles.statsRow}>
              <Text style={styles.statText}>2 Following</Text>
              <Text style={styles.statText}>1 Followers</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferencesContainer}>
            {renderPreferenceItem(
              <Users size={20} color="#666" />,
              'Doubles Partners',
              () => handlePreferencePress('Doubles Partners')
            )}
            
            {renderPreferenceItem(
              <Bell size={20} color="#666" />,
              'Manage notifications',
              () => handlePreferencePress('Manage notifications')
            )}
            
            {renderPreferenceItem(
              <HelpCircle size={20} color="#666" />,
              'Help',
              () => handlePreferencePress('Help')
            )}
            
            {renderPreferenceItem(
              <MessageSquare size={20} color="#666" />,
              'Feedback',
              () => handlePreferencePress('Feedback')
            )}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarLargeText: {
    ...withGlobalFont({
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '600',
    }),
  },
  profileInfo: {
    alignItems: 'flex-start',
  },
  userName: {
    ...globalTextStyles.h3,
    marginBottom: 4,
  },
  userLocation: {
    ...globalTextStyles.body,
    color: '#666',
    marginBottom: 4,
  },
  gamesPlayed: {
    ...globalTextStyles.body,
    color: '#666',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    ...globalTextStyles.body,
    fontWeight: '500',
  },
  preferencesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    ...globalTextStyles.h4,
    marginBottom: 16,
  },
  preferencesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    ...globalTextStyles.body,
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutText: {
    ...globalTextStyles.button,
    color: '#FF3B30',
    marginLeft: 8,
  },
});

export default AccountScreen; 