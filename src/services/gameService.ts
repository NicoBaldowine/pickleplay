import { supabaseClient } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define ENUM types based on your Supabase setup
export type GameType = 'singles' | 'doubles';
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'pro'; // Adjust if your enum is different
export type GameStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Court {
  id: string;
  name: string;
  // Add other court properties if needed, e.g., address, number_of_courts
  // For now, matching the dummy data structure and screenshot
  distance?: string; // This seems to be display-only, not from DB in screenshot
}

export interface GameData {
  game_type: 'singles' | 'doubles';
  partner_name?: string;
  player_level: string;
  court_id: string;
  scheduled_time: string;
}

export interface Game {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_level: string;
  partner_id?: string;
  partner_name?: string;
  partner_level?: string;
  date: string;
  time: string;
  location: string;
  court_number?: string;
  game_type: 'singles' | 'doubles';
  skill_level: string;
  notes?: string;
  status: 'open' | 'full' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface UserGame {
  id: string;
  opponent_name: string;
  opponent_level: string;
  date: string;
  time: string;
  location: string;
  game_type: 'singles' | 'doubles';
  status: 'upcoming' | 'past';
  result?: 'won' | 'lost';
  original_game: Game;
}

class GameService {
  private readonly USER_GAMES_KEY = 'user_games';
  private readonly USER_SCHEDULES_KEY = 'user_schedules';

