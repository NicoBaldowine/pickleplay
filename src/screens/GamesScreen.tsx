import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl, Image } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserGames();
  }, []);

  // Add effect to reload when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadUserGames();
    }
  }, [refreshTrigger]);

  const loadUserGames = async () => {
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
    
    // Create chips array with level, date, and location
    const chips = [
      game.opponent_level || 'Beginner', // Level
      dateTime, // Date and time
      game.location || 'TBD', // Location
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

    // Select appropriate image based on game type and index
    const imageUrl = game.game_type === 'singles' 
      ? singlePlayerImages[index % singlePlayerImages.length]
      : doublePlayerImages[index % doublePlayerImages.length];

    // Create avatar with profile picture placeholder
    const avatarIcon = (
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.avatarImage}
        />
      </View>
    );

    // Right element based on status
    const rightElement = game.status === 'upcoming' ? (
      <ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_CHEVRON} />
    ) : game.result ? (
      <Text style={[styles.resultText, { color: game.result === 'won' ? '#34C759' : '#FF3B30' }]}>
        {game.result === 'won' ? 'Won' : 'Lost'}
      </Text>
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
        title={game.opponent_name}
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
      <View style={styles.emptyIconContainer}>
        <Users size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>No games yet</Text>
      <Text style={styles.emptyStateDescription}>
        You haven't accepted any games yet. Go to Find to discover games!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
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
      <View style={styles.headerContainer}>
        <Text style={styles.title}>My Games</Text>
        <Text style={styles.subtitle}>Upcoming and past games</Text>
      </View>
      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadUserGames}
            tintColor="#007AFF"
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
  },
  listItem: {
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
});

export default GamesScreen; 