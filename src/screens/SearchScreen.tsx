import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Users, ChevronRight, Calendar, MapPin } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';
import Tabs, { TabItem } from '../components/ui/Tabs';

// Import game service and types
import { gameService, Game } from '../services/gameService';
import { authService } from '../services/authService';

// Tab items definition for SearchScreen
const searchTabs: TabItem[] = [
  { id: 'singles', label: 'Singles' },
  { id: 'doubles', label: 'Doubles' },
];

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 16;
const ICON_COLOR_AVATAR = 'rgba(0, 0, 0, 0.5)';
const ICON_COLOR_CHEVRON = '#888';

const SearchScreen: React.FC = () => {
  const [activeSearchTab, setActiveSearchTab] = useState<string>('singles');
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

  const filteredGames = games.filter(game => game.game_type === activeSearchTab);

  const renderGameItem = (game: Game) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    
    // Format description based on game type
    let description = '';
    if (game.game_type === 'singles') {
      description = `vs ${game.creator_name} • ${game.creator_level}\n${game.location}`;
    } else {
      if (game.partner_name) {
        description = `vs ${game.creator_name} & ${game.partner_name} • ${game.creator_level}\n${game.location}`;
      } else {
        description = `with ${game.creator_name} (need partner) • ${game.creator_level}\n${game.location}`;
      }
    }
    
    // Choose icon based on game type
    const avatarIcon = game.game_type === 'singles' ? (
      <User size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    ) : (
      <Users size={ICON_SIZE_AVATAR} color={ICON_COLOR_AVATAR} />
    );

    const rightElement = (
      <ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_CHEVRON} />
    );

    return (
      <ListItem
        key={game.id}
        title={dateTime}
        description={description}
        avatarIcon={avatarIcon}
        rightElement={rightElement}
        onPress={() => handleGamePress(game.id)}
        style={styles.listItem}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIconContainer}>
        {activeSearchTab === 'singles' ? (
          <User size={48} color="#CCC" />
        ) : (
          <Users size={48} color="#CCC" />
        )}
      </View>
      <Text style={styles.emptyStateTitle}>No {activeSearchTab} games found</Text>
      <Text style={styles.emptyStateDescription}>
        {activeSearchTab === 'singles' 
          ? 'No singles games available right now. Check back later or create your own!'
          : 'No doubles games available right now. Check back later or create your own!'
        }
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
      <TopBar
        title="Find Games"
        description="Discover and join games near you"
      />
      <Tabs 
        items={searchTabs} 
        activeTabId={activeSearchTab} 
        onTabPress={setActiveSearchTab} 
        style={styles.tabsContainer} 
      />
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
    backgroundColor: '#FEF2D6',
  },
  tabsContainer: {
    marginHorizontal: 16,
    marginTop: 4,
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