  // Create a new game (schedule)
  async createGame(gameData: Omit<Game, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<{ success: boolean; gameId?: string; error?: string }> {
    try {
      const gameWithDefaults = {
        ...gameData,
        status: 'open' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Generate a random ID
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const gameWithId = { ...gameWithDefaults, id: gameId };

      // Save the created game as a user schedule
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        await this.saveUserSchedule(currentUser.id, gameWithId);
      }

      console.log('Game created and saved as schedule:', gameWithId);
      
      return { success: true, gameId };
    } catch (error) {
      console.error('Error creating game:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  // Helper method to get current user
  private async getCurrentUser() {
    try {
      const { authService } = await import('./authService');
      return await authService.getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Save a schedule created by the user
  private async saveUserSchedule(userId: string, schedule: Game): Promise<void> {
    try {
      const existingSchedules = await this.getUserSchedules(userId);
      const updatedSchedules = [...existingSchedules, schedule];
      
      await AsyncStorage.setItem(
        `${this.USER_SCHEDULES_KEY}_${userId}`,
        JSON.stringify(updatedSchedules)
      );
    } catch (error) {
      console.error('Error saving user schedule:', error);
    }
  }

  // Get schedules created by the user
  async getUserSchedules(userId: string): Promise<Game[]> {
    try {
      const userSchedulesString = await AsyncStorage.getItem(`${this.USER_SCHEDULES_KEY}_${userId}`);
      if (userSchedulesString) {
        const userSchedules: Game[] = JSON.parse(userSchedulesString);
        return userSchedules;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user schedules:', error);
      return [];
    }
  }

  // Get games created by current user
  async getUserGames(userId: string): Promise<UserGame[]> {
    try {
      // Get user's accepted games from AsyncStorage
      const userGamesString = await AsyncStorage.getItem(`${this.USER_GAMES_KEY}_${userId}`);
      if (userGamesString) {
        const userGames: UserGame[] = JSON.parse(userGamesString);
        return userGames;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user games:', error);
      return [];
    }
  }

  // Get available games created by other users (excluding current user's games)
  async getAvailableGames(currentUserId: string): Promise<Game[]> {
    try {
      // Get today's date for relative dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(today);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      const fourDaysFromNow = new Date(today);
      fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

      // Format dates as YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      // Return mock games for testing - these represent games created by other users
      const mockGames: Game[] = [
        {
          id: 'game_001',
          creator_id: 'user_alex_001',
          creator_name: 'Alex Rodriguez',
          creator_level: 'Advanced',
          date: formatDate(today),
          time: '18:00',
          location: 'Central Park Courts',
          court_number: 'Court 3',
          game_type: 'singles',
          skill_level: 'Intermediate-Advanced',
          notes: 'Looking for a competitive singles match!',
          status: 'open',
          created_at: '2025-01-20T10:00:00Z',
          updated_at: '2025-01-20T10:00:00Z',
        },
        {
          id: 'game_002',
          creator_id: 'user_maria_002',
          creator_name: 'Maria Garcia',
          creator_level: 'Intermediate',
          date: formatDate(tomorrow),
          time: '17:30',
          location: 'Riverside Recreation Center',
          court_number: 'Court 1',
          game_type: 'singles',
          skill_level: 'Beginner-Intermediate',
          notes: 'Casual game, all skill levels welcome',
          status: 'open',
          created_at: '2025-01-20T14:30:00Z',
          updated_at: '2025-01-20T14:30:00Z',
        },
        {
          id: 'game_003',
          creator_id: 'user_john_003',
          creator_name: 'John Smith',
          creator_level: 'Advanced',
          partner_id: 'user_jane_004',
          partner_name: 'Jane Doe',
          partner_level: 'Advanced',
          date: formatDate(dayAfterTomorrow),
          time: '19:00',
          location: 'Downtown Sports Complex',
          court_number: 'Court 2',
          game_type: 'doubles',
          skill_level: 'Advanced',
          notes: 'Looking for another doubles team to play against',
          status: 'open',
          created_at: '2025-01-21T09:15:00Z',
          updated_at: '2025-01-21T09:15:00Z',
        },
        {
          id: 'game_004',
          creator_id: 'user_sarah_005',
          creator_name: 'Sarah Wilson',
          creator_level: 'Beginner',
          date: formatDate(threeDaysFromNow),
          time: '16:00',
          location: 'Community Center Courts',
          court_number: 'Court 4',
          game_type: 'doubles',
          skill_level: 'Beginner-Intermediate',
          notes: 'Need a partner for doubles - beginners welcome!',
          status: 'open',
          created_at: '2025-01-21T16:45:00Z',
          updated_at: '2025-01-21T16:45:00Z',
        },
        {
          id: 'game_005',
          creator_id: 'user_mike_006',
          creator_name: 'Mike Johnson',
          creator_level: 'Expert',
          date: formatDate(fourDaysFromNow),
          time: '20:00',
          location: 'Elite Pickleball Club',
          court_number: 'Court 1',
          game_type: 'singles',
          skill_level: 'Expert',
          notes: 'Advanced players only - tournament prep',
          status: 'open',
          created_at: '2025-01-22T11:20:00Z',
          updated_at: '2025-01-22T11:20:00Z',
        },
      ];

      // Get user's accepted games to filter them out
      const userGames = await this.getUserGames(currentUserId);
      const acceptedGameIds = userGames.map(ug => ug.original_game.id);

      // Filter out games created by current user and already accepted games
      return mockGames.filter(game => 
        game.creator_id !== currentUserId && 
        !acceptedGameIds.includes(game.id)
      );
    } catch (error) {
      console.error('Error fetching available games:', error);
      return [];
    }
  }

  // Join a game (accept game)
  async joinGame(gameId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the game details
      const availableGames = await this.getAvailableGames(userId);
      const game = availableGames.find(g => g.id === gameId);
      
      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      // Create a UserGame object
      const userGame: UserGame = {
        id: `user_game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        opponent_name: game.game_type === 'singles' 
          ? game.creator_name 
          : game.partner_name 
            ? `${game.creator_name} & ${game.partner_name}`
            : game.creator_name,
        opponent_level: game.creator_level,
        date: game.date,
        time: game.time,
        location: game.location,
        game_type: game.game_type,
        status: 'upcoming',
        original_game: game,
      };

      // Get existing user games
      const existingGames = await this.getUserGames(userId);
      
      // Add the new game
      const updatedGames = [...existingGames, userGame];
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        `${this.USER_GAMES_KEY}_${userId}`, 
        JSON.stringify(updatedGames)
      );

      console.log(`User ${userId} successfully joined game ${gameId}`);
      return { success: true };
    } catch (error) {
      console.error('Error joining game:', error);
      return { success: false, error: 'Failed to join game' };
    }
  }

  // Format date and time for display
  formatGameDateTime(date: string, time: string): string {
    try {
      const gameDate = new Date(`${date}T${time}`);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const isToday = gameDate.toDateString() === now.toDateString();
      const isTomorrow = gameDate.toDateString() === tomorrow.toDateString();

      const timeStr = gameDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      if (isToday) {
        return `Today at ${timeStr}`;
      } else if (isTomorrow) {
        return `Tomorrow at ${timeStr}`;
      } else {
        const dateStr = gameDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        return `${dateStr} at ${timeStr}`;
      }
    } catch (error) {
      return `${date} at ${time}`;
    }
  }

  // Get game type display text
  getGameTypeDisplay(game: Game): string {
    if (game.game_type === 'singles') {
      return `Singles vs ${game.creator_name}`;
    } else {
      if (game.partner_name) {
        return `Doubles vs ${game.creator_name} & ${game.partner_name}`;
      } else {
        return `Doubles with ${game.creator_name} (need partner)`;
      }
    }
  }

  // Get user initials for avatar
  getUserInitials(name: string): string {
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    } else if (names.length === 1) {
      return names[0][0].toUpperCase();
    }
    return 'U';
  }

  // Cancel a game (remove from user's games)
  async cancelGame(gameId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing user games
      const existingGames = await this.getUserGames(userId);
      
      // Filter out the cancelled game
      const updatedGames = existingGames.filter(game => game.id !== gameId);
      
      // Save updated list to AsyncStorage
      await AsyncStorage.setItem(
        `${this.USER_GAMES_KEY}_${userId}`, 
        JSON.stringify(updatedGames)
      );

      console.log(`User ${userId} successfully cancelled game ${gameId}`);
      return { success: true };
    } catch (error) {
      console.error('Error cancelling game:', error);
      return { success: false, error: 'Failed to cancel game' };
    }
  }

  // Delete a schedule (remove from user's schedules)
  async deleteSchedule(scheduleId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get existing user schedules
      const existingSchedules = await this.getUserSchedules(userId);
      
      // Filter out the deleted schedule
      const updatedSchedules = existingSchedules.filter(schedule => schedule.id !== scheduleId);
      
      // Save updated list to AsyncStorage
      await AsyncStorage.setItem(
        `${this.USER_SCHEDULES_KEY}_${userId}`, 
        JSON.stringify(updatedSchedules)
      );

      console.log(`User ${userId} successfully deleted schedule ${scheduleId}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      return { success: false, error: 'Failed to delete schedule' };
    }
  }

  // Get avatar background color based on game type
  getAvatarBackgroundColor(gameType: 'singles' | 'doubles'): string {
    return gameType === 'singles' ? '#96BE6B' : '#43A4BE';
  }
}

export const gameService = new GameService(); 