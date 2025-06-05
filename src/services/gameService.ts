import { supabaseClient } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { authService } from './authService';

// Define types based on database schema
export type GameType = 'singles' | 'doubles';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type GameStatus = 'open' | 'full' | 'in_progress' | 'completed' | 'cancelled';

// Use types from database
export type Game = Database['public']['Tables']['games']['Row'];
export type GameInsert = Database['public']['Tables']['games']['Insert'];
export type GameUpdate = Database['public']['Tables']['games']['Update'];
export type GameUser = Database['public']['Tables']['game_users']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface GameWithPlayers extends Game {
  creator?: Profile;
  players?: (GameUser & { profile?: Profile })[];
}

export interface UserGame {
  id: string;
  venue_name: string;
  skill_level: string;
  date: string;
  time: string;
  location: string;
  game_type: 'singles' | 'doubles';
  status: 'upcoming' | 'past';
  players_count: string;
  original_game: Game;
  creator?: Profile;
}

class GameService {
  private readonly tableName = 'games';
  private readonly gameUsersTable = 'game_users';

  async createGame(gameData: GameInsert): Promise<{ success: boolean; gameId?: string; error?: string }> {
    try {
      // Get current user
      const userResult = await supabaseClient.auth.getUser();
      if (!userResult.data?.user) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }

      // Ensure creator_id is set
      gameData.creator_id = userResult.data.user.id;

      // Set defaults
      gameData.max_players = gameData.max_players || 4;
      gameData.current_players = gameData.current_players || 1;
      gameData.status = gameData.status || 'open';
      gameData.duration_minutes = gameData.duration_minutes || 90;

      // Create the game using the insert method
      const { data, error } = await supabaseClient.from(this.tableName).insert(gameData);
      
      if (error) {
        console.error('Error creating game:', error);
        return { success: false, error: error.message || 'Failed to create game' };
      }
      
      if (!data || (Array.isArray(data) && data.length === 0)) {
        return { success: false, error: 'No data returned after insert' };
      }

      const game = Array.isArray(data) ? data[0] : data;

      // Add creator as first player
      const { error: playerError } = await supabaseClient.from(this.gameUsersTable).insert({
        game_id: game.id,
        user_id: userResult.data.user.id,
        role: 'creator',
        status: 'confirmed'
      });

      if (playerError) {
        console.error('Error adding creator as player:', playerError);
        // Don't fail the whole operation, game was created
      }

      console.log('Game created successfully:', game.id);
      return { success: true, gameId: game.id };
    } catch (error) {
      console.error('Error creating game:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  async getUserSchedules(userId: string): Promise<GameWithPlayers[]> {
    try {
      // Get games where user is creator
      const createdGamesResult = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { creator_id: userId },
        orderBy: 'scheduled_date.asc'
      });

      if (createdGamesResult.error) {
        console.error('Error fetching created games:', createdGamesResult.error);
        throw createdGamesResult.error;
      }

      const createdGames = createdGamesResult.data || [];

      // Get games where user is a participant
      const participantGamesResult = await supabaseClient.query(this.gameUsersTable, {
        select: 'game_id',
        filters: { user_id: userId }
      });

      if (participantGamesResult.error) {
        console.error('Error fetching participant games:', participantGamesResult.error);
        throw participantGamesResult.error;
      }

      const participantGames = participantGamesResult.data || [];
      const gameIds = participantGames.map((p: any) => p.game_id);
      
      let joinedGames: Game[] = [];
      if (gameIds.length > 0) {
        // Fetch each joined game individually (since 'in' is not supported)
        const gamePromises = gameIds.map((gameId: string) =>
          supabaseClient.query(this.tableName, {
            select: '*',
            filters: { id: gameId }
          })
        );

        const gameResults = await Promise.all(gamePromises);
        joinedGames = gameResults
          .filter(result => !result.error && result.data)
          .map(result => result.data)
          .flat();
      }

      // Combine and deduplicate
      const allGames = [...createdGames, ...joinedGames];
      const uniqueGames = allGames.filter((game, index, self) => 
        index === self.findIndex((g) => g.id === game.id)
      );

      return uniqueGames;
    } catch (error) {
      console.error('Error fetching user schedules:', error);
      throw error;
    }
  }

  async getUserGames(userId: string): Promise<UserGame[]> {
    try {
      // Get only games where user joined (not games they created)
      const joinedGames = await this.getUserJoinedGames(userId);
      
      // Fetch creator profiles for all games
      const gamesWithCreators = await Promise.all(
        joinedGames.map(async (game) => {
          // Fetch creator profile
          const creatorResult = await supabaseClient.query('profiles', {
            select: '*',
            filters: { id: game.creator_id },
            single: true
          });

          const userGame: UserGame = {
            id: game.id,
            venue_name: game.venue_name,
            skill_level: game.skill_level,
            date: game.scheduled_date,
            time: game.scheduled_time,
            location: `${game.venue_address}, ${game.city}`,
            game_type: game.game_type,
            status: new Date(`${game.scheduled_date}T${game.scheduled_time}`) > new Date() ? 'upcoming' : 'past',
            players_count: `${game.current_players}/${game.max_players}`,
            original_game: game,
            creator: creatorResult.data || undefined // Add creator profile data
          };
          return userGame;
        })
      );

      return gamesWithCreators;
    } catch (error) {
      console.error('Error fetching user games:', error);
      throw error;
    }
  }

  async getUserJoinedGames(userId: string): Promise<Game[]> {
    try {
      // Get games where user is a participant (not creator)
      const participantGamesResult = await supabaseClient.query(this.gameUsersTable, {
        select: 'game_id',
        filters: { user_id: userId }
      });

      if (participantGamesResult.error) {
        console.error('Error fetching participant games:', participantGamesResult.error);
        throw participantGamesResult.error;
      }

      const participantGames = participantGamesResult.data || [];
      const gameIds = participantGames.map((p: any) => p.game_id);
      
      let joinedGames: Game[] = [];
      if (gameIds.length > 0) {
        // Fetch each joined game individually
        const gamePromises = gameIds.map((gameId: string) =>
          supabaseClient.query(this.tableName, {
            select: '*',
            filters: { id: gameId }
          })
        );

        const gameResults = await Promise.all(gamePromises);
        joinedGames = gameResults
          .filter(result => !result.error && result.data)
          .map(result => result.data)
          .flat();

        // Filter out games where the user is the creator (we only want joined games)
        joinedGames = joinedGames.filter((game: Game) => game.creator_id !== userId);
      }

      return joinedGames.sort((a, b) => {
        const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`);
        const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
    } catch (error) {
      console.error('Error fetching user joined games:', error);
      throw error;
    }
  }

  async deleteSchedule(scheduleId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete from games table (will cascade to game_users)
      const { error } = await supabaseClient.from(this.tableName).delete().eq('id', scheduleId);

      if (error) {
        console.error('Error deleting schedule:', error);
        return { success: false, error: error.message || 'Failed to delete schedule' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting schedule:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  async getAvailableGames(excludeUserId: string): Promise<GameWithPlayers[]> {
    try {
      // Get all open games
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { status: 'open' },
        orderBy: 'scheduled_date.asc'
      });

      if (result.error) {
        console.error('Error fetching available games:', result.error);
        throw result.error;
      }

      const games = result.data || [];
      
      // Filter out games created by current user
      const availableGames = games.filter((game: Game) => game.creator_id !== excludeUserId);

      return availableGames;
    } catch (error) {
      console.error('Error fetching available games:', error);
      throw error;
    }
  }

  async joinGame(gameId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if user session is valid
      const userResult = await supabaseClient.auth.getUser();
      if (!userResult.data?.user) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }

      // Check if user is already in the game
      const existingResult = await supabaseClient.query(this.gameUsersTable, {
        select: 'id',
        filters: [
          ['game_id', gameId],
          ['user_id', userId]
        ],
        single: true
      });

      if (existingResult.data) {
        return { success: false, error: 'You are already in this game' };
      }

      // First attempt - Add user to game
      const { error } = await supabaseClient.from(this.gameUsersTable).insert({
        game_id: gameId,
        user_id: userId,
        role: 'player',
        status: 'confirmed'
      });

      if (error) {
        console.error('Error joining game:', error);
        
        // Check for JWT expired errors and attempt refresh
        if (error.message?.includes('JWT expired') || error.code === 'PGRST301') {
          console.log('🔄 JWT expired, attempting to refresh session...');
          
          // Try to refresh session
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed, retrying join game...');
            
            // Retry adding user to game with fresh token
            const { error: retryError } = await supabaseClient.from(this.gameUsersTable).insert({
              game_id: gameId,
              user_id: userId,
              role: 'player',
              status: 'confirmed'
            });
            
            if (retryError) {
              console.error('Error joining game after refresh:', retryError);
              return { success: false, error: retryError.message || 'Failed to join game after refresh' };
            }
            
            console.log('✅ Successfully joined game after session refresh');
          } else {
            console.log('❌ Session refresh failed:', refreshResult.error);
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        } else {
          return { success: false, error: error.message || 'Failed to join game' };
        }
      }

      // Update current_players count
      // Note: We'd need to implement an RPC function for this in Supabase
      // For now, we'll do it manually by getting the game, incrementing, and updating
      const gameResult = await supabaseClient.query(this.tableName, {
        select: 'current_players',
        filters: [['id', gameId]],
        single: true
      });

      if (gameResult.data) {
        const newCount = (gameResult.data.current_players || 0) + 1;
        await supabaseClient.from(this.tableName).update({ current_players: newCount }).eq('id', gameId);
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error joining game:', error);
      
      // Check for JWT expired errors in catch block and attempt refresh
      if (error && 
          (error.code === 'PGRST301' || error.message?.includes('JWT expired'))) {
        console.log('🔄 JWT expired in catch block, attempting to refresh session...');
        
        try {
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed in catch block, retrying join game...');
            
            // Retry the entire operation
            const { error: retryError } = await supabaseClient.from(this.gameUsersTable).insert({
              game_id: gameId,
              user_id: userId,
              role: 'player',
              status: 'confirmed'
            });
            
            if (retryError) {
              return { success: false, error: retryError.message || 'Failed to join game after refresh' };
            }
            
            // Update current_players count for retry
            const gameResult = await supabaseClient.query(this.tableName, {
              select: 'current_players',
              filters: [['id', gameId]],
              single: true
            });

            if (gameResult.data) {
              const newCount = (gameResult.data.current_players || 0) + 1;
              await supabaseClient.from(this.tableName).update({ current_players: newCount }).eq('id', gameId);
            }
            
            return { success: true };
          } else {
            return { success: false, error: 'Session expired and could not be refreshed. Please log in again.' };
          }
        } catch (refreshError) {
          return { success: false, error: 'Session expired and refresh failed. Please log in again.' };
        }
      }
      
      // For non-JWT errors
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  async cancelGame(gameId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Remove user from game
      const { error } = await supabaseClient.from(this.gameUsersTable).delete().eq('game_id', gameId);

      if (error) {
        console.error('Error leaving game:', error);
        return { success: false, error: error.message || 'Failed to leave game' };
      }

      // Update current_players count
      const gameResult = await supabaseClient.query(this.tableName, {
        select: 'current_players',
        filters: [['id', gameId]],
        single: true
      });

      if (gameResult.data) {
        const newCount = Math.max((gameResult.data.current_players || 1) - 1, 0);
        await supabaseClient.from(this.tableName).update({ current_players: newCount }).eq('id', gameId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error canceling game:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  // Helper methods
  formatGameDateTime(date: string, time: string): string {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date time:', error);
      return 'Invalid date';
    }
  }

  getGameTypeDisplay(game: Game): string {
    return `${game.game_type.charAt(0).toUpperCase() + game.game_type.slice(1)} - ${game.skill_level}`;
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

  // Get avatar background color based on game type
  getAvatarBackgroundColor(gameType: GameType): string {
    return gameType === 'singles' ? '#96BE6B' : '#43A4BE';
  }

  async getGameWithDetails(gameId: string): Promise<GameWithPlayers | null> {
    try {
      // Get the game
      const gameResult = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { id: gameId },
        single: true
      });

      if (gameResult.error || !gameResult.data) {
        console.error('Error fetching game:', gameResult.error);
        return null;
      }

      const game = gameResult.data;

      // Get creator profile
      const creatorResult = await supabaseClient.query('profiles', {
        select: '*',
        filters: { id: game.creator_id },
        single: true
      });

      // Get all players
      const playersResult = await supabaseClient.query(this.gameUsersTable, {
        select: '*',
        filters: { game_id: gameId }
      });

      const players = playersResult.data || [];

      // Get profiles for all players
      const playerProfiles = await Promise.all(
        players.map(async (player: GameUser) => {
          const profileResult = await supabaseClient.query('profiles', {
            select: '*',
            filters: { id: player.user_id },
            single: true
          });
          return {
            ...player,
            profile: profileResult.data
          };
        })
      );

      return {
        ...game,
        creator: creatorResult.data,
        players: playerProfiles
      };
    } catch (error) {
      console.error('Error fetching game with details:', error);
      return null;
    }
  }

  // Helper to get display name for game
  async getGameDisplayName(game: GameWithPlayers): Promise<string> {
    if (!game.creator) return 'Unknown Player';
    
    const creatorName = game.creator.full_name || 
                       `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                       'Unknown Player';

    if (game.game_type === 'singles') {
      return creatorName;
    } else {
      // For doubles, check if we have other players
      const otherPlayers = game.players?.filter(p => p.user_id !== game.creator_id) || [];
      if (otherPlayers.length > 0 && otherPlayers[0].profile) {
        const partnerName = otherPlayers[0].profile.full_name || 
                           `${otherPlayers[0].profile.first_name || ''} ${otherPlayers[0].profile.last_name || ''}`.trim() || 
                           'Partner';
        return `${creatorName} & ${partnerName}`;
      }
      
      // If no registered players, check if partner info is in notes or game data
      // Look for partner info in game notes (legacy support)
      if (game.notes && game.notes.includes('with partner:')) {
        const partnerMatch = game.notes.match(/with partner: (.+?)(?:\.|$)/);
        if (partnerMatch && partnerMatch[1]) {
          return `${creatorName} & ${partnerMatch[1].trim()}`;
        }
      }
      
      // TODO: In the future, we could also check double_partners table here
      // if we store partner_id reference in the game record
      
      return `${creatorName} (need partner)`;
    }
  }

  // Update getAvailableGames to include player details
  async getAvailableGamesWithDetails(excludeUserId: string): Promise<GameWithPlayers[]> {
    try {
      const games = await this.getAvailableGames(excludeUserId);
      
      // Fetch details for each game
      const gamesWithDetails = await Promise.all(
        games.map(game => this.getGameWithDetails(game.id))
      );

      return gamesWithDetails.filter(game => game !== null) as GameWithPlayers[];
    } catch (error) {
      console.error('Error fetching available games with details:', error);
      throw error;
    }
  }
}

export const gameService = new GameService(); 