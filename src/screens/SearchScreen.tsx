import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { gameService, Game } from '../services/gameService';
import { authService } from '../services/authService';

const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_AVATAR = '#000000';

const SearchScreen: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadAvailableGames();
  }, []);

  const loadAvailableGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user to exclude their games
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id || 'current_user_id';
      
      // Fetch available games
      const availableGames = await gameService.getAvailableGames(currentUserId);
      setGames(availableGames);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const handleGamePress = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      (navigation as any).navigate('FindDetails', { game });
    }
  };

  const renderGameItem = (game: Game) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    
    // Create chips array with player name, level on first line, and location on second line
    let chips: string[] = [];
    
    if (game.game_type === 'singles') {
      chips = [
        game.creator_name,
        game.creator_level,
        game.location
      ];
    } else {
      if (game.partner_name) {
        chips = [
          `${game.creator_name} & ${game.partner_name}`,
          game.creator_level,
          game.location
        ];
      } else {
        chips = [
          `${game.creator_name} (need partner)`,
          game.creator_level,
          game.location
        ];
      }
    }
    
    // Define chip background colors based on game type
    const chipBackgrounds = [
      game.game_type === 'singles' ? '#FFC738' : '#FF9442', // Player name chip
      'rgba(0, 0, 0, 0.07)', // Level chip (default)
      'rgba(0, 0, 0, 0.07)', // Location chip (default)
    ];

    // Always use Search icon
    const avatarIcon = (
      <Search size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    );

    return (
      <ListItem
        key={game.id}
        title={dateTime}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        onPress={() => handleGamePress(game.id)}
        style={styles.listItem}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Search size={48} color="#CCC" />
      </View>
      <Text style={styles.emptyStateTitle}>No games found</Text>
      <Text style={styles.emptyStateDescription}>
        No games available right now. Check back later or create your own!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading games...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        <Calendar size={48} color="#CCC" />
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
        <Text style={styles.title}>Find Games</Text>
        <Text style={styles.subtitle}>Discover games near you</Text>
      </View>
      <ScrollView 
        style={styles.scrollViewContainer} 
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadAvailableGames}
            tintColor="#007AFF"
          />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : games.length > 0 ? (
          games.map(renderGameItem)
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

export default SearchScreen; 