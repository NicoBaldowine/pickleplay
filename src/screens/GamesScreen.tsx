import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Users, Info, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { gameService, UserGame } from '../services/gameService';
import { authService } from '../services/authService';

interface GamesScreenProps {
  refreshTrigger?: number;
}

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 16;
const ICON_COLOR_AVATAR = '#555';
const ICON_COLOR_CHEVRON = '#888';

const GamesScreen: React.FC<GamesScreenProps> = ({ refreshTrigger }) => {
  const [userGames, setUserGames] = useState<UserGame[]>([]);
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
      loadUserGames();
    }
  }, [refreshTrigger]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Fetch user's games
        const games = await gameService.getUserGames(currentUser.id);
        setUserGames(games);
      }
    } catch (err) {
      console.error('Error loading user games:', err);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const loadUserGames = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Fetch user's games
        const games = await gameService.getUserGames(currentUser.id);
        setUserGames(games);
      }
    } catch (err) {
      console.error('Error loading user games:', err);
      setError('Failed to load games');
    } finally {
      setRefreshing(false);
    }
  };

  const handleGamePress = (gameId: string) => {
    const game = userGames.find(g => g.id === gameId);
    if (game && game.status === 'upcoming') {
      (navigation as any).navigate('UpcomingDetails', { game });
    } else {
      console.log(`Past game pressed: ${gameId}`);
      // TODO: Navigate to past game details or results
    }
  };

  // Separate games by status
  const upcomingGames = userGames.filter(game => game.status === 'upcoming');
  const pastGames = userGames.filter(game => game.status === 'past');

  // Placeholder images for different game types
  const singlePlayerImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Man with beard
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Young man smiling
    'https://images.unsplash.com/photo-1494790108755-2616b612b510?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Woman with curly hair
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Young woman
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Man in white shirt
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Woman with glasses
  ];

  const doublePlayerImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Two people together
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Two friends
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Two people smiling
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Two women
  ];

  const renderGameItem = (game: UserGame, index: number) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    
    // Get opponent information for upcoming games
    const getOpponentInfo = () => {
      if (game.status !== 'upcoming') {
        return {
          title: game.venue_name,
          imageUrl: game.game_type === 'singles' 
            ? singlePlayerImages[index % singlePlayerImages.length]
            : doublePlayerImages[index % doublePlayerImages.length]
        };
      }

      // For upcoming games, show opponent information
      // Since these are games the user joined, the creator is the opponent
      if (game.creator) {
        const creatorName = game.creator.full_name || 
                           `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                           'Unknown Player';
        
        // For doubles games, show both players like in other screens
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
                title: `${creatorFirstName} & ${partnerFirstName}`,
                imageUrl: game.creator.avatar_url || doublePlayerImages[index % doublePlayerImages.length]
              };
            }
          }
          
          // Fallback for doubles without partner info
          return {
            title: `${creatorName} (need partner)`,
            imageUrl: game.creator.avatar_url || doublePlayerImages[index % doublePlayerImages.length]
          };
        }
        
        // For singles games, show creator name
        return {
          title: creatorName,
          imageUrl: game.creator.avatar_url || singlePlayerImages[index % singlePlayerImages.length]
        };
      }

      // Fallback for games without creator info
      return {
        title: game.venue_name,
        imageUrl: game.game_type === 'singles' 
          ? singlePlayerImages[index % singlePlayerImages.length]
          : doublePlayerImages[index % doublePlayerImages.length]
      };
    };

    const opponentInfo = getOpponentInfo();
    
    // Create chips array with level, date, and venue name (simplified)
    const chips = [
      game.skill_level || 'Beginner', // Level
      dateTime, // Date and time
      game.original_game?.venue_name || game.venue_name || 'TBD', // Venue name only
    ];
    
    // Define chip background colors based on game status
    const chipBackgrounds = game.status === 'upcoming' ? [
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
      'rgba(255, 255, 255, 0.3)', // White with 30% opacity for upcoming games
    ] : [
      'rgba(0, 0, 0, 0.07)', // Default gray for past games
      'rgba(0, 0, 0, 0.07)', // Default gray for past games
      'rgba(0, 0, 0, 0.07)', // Default gray for past games
    ];

    // Create avatar with opponent's photo or placeholder
    const avatarIcon = (
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: opponentInfo.imageUrl }}
          style={styles.avatarImage}
        />
      </View>
    );

    // Right element based on status
    const rightElement = game.status === 'upcoming' ? (
      <ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_CHEVRON} />
    ) : (
      <Text style={[styles.resultText, { color: '#666' }]}>Completed</Text>
    );

    // Define list item style with conditional background color
    const listItemStyle = {
      ...styles.listItem,
      ...(game.status === 'upcoming' && {
        backgroundColor: game.game_type === 'singles' ? '#96BE6B' : '#4DAAC2'
      })
    };

    return (
      <ListItem
        key={game.id}
        title={opponentInfo.title}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        rightElement={rightElement}
        onPress={() => handleGamePress(game.id)}
        style={listItemStyle}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={require('../../assets/images/empty2.png')}
        style={styles.emptyStateImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyStateTitle}>No games yet</Text>
      
      <View style={styles.emptyButtonsContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={() => (navigation as any).navigate('Search')}
        >
          <Text style={styles.primaryButtonText}>Find</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => (navigation as any).navigate('Schedules')}
        >
          <Text style={styles.secondaryButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#000000" />
      <Text style={styles.loadingText}>Loading your games...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Info size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>Unable to load games</Text>
      <Text style={styles.emptyStateDescription}>
        Please check your connection and try again.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      {/* Only show header when there are games */}
      {userGames.length > 0 && (
        <View style={styles.headerContainer}>
          <Text style={styles.title}>My Games</Text>
          <Text style={styles.subtitle}>Upcoming and past games</Text>
        </View>
      )}
      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadUserGames}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : userGames.length > 0 ? (
          <>
            {/* Upcoming Games Section */}
            {upcomingGames.length > 0 && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionTitle}>Upcoming Games</Text>
                </View>
                <View style={styles.gamesListContainer}>
                  {upcomingGames.map((game, index) => renderGameItem(game, index))}
                </View>
              </>
            )}

            {/* Past Games Section */}
            {pastGames.length > 0 && (
              <>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionTitle}>Past Games</Text>
                </View>
                <View style={styles.gamesListContainer}>
                  {pastGames.map((game, index) => renderGameItem(game, index))}
                </View>
              </>
            )}
          </>
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
    paddingTop: 4,
    paddingBottom: 8,
    flexGrow: 1,
  },
  sectionHeaderContainer: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 0,
  },
  gamesListContainer: {
    marginBottom: 16,
    gap: 8,
  },
  listItem: {
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
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
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  emptyStateImage: {
    width: 300,
    height: 300,
    marginBottom: 8,
  },
  emptyButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
});

export default GamesScreen; 