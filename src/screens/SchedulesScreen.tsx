import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, ChevronRight, User, Users, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';
import Avatar from '../components/ui/Avatar';

// Import game service and types
import { gameService, Game } from '../services/gameService';
import { authService } from '../services/authService';
import { Profile } from '../lib/supabase';
import { globalTextStyles, withGlobalFont } from '../styles/globalStyles';

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 16;
const ICON_COLOR_AVATAR = 'rgba(0, 0, 0, 0.5)';
const ICON_COLOR_CHEVRON = '#888';

interface SchedulesScreenProps {
  user?: any;
  profile?: Profile;
  onCreateGame: () => void;
  refreshTrigger?: number;
}

const SchedulesScreen: React.FC<SchedulesScreenProps> = ({ user, profile, onCreateGame, refreshTrigger }) => {
  const [userSchedules, setUserSchedules] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserSchedules();
  }, []);

  useEffect(() => {
    loadUserSchedules();
  }, [user?.id]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUserSchedules();
    }
  }, [refreshTrigger]);

  const loadUserSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (user?.id) {
        const schedules = await gameService.getUserSchedules(user.id);
        setUserSchedules(schedules);
      } else {
        setUserSchedules([]);
      }
    } catch (err) {
      console.error('Error loading user schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
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
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });

  const renderScheduleItem = (schedule: Game) => {
    const dateTime = gameService.formatGameDateTime(schedule.date, schedule.time);
    
    // Format description: first line game type and skill level, second line location with more opacity
    const gameTypeCapitalized = schedule.game_type.charAt(0).toUpperCase() + schedule.game_type.slice(1);
    const skillLevelCapitalized = schedule.skill_level.charAt(0).toUpperCase() + schedule.skill_level.slice(1);
    
    // Custom description component with different opacity for location
    const customDescription = (
      <View>
        <Text style={styles.descriptionFirstLine}>{gameTypeCapitalized} - {skillLevelCapitalized}</Text>
        <Text style={styles.descriptionSecondLine}>{schedule.location}</Text>
      </View>
    );
    
    // Choose icon based on game type
    const avatarIcon = schedule.game_type === 'singles' ? (
      <User size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    ) : (
      <Users size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    );

    const rightElement = (
      <ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_CHEVRON} />
    );

    return (
      <View key={schedule.id} style={[styles.listItem, { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#F7EAC9', borderRadius: 12, marginVertical: 4 }]}>
        <Avatar icon={avatarIcon} size={40} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[globalTextStyles.semiBold, { fontSize: 16 }]}>{dateTime}</Text>
          {customDescription}
        </View>
        <TouchableOpacity onPress={() => handleSchedulePress(schedule.id)} style={{ marginLeft: 'auto', paddingLeft: 8 }}>
          {rightElement}
        </TouchableOpacity>
      </View>
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
      <ActivityIndicator size="large" color="#007AFF" />
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

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      <TopBar
        title="Schedules"
        description="Schedule games for other players to join"
      />
      
      {/* Create New Schedule Button */}
      <View style={styles.createButtonContainer}>
        <ListItem
          title="Create new Schedule"
          avatarIcon={<Plus size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />}
          rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_CHEVRON} />}
          onPress={handleCreateNewSchedule}
          style={styles.listItem}
        />
      </View>

      {/* Your Schedules Section */}
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionTitle}>Your Schedules</Text>
      </View>

      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUserSchedules}
            tintColor="#007AFF"
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : sortedSchedules.length > 0 ? (
          sortedSchedules.map(renderScheduleItem)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF2D6',
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scrollViewContainer: {
    flex: 1,
    marginTop: 4,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    flexGrow: 1,
  },
  listItem: {
    marginBottom: 8,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionTitle: {
    ...globalTextStyles.h5,
    fontWeight: '800',
    marginBottom: 4,
  },
  descriptionFirstLine: {
    ...globalTextStyles.bodySmall,
  },
  descriptionSecondLine: {
    ...globalTextStyles.bodySmall,
    opacity: 0.6,
  },
});

export default SchedulesScreen; 