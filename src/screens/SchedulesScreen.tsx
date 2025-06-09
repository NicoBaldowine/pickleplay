import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronRight, User, Users, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import ListItem from '../components/ui/ListItem';
import Avatar from '../components/ui/Avatar';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { gameService, Game } from '../services/gameService';
import { authService } from '../services/authService';
import { Profile } from '../lib/supabase';
import { globalTextStyles, withGlobalFont } from '../styles/globalStyles';

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 16;
const ICON_COLOR_AVATAR = '#000000';
const ICON_COLOR_CHEVRON = '#888';

// Skeleton Loader Component
const SkeletonListItem = () => (
  <View style={styles.skeletonItem}>
    {/* Avatar skeleton */}
    <View style={styles.skeletonAvatar} />
    
    {/* Content skeleton */}
    <View style={styles.skeletonContent}>
      {/* Title skeleton */}
      <View style={styles.skeletonTitle} />
      
      {/* Chips skeleton */}
      <View style={styles.skeletonChips}>
        <View style={[styles.skeletonChip, styles.skeletonChipLarge]} />
        <View style={[styles.skeletonChip, styles.skeletonChipMedium]} />
        <View style={[styles.skeletonChip, styles.skeletonChipSmall]} />
      </View>
    </View>
  </View>
);

interface SchedulesScreenProps {
  user?: any;
  profile?: Profile;
  onCreateGame: () => void;
  refreshTrigger?: number;
}

const SchedulesScreen: React.FC<SchedulesScreenProps> = ({ user, profile, onCreateGame, refreshTrigger }) => {
  const [userSchedules, setUserSchedules] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Add effect to reload when refreshTrigger changes  
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUserSchedules();
    }
  }, [refreshTrigger]);

  // Auto-cleanup expired schedules every 5 minutes
  useEffect(() => {
    const cleanupInterval = setInterval(async () => {
      try {
        console.log('🧹 Running automatic cleanup of expired schedules...');
        await gameService.cleanupExpiredGames();
        // Reload schedules after cleanup to reflect changes
        await loadUserSchedules();
      } catch (error) {
        console.error('Error during automatic cleanup:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clean up expired schedules first
      console.log('🧹 Cleaning up expired schedules on screen load...');
      await gameService.cleanupExpiredGames();
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Fetch user's schedules
        const schedules = await gameService.getUserSchedules(currentUser.id);
        setUserSchedules(schedules);
      }
    } catch (err) {
      console.error('Error loading user schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const loadUserSchedules = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Fetch user's schedules
        const schedules = await gameService.getUserSchedules(currentUser.id);
        setUserSchedules(schedules);
      }
    } catch (err) {
      console.error('Error loading user schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateNewSchedule = () => {
    onCreateGame();
  };

  const handleSchedulePress = (scheduleId: string) => {
    const schedule = userSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      (navigation as any).navigate('ScheduleDetails', { 
        schedule,
        user,
        onRefresh: () => {
          loadUserSchedules();
        }
      });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!user?.id) return;

    try {
      // Optimistically remove from local state first
      setUserSchedules(prevSchedules => 
        prevSchedules.filter(schedule => schedule.id !== scheduleId)
      );

      const result = await gameService.deleteSchedule(scheduleId, user.id);
      if (result.success) {
        console.log('Schedule deleted successfully!');
        // The local state is already updated, no need to reload
      } else {
        console.error('Failed to delete schedule:', result.error);
        // If deletion failed, reload to restore the correct state
        await loadUserSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      // If deletion failed, reload to restore the correct state
      await loadUserSchedules();
    }
  };

  // Sort schedules by date and time (earliest first)
  const sortedSchedules = userSchedules.sort((a, b) => {
    const dateTimeA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
    const dateTimeB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  const renderScheduleItem = (schedule: Game) => {
    const dateTime = gameService.formatGameDateTime(schedule.scheduled_date, schedule.scheduled_time);
    
    // Validar y capitalizar game_type y skill_level de manera segura
    const gameTypeCapitalized = schedule.game_type ? 
      schedule.game_type.charAt(0).toUpperCase() + schedule.game_type.slice(1) : 
      'Unknown';

    const skillLevelCapitalized = schedule.skill_level ? 
      schedule.skill_level.charAt(0).toUpperCase() + schedule.skill_level.slice(1) : 
      'Unknown';
    
    // Create location string from venue_name only
    const locationString = schedule.venue_name || 'No location';
    
    const chips = [
      gameTypeCapitalized,
      skillLevelCapitalized,
      locationString
    ];
    
    // Define chip background colors based on game type
    const chipBackgrounds = [
      schedule.game_type === 'singles' ? '#96BE6B' : '#4DAAC2', // Game type chip
      'rgba(0, 0, 0, 0.07)', // Level chip
      'rgba(0, 0, 0, 0.07)', // Location chip
    ];
    
    // Always use Calendar icon for schedules
    const avatarIcon = (
      <Calendar size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    );

    return (
      <ListItem
        key={schedule.id}
        title={dateTime}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        onPress={() => handleSchedulePress(schedule.id)}
        style={styles.listItem}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Calendar size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>No schedules yet</Text>
      <Text style={styles.emptyStateDescription}>
        Create your first schedule to let other players find and join your games!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#000000" />
      <Text style={styles.loadingText}>Loading schedules...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Calendar size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>Unable to load schedules</Text>
      <Text style={styles.emptyStateDescription}>
        Please check your connection and try again.
      </Text>
    </View>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.schedulesListContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Schedules</Text>
        <Text style={styles.subtitle}>Schedule games for other players to join</Text>
      </View>
      
      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadUserSchedules}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {/* Create New Schedule Button */}
        <View style={styles.createButtonContainer}>
          <ListItem
            title="Create new Schedule"
            avatarIcon={<Plus size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />}
            onPress={handleCreateNewSchedule}
            style={styles.createScheduleItem}
          />
        </View>

        {/* Your Schedules Section - Only show when there are schedules or loading/error */}
        {(loading || error || sortedSchedules.length > 0) && (
          <>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionTitle}>Your Schedules</Text>
            </View>

            {loading ? (
              renderSkeletonLoader()
            ) : error ? (
              renderErrorState()
            ) : (
              <View style={styles.schedulesListContainer}>
                {sortedSchedules.map(renderScheduleItem)}
              </View>
            )}
          </>
        )}
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
  scrollViewContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexGrow: 1,
  },
  createButtonContainer: {
    marginBottom: 16,
  },
  createScheduleItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  listItem: {
    // Removed marginBottom: 8 to use gap: 12 from container
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    ...globalTextStyles.h5,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    ...globalTextStyles.body,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    ...globalTextStyles.body,
    color: '#888',
    marginTop: 12,
  },
  sectionHeaderContainer: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 0,
  },
  schedulesListContainer: {
    flex: 1,
    gap: 8,
  },
  descriptionFirstLine: {
    ...globalTextStyles.bodySmall,
  },
  descriptionSecondLine: {
    ...globalTextStyles.bodySmall,
    opacity: 0.6,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5E9CF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    minHeight: 80,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderRadius: 9,
    marginBottom: 10,
    width: '70%',
  },
  skeletonChips: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  skeletonChip: {
    height: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    borderRadius: 10,
  },
  skeletonChipLarge: {
    width: 100,
  },
  skeletonChipMedium: {
    width: 80,
  },
  skeletonChipSmall: {
    width: 60,
  },
});

export default SchedulesScreen; 