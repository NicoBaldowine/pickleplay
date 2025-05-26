import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Users, Info, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';
import Tabs, { TabItem } from '../components/ui/Tabs';

// Import game service and types
import { gameService, UserGame } from '../services/gameService';
import { authService } from '../services/authService';

interface GamesScreenProps {
  refreshTrigger?: number;
}

// Tab items definition for GamesScreen
const gameStatusTabs: TabItem[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 16;
const ICON_COLOR_AVATAR = '#555';
const ICON_COLOR_CHEVRON = '#888';

const GamesScreen: React.FC<GamesScreenProps> = ({ refreshTrigger }) => {
  const [activeGameTab, setActiveGameTab] = useState<string>('upcoming');
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

  const filteredGames = userGames.filter(game => game.status === activeGameTab);

  const renderGameItem = (game: UserGame) => {
    const dateTime = gameService.formatGameDateTime(game.date, game.time);
    
    // Create avatar with user initials and color based on game type
    const initials = gameService.getUserInitials(game.opponent_name);
    const avatarBackgroundColor = gameService.getAvatarBackgroundColor(game.game_type);
    const avatarIcon = (
      <View style={[styles.avatarContainer, { backgroundColor: avatarBackgroundColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
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

    return (
      <ListItem
        key={game.id}
        title={game.opponent_name}
        description={dateTime}
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
        {activeGameTab === 'upcoming' ? (
          <User size={48} color="#CCC" />
        ) : (
          <Users size={48} color="#CCC" />
        )}
      </View>
      <Text style={styles.emptyStateTitle}>No {activeGameTab} games</Text>
      <Text style={styles.emptyStateDescription}>
        {activeGameTab === 'upcoming' 
          ? 'You haven\'t accepted any games yet. Go to Find to discover games!'
          : 'No completed games to show.'
        }
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
      <TopBar
        title="My Games"
        description="Your scheduled and completed games"
      />
      <Tabs 
        items={gameStatusTabs} 
        activeTabId={activeGameTab} 
        onTabPress={setActiveGameTab} 
        style={styles.tabsContainer} 
      />
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
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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