import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Calendar, SlidersHorizontal } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

// Import custom components
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { gameService, GameWithPlayers } from '../services/gameService';
import { authService } from '../services/authService';

// Import filter types
import { GameFilters } from './FilterScreen';

const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_AVATAR = '#555';

const defaultFilters: GameFilters = {
  gameTypes: {
    singles: true,
    doubles: true,
  },
  skillLevels: {
    beginner: true,
    intermediate: true,
    advanced: true,
    expert: true,
  },
  radius: 25, // default to 25 miles
};

const SearchScreen: React.FC = () => {
  const [games, setGames] = useState<GameWithPlayers[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameWithPlayers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<GameFilters>(defaultFilters);
  
  const navigation = useNavigation();
  const route = useRoute();

  // Check for applied filters from navigation
  useFocusEffect(
    React.useCallback(() => {
      const appliedFilters = (route.params as any)?.appliedFilters;
      if (appliedFilters) {
        setFilters(appliedFilters);
        // Clear the params to avoid re-applying on future focus
        navigation.setParams({ appliedFilters: undefined } as any);
      }
    }, [route.params, navigation])
  );

  useEffect(() => {
    loadAvailableGames();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [games, filters]);

  const loadAvailableGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user to exclude their games
      const currentUser = await authService.getCurrentUser();
      const currentUserId = currentUser?.id || 'current_user_id';
      
      // Fetch available games with details
      const availableGames = await gameService.getAvailableGamesWithDetails(currentUserId);
      setGames(availableGames);
    } catch (err) {
      console.error('Error loading games:', err);
      setError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = games;

    // Filter by game type
    if (!filters.gameTypes.singles && !filters.gameTypes.doubles) {
      // If no game types selected, show nothing
      filtered = [];
    } else if (!filters.gameTypes.singles) {
      filtered = filtered.filter(game => game.game_type === 'doubles');
    } else if (!filters.gameTypes.doubles) {
      filtered = filtered.filter(game => game.game_type === 'singles');
    }

    // Filter by skill level
    const selectedLevels = Object.entries(filters.skillLevels)
      .filter(([_, isSelected]) => isSelected)
      .map(([level, _]) => level);
    
    if (selectedLevels.length > 0) {
      filtered = filtered.filter(game => 
        selectedLevels.includes(game.skill_level.toLowerCase())
      );
    }

    // TODO: Filter by distance when location services are implemented
    // This will require getting the user's current location and calculating
    // distance to each game's location

    setFilteredGames(filtered);
  };

  const handleGamePress = (gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) {
      (navigation as any).navigate('FindDetails', { game });
    }
  };

  const handleFiltersPress = () => {
    (navigation as any).navigate('Filter', {
      filters,
    });
  };

  const renderGameItem = (game: GameWithPlayers) => {
    const dateTime = gameService.formatGameDateTime(game.scheduled_date, game.scheduled_time);
    
    // For now, use a simplified display name approach since we can't use async in render
    // TODO: Consider using state to manage async display names
    const getDisplayName = () => {
      if (!game.creator) return 'Unknown Player';
      
      const creatorName = game.creator.full_name || 
                         `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                         'Unknown Player';

      if (game.game_type === 'singles') {
        return creatorName;
      } else {
        // For doubles, check if partner info is in notes
        if (game.notes && game.notes.includes('with partner:')) {
          const partnerMatch = game.notes.match(/with partner: (.+?)(?:\.|$)/);
          if (partnerMatch && partnerMatch[1]) {
            // Extract first names only for cleaner display
            const creatorFirstName = game.creator.first_name || creatorName.split(' ')[0] || 'User';
            const partnerFullName = partnerMatch[1].trim();
            const partnerFirstName = partnerFullName.split(' ')[0] || 'Partner';
            return `${creatorFirstName} & ${partnerFirstName}`;
          }
        }
        
        // Check if we have other registered players
        const otherPlayers = game.players?.filter(p => p.user_id !== game.creator_id) || [];
        if (otherPlayers.length > 0 && otherPlayers[0].profile) {
          const creatorFirstName = game.creator.first_name || creatorName.split(' ')[0] || 'User';
          const partnerName = otherPlayers[0].profile.full_name || 
                             `${otherPlayers[0].profile.first_name || ''} ${otherPlayers[0].profile.last_name || ''}`.trim() || 
                             'Partner';
          const partnerFirstName = otherPlayers[0].profile.first_name || partnerName.split(' ')[0] || 'Partner';
          return `${creatorFirstName} & ${partnerFirstName}`;
        }
        
        return `${creatorName} (need partner)`;
      }
    };
    
    const displayName = getDisplayName();
    
    // Create chips array with player name, level, and simplified location
    const chips: string[] = [
      displayName,
      game.skill_level,
      game.venue_name // Only venue name, no address or city
    ];
    
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
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Find Games</Text>
          <Text style={styles.subtitle}>Discover games near you</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFiltersPress}
        >
          <SlidersHorizontal size={16} color="#000000" />
        </TouchableOpacity>
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
        ) : filteredGames.length > 0 ? (
          filteredGames.map(renderGameItem)
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5E9CF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginTop: 4,
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