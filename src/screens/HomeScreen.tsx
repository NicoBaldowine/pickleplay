import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, User, Users, Calendar, Search, LogOut, Camera } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your custom components
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

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
  gamesRefreshTrigger?: number;
  onSignOut?: () => void;
  onNavigateToAccount?: () => void;
  onNavigateToDoublePartners?: () => void;
  onNavigateToProfile?: () => void;
}

const ICON_SIZE_AVATAR = 20;

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

const HomeScreen: React.FC<HomeScreenProps> = ({ user, profile, onNavigateToSchedules, onNavigateToGames, onSchedulePressFromHome, refreshTrigger, gamesRefreshTrigger, onSignOut, onNavigateToAccount, onNavigateToDoublePartners, onNavigateToProfile }) => {
  const [upcomingGames, setUpcomingGames] = useState<UserGame[]>([]);
  const [userSchedules, setUserSchedules] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Placeholder images for different game types (same as GamesScreen)
  const singlePlayerImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1494790108755-2616b612b510?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];

  const doublePlayerImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];

  useEffect(() => {
    loadUpcomingGames();
  }, []);

  // Reload data when refreshTrigger changes (when new schedules are created)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUpcomingGames();
    }
  }, [refreshTrigger]);

  // Reload data when gamesRefreshTrigger changes (when games are accepted/cancelled)
  useEffect(() => {
    if (gamesRefreshTrigger && gamesRefreshTrigger > 0) {
      console.log('🎮 HomeScreen reloading due to gamesRefreshTrigger:', gamesRefreshTrigger);
      loadUpcomingGames();
    }
  }, [gamesRefreshTrigger]);

  // Reload data whenever the screen comes into focus (when navigating back from other screens)
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 HomeScreen focused - reloading data...');
      loadUpcomingGames();
    }, [])
  );

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
    const game = upcomingGames.find(g => g.id === gameId);
    if (game) {
      (navigation as any).navigate('UpcomingDetails', { 
        game,
        onRefresh: () => {
          console.log('🔄 Refreshing HomeScreen data from UpcomingDetails...');
          loadUpcomingGames();
        }
      });
    }
  };

  const handleSchedulePress = (scheduleId: string) => {
    const schedule = userSchedules.find(s => s.id === scheduleId);
    if (schedule) {
      (navigation as any).navigate('ScheduleDetails', { 
        schedule,
        user,
        onRefresh: () => {
          console.log('🔄 Refreshing HomeScreen data from ScheduleDetails...');
          loadUpcomingGames();
        }
      });
    }
  };

  const handleSeeAllUpcoming = () => {
    console.log('See all upcoming games pressed');
    onNavigateToGames?.();
  };

  const handleSeeAllSchedules = () => {
    console.log('See all schedules pressed');
    onNavigateToSchedules?.();
  };

  // Task handlers for new users
  const handleAddProfilePictureTask = () => {
    console.log('Add profile picture task pressed');
    onNavigateToProfile?.();
  };

  const handleAddPartnersTask = () => {
    console.log('Add doubles partners task pressed');
    onNavigateToDoublePartners?.();
  };

  const handleScheduleGameTask = () => {
    console.log('Schedule game task pressed');
    onNavigateToSchedules?.();
  };

  const handleFindGamesTask = () => {
    console.log('Find games task pressed');
    onNavigateToGames?.();
  };

  const renderUpcomingGame = (game: UserGame, index: number) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    
    // Get opponent information for upcoming games (same logic as GamesScreen)
    const getOpponentInfo = () => {
      // Since these are games the user joined, the creator is the opponent
      if (game.creator) {
        const creatorName = game.creator.full_name || 
                           `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                           'Unknown Player';
        
        // For doubles games, show both players like in GamesScreen
        if (game.game_type === 'doubles') {
          // Check if partner info is in notes
          if (game.original_game?.notes && game.original_game.notes.includes('with partner:')) {
            const partnerMatch = game.original_game.notes.match(/with partner: (.+?)(?:\.|$)/);
            if (partnerMatch && partnerMatch[1]) {
              // Extract first names only for cleaner display
              const creatorFirstName = game.creator.first_name || creatorName.split(' ')[0] || 'User';
              const partnerFullName = partnerMatch[1].trim();
              const partnerFirstName = partnerFullName.split(' ')[0] || 'Partner';
              
              return {
                name: `${creatorFirstName} & ${partnerFirstName}`,
                imageUrl: game.creator.avatar_url || doublePlayerImages[index % doublePlayerImages.length]
              };
            }
          }
          
          // Fallback for doubles without partner info
          return {
            name: `${creatorName} (need partner)`,
            imageUrl: game.creator.avatar_url || doublePlayerImages[index % doublePlayerImages.length]
          };
        }
        
        // For singles games, show creator name
        return {
          name: creatorName,
          imageUrl: game.creator.avatar_url || singlePlayerImages[index % singlePlayerImages.length]
        };
      }

      // Fallback if no creator info
      return {
        name: 'Opponent',
        imageUrl: game.game_type === 'singles' 
          ? singlePlayerImages[index % singlePlayerImages.length]
          : doublePlayerImages[index % doublePlayerImages.length]
      };
    };

    const opponentInfo = getOpponentInfo();
    
    // Create chips array with level, date, and venue name (same as GamesScreen)
    const chips = [
      game.skill_level || 'Beginner', // Level
      dateTime, // Date and time
      game.original_game?.venue_name || game.venue_name || 'TBD', // Venue name only
    ];
    
    // Define chip background colors based on game status (upcoming games use colored backgrounds)
    const chipBackgrounds = [
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
    ];

    // Create avatar - for doubles use creator partner photo (dupla), for singles use opponent photo
    const getAvatarUrl = () => {
      if (game.game_type === 'doubles') {
        // For doubles games, always prioritize the creator's partner avatar (represents the dupla)
        // Type assertion needed since original_game might not have full GameWithPlayers type
        const originalGameWithDetails = game.original_game as any;
        if (originalGameWithDetails?.creator_partner?.avatar_url) {
          console.log(`🖼️ HomeScreen: Using creator partner avatar for doubles game ${game.id}:`, originalGameWithDetails.creator_partner.avatar_url);
          return originalGameWithDetails.creator_partner.avatar_url;
        }
        // Fallback to creator avatar for doubles
        if (game.creator?.avatar_url) {
          console.log(`👤 HomeScreen: Using creator avatar fallback for doubles game ${game.id}:`, game.creator.avatar_url);
          return game.creator.avatar_url;
        }
        // Final fallback to doubles placeholder image
        console.log(`⚠️ HomeScreen: No creator partner/creator avatar found for doubles game ${game.id}, using placeholder`);
        return doublePlayerImages[index % doublePlayerImages.length];
      } else {
        // For singles games, use opponent photo (creator avatar or placeholder)
        if (game.creator?.avatar_url) {
          console.log(`👤 HomeScreen: Using creator avatar for singles game ${game.id}:`, game.creator.avatar_url);
          return game.creator.avatar_url;
        }
        console.log(`👤 HomeScreen: Using placeholder for singles game ${game.id}:`, opponentInfo.imageUrl);
        return opponentInfo.imageUrl;
      }
    };

    const avatarIcon = (
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: getAvatarUrl() }}
          style={styles.avatarImage}
        />
      </View>
    );

    // Define list item style with conditional background color (same as GamesScreen)
    const listItemStyle = {
      ...styles.listItem,
      backgroundColor: game.game_type === 'singles' ? '#96BE6B' : '#4DAAC2'
    };

    return (
      <ListItem
        key={game.id}
        title={opponentInfo.name} // Show opponent name instead of venue
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        rightElement={<ChevronRight size={16} color="#888" />}
        onPress={() => handleUpcomingGamePress(game.id)}
        style={listItemStyle}
      />
    );
  };

  const renderSchedule = (schedule: Game, index: number) => {
    const dateTime = gameService.formatGameDateTime(schedule.scheduled_date, schedule.scheduled_time);
    
    // Create chips array similar to SchedulesScreen
    const gameTypeCapitalized = schedule.game_type 
      ? schedule.game_type.charAt(0).toUpperCase() + schedule.game_type.slice(1)
      : 'Unknown';
    const skillLevelCapitalized = schedule.skill_level 
      ? schedule.skill_level.charAt(0).toUpperCase() + schedule.skill_level.slice(1)
      : 'Any Level';
    
    const chips = [
      gameTypeCapitalized, // Game type
      skillLevelCapitalized, // Level
      schedule.venue_name || 'TBD', // Location
    ];
    
    // Define chip background colors based on game type (same as SchedulesScreen)
    const chipBackgrounds = [
      schedule.game_type === 'singles' ? '#96BE6B' : '#4DAAC2', // Game type chip - green for singles, blue for doubles
      'rgba(0, 0, 0, 0.07)', // Level chip (default)
      'rgba(0, 0, 0, 0.07)', // Location chip (default)
    ];
    
    // Always use Calendar icon for schedules (same as SchedulesScreen)
    const avatarIcon = (
      <Calendar size={ICON_SIZE_AVATAR} color="#000000" />
    );

    return (
      <ListItem
        key={schedule.id}
        title={dateTime}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
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
    const dateTimeA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
    const dateTimeB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
    return dateTimeA.getTime() - dateTimeB.getTime();
  });
  const displaySchedules = sortedSchedules.slice(0, 2);

  // Determine if user is new (no schedules and no upcoming games)
  const isNewUser = !loading && userSchedules.length === 0 && upcomingGames.length === 0;

  const renderTaskItem = (title: string, iconComponent: React.ReactNode, onPress: () => void) => {
    return (
      <ListItem
        title={title}
        avatarIcon={iconComponent}
        rightElement={<ChevronRight size={16} color="#888" />}
        onPress={onPress}
        style={styles.taskItem}
      />
    );
  };

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonListItem key={index} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}> 
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
        <Text style={styles.title}>{`Welcome, ${profile?.first_name || 'User'}`}</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollViewContent}>
        
        {isNewUser ? (
          // Show tasks for new users
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your tasks</Text>
          </View>
            {renderTaskItem(
              "Add a profile picture", 
              <Camera size={ICON_SIZE_AVATAR} color="#000000" />,
              handleAddProfilePictureTask
            )}
            {renderTaskItem(
              "Add Doubles Partners", 
              <Users size={ICON_SIZE_AVATAR} color="#000000" />,
              handleAddPartnersTask
            )}
            {renderTaskItem(
              "Schedule a game", 
              <Calendar size={ICON_SIZE_AVATAR} color="#000000" />,
              handleScheduleGameTask
            )}
            {renderTaskItem(
              "Find games around you", 
              <Search size={ICON_SIZE_AVATAR} color="#000000" />,
              handleFindGamesTask
            )}
          </>
        ) : (
          // Show regular sections for users with content
          <>
            {/* Upcoming Games Section - Only show if there are upcoming games */}
            {!loading && displayUpcomingGames.length > 0 && (
              <>
                {renderSectionHeader('Upcoming Games', handleSeeAllUpcoming)}
                {loading ? (
                  renderSkeletonLoader()
                ) : (
                  displayUpcomingGames.map((game, index) => renderUpcomingGame(game, index))
                )}
                <View style={styles.sectionSpacing} />
              </>
        )}

        {/* Schedules Section */}
        {renderSectionHeader('Your Schedules', handleSeeAllSchedules)}
        {loading ? (
          renderSkeletonLoader()
        ) : displaySchedules.length > 0 ? (
          displaySchedules.map((schedule, index) => renderSchedule(schedule, index))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming schedules</Text>
            <Text style={styles.emptySubtext}>Schedules will appear here</Text>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
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
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
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
    // Using consistent spacing with other list items
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
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
  taskItem: {
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  skeletonContainer: {
    flex: 1,
    gap: 8,
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

export default HomeScreen; 