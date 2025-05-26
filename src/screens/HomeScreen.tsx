import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, User, Users } from 'lucide-react-native';

// Import your custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';
import { Profile } from '../lib/supabase';

// Import game service and types
import { gameService, UserGame, Game } from '../services/gameService';
import { authService } from '../services/authService';
import { globalTextStyles } from '../styles/globalStyles';
import { fontFamily } from '../config/fonts';

interface HomeScreenProps {
  user?: any;
  profile?: Profile;
  onNavigateToSchedules?: () => void;
  onNavigateToGames?: () => void;
  onSchedulePressFromHome?: (scheduleId: string) => void;
  refreshTrigger?: number;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, profile, onNavigateToSchedules, onNavigateToGames, onSchedulePressFromHome, refreshTrigger }) => {
  const [upcomingGames, setUpcomingGames] = useState<UserGame[]>([]);
  const [userSchedules, setUserSchedules] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingGames();
  }, []);

  // Reload data when refreshTrigger changes (when new schedules are created)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUpcomingGames();
    }
  }, [refreshTrigger]);

  const loadUpcomingGames = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Load user's accepted games
        const games = await gameService.getUserGames(currentUser.id);
        const upcoming = games.filter(game => game.status === 'upcoming');
        setUpcomingGames(upcoming);

        // Load user's created schedules
        const schedules = await gameService.getUserSchedules(currentUser.id);
        setUserSchedules(schedules);
      }
    } catch (error) {
      console.error('Error loading upcoming games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpcomingGamePress = (gameId: string) => {
    console.log(`Upcoming game pressed: ${gameId}`);
    // TODO: Navigate to game details
  };

  const handleSchedulePress = (scheduleId: string) => {
    onSchedulePressFromHome?.(scheduleId);
  };

  const handleSeeAllUpcoming = () => {
    console.log('See all upcoming games pressed');
    onNavigateToGames?.();
  };

  const handleSeeAllSchedules = () => {
    console.log('See all schedules pressed');
    onNavigateToSchedules?.();
  };

  // Generate user initials for avatar
  const getUserInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`;
    }
    return 'U';
  };

  const renderUpcomingGame = (game: UserGame) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    const initials = gameService.getUserInitials(game.opponent_name);
    
    // Use shared color logic from gameService
    const avatarBackgroundColor = gameService.getAvatarBackgroundColor(game.game_type);
    
    const avatarIcon = (
      <View style={[styles.avatarContainer, { backgroundColor: avatarBackgroundColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );

    return (
      <ListItem
        key={game.id}
        title={game.opponent_name}
        description={`${dateTime} • ${game.location}`}
        avatarIcon={avatarIcon}
        rightElement={<ChevronRight size={16} color="#888" />}
        onPress={() => handleUpcomingGamePress(game.id)}
        style={styles.listItem}
      />
    );
  };

  const renderSchedule = (schedule: Game) => {
    const dateTime = gameService.formatGameDateTime(schedule.date, schedule.time);
    
    // Choose icon based on game type - use gray Avatar like SchedulesScreen
    const avatarIcon = schedule.game_type === 'singles' ? (
      <User size={20} color="rgba(0, 0, 0, 0.5)" />
    ) : (
      <Users size={20} color="rgba(0, 0, 0, 0.5)" />
    );

    return (
      <ListItem
        key={schedule.id}
        title={dateTime}
        description={`${schedule.game_type} • ${schedule.skill_level} • ${schedule.location}`}
        avatarIcon={
          <View style={styles.avatarContainer}>
            {avatarIcon}
          </View>
        }
        rightElement={<ChevronRight size={16} color="#888" />}
        onPress={() => handleSchedulePress(schedule.id)}
        style={styles.listItem}
      />
    );
  };

  const renderSectionHeader = (title: string, onSeeAll: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    </View>
  );

  // Get display data (limit to 2 items for home screen)
  const displayUpcomingGames = upcomingGames.slice(0, 2);
  
  // Sort schedules by date and get the 2 closest to current date
  const sortedSchedules = userSchedules.sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`);
    const dateTimeB = new Date(`${b.date}T${b.time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
  const displaySchedules = sortedSchedules.slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}> 
      <StatusBar barStyle="dark-content" />
      <TopBar
        title={`Welcome, ${profile?.first_name || 'User'}`}
      />
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollViewContent}>
        
        {/* Upcoming Games Section */}
        {renderSectionHeader('Upcoming Games', handleSeeAllUpcoming)}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading games...</Text>
          </View>
        ) : displayUpcomingGames.length > 0 ? (
          displayUpcomingGames.map(renderUpcomingGame)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming games</Text>
            <Text style={styles.emptySubtext}>Go to Find to discover games!</Text>
          </View>
        )}

        {/* Schedules Section */}
        <View style={styles.sectionSpacing} />
        {renderSectionHeader('Your Schedules', handleSeeAllSchedules)}
        {displaySchedules.length > 0 ? (
          displaySchedules.map(renderSchedule)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming schedules</Text>
            <Text style={styles.emptySubtext}>Schedules will appear here</Text>
          </View>
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
  scrollViewContainer: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    ...globalTextStyles.buttonSmall,
    color: 'rgba(0, 0, 0, 0.5)',
    marginRight: 4,
  },
  listItem: {
    marginBottom: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECD8A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  sectionSpacing: {
    height: 16,
  },
});

export default HomeScreen; 