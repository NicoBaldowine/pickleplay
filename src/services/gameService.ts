import { supabaseClient } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { authService } from './authService';
import { notificationService } from './notificationService';

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
  creator_partner?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
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
  partner?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
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

      console.log('Game scheduled successfully:', game.id);
      return { success: true, gameId: game.id };
    } catch (error) {
      console.error('Error creating game:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  /**
   * Clean up expired games - automatically expire and remove games where:
   * 1. The scheduled time has passed
   * 2. The game is still 'open' (no one joined)
   * 3. Only the creator is in the game (current_players === 1)
   */
  async cleanupExpiredGames(): Promise<void> {
    try {
      const now = new Date();
      console.log('🧹 Starting cleanup of expired games at:', now.toISOString());

      // Get all open games that have passed their scheduled time
      const result = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { status: 'open' }
      });

      if (result.error) {
        console.error('Error fetching games for cleanup:', result.error);
        return;
      }

      const games = result.data || [];
      const expiredGames: Game[] = [];

      // Check each game to see if it has expired
      for (const game of games) {
        const gameDateTime = new Date(`${game.scheduled_date}T${game.scheduled_time}`);
        
        // If the game time has passed and only creator is in the game
        if (gameDateTime < now && game.current_players === 1) {
          expiredGames.push(game);
        }
      }

      console.log(`🕐 Found ${expiredGames.length} expired games to cleanup`);

      // Process each expired game
      for (const expiredGame of expiredGames) {
        try {
          console.log(`⏰ Expiring game ${expiredGame.id} scheduled for ${expiredGame.scheduled_date} ${expiredGame.scheduled_time}`);

          // Send expiry notification to the creator
          await notificationService.scheduleGameExpiredNotification(
            expiredGame.id,
            expiredGame.game_type as 'singles' | 'doubles',
            expiredGame.scheduled_date,
            expiredGame.scheduled_time
          );

          // Cancel any scheduled notifications for this game
          await notificationService.cancelGameNotifications(expiredGame.id);

          // Update game status to 'cancelled' instead of deleting
          // This preserves the record but removes it from active lists
          const { error: updateError } = await supabaseClient
            .from(this.tableName)
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', expiredGame.id);

          if (updateError) {
            console.error(`Error updating expired game ${expiredGame.id}:`, updateError);
          } else {
            console.log(`✅ Successfully expired game ${expiredGame.id}`);
          }
        } catch (error) {
          console.error(`Error processing expired game ${expiredGame.id}:`, error);
          // Continue with other games even if one fails
        }
      }

      console.log('🧹 Cleanup of expired games completed');
    } catch (error) {
      console.error('Error during expired games cleanup:', error);
    }
  }

  async getUserSchedules(userId: string): Promise<GameWithPlayers[]> {
    try {
      // Clean up expired games before fetching user schedules
      await this.cleanupExpiredGames();

      // Get ONLY games where user is creator (not participant)
      const createdGamesResult = await supabaseClient.query(this.tableName, {
        select: '*',
        filters: { creator_id: userId },
        orderBy: 'scheduled_date.asc'
      });

      if (createdGamesResult.error) {
        console.error('Error fetching created games:', createdGamesResult.error);
        throw createdGamesResult.error;
      }

      // Filter out cancelled games in JavaScript
      const createdGames = (createdGamesResult.data || []).filter((game: Game) => game.status !== 'cancelled');

      // Return ONLY games where user is creator
      // Do NOT include games where user is just a participant
      return createdGames;
    } catch (error) {
      console.error('Error fetching user schedules:', error);
      throw error;
    }
  }

  async getUserGames(userId: string): Promise<UserGame[]> {
    try {
      // Clean up expired games before fetching user games
      await this.cleanupExpiredGames();

      // Get only games where user joined (not games they created)
      const joinedGames = await this.getUserJoinedGames(userId);
      
      console.log(`🎮 DEBUG: User ${userId} has ${joinedGames.length} joined games:`, joinedGames.map(g => ({ id: g.id, type: g.game_type, creator: g.creator_id })));
      
      // Filter to show games where:
      // 1. User joined someone else's game (user is NOT creator), OR
      // 2. User created the game AND others have joined (has more than 1 participant)
      const actuallyJoinedGames = joinedGames.filter(game => {
        if (game.creator_id !== userId) {
          // User joined someone else's game
          return true;
        } else {
          // User created the game - only show if others have joined
          return game.current_players > 1;
        }
      });
      console.log(`🎯 DEBUG: Filtered to games user actually joined (not created):`, actuallyJoinedGames.map(g => ({ id: g.id, type: g.game_type, creator: g.creator_id })));
      
      // Fetch opponent information for all games
      const gamesWithOpponents = await Promise.all(
        actuallyJoinedGames.map(async (game) => {
          console.log(`🔍 DEBUG: Processing game ${game.id}, type: ${game.game_type}, creator: ${game.creator_id}`);
          
          // Get all participants in this game
          const participantsResult = await supabaseClient.query(this.gameUsersTable, {
            select: 'user_id',
            filters: { game_id: game.id }
          });

          const participants = participantsResult.data || [];
          console.log(`👥 DEBUG: Game ${game.id} has participants:`, participants.map((p: any) => p.user_id));
          
          // Find opponents (all participants except current user)
          const opponentIds = participants
            .map((p: any) => p.user_id)
            .filter((id: string) => id !== userId);

          console.log(`⚔️ DEBUG: Opponents for user ${userId} in game ${game.id}:`, opponentIds);

          // For games the user joined from others, always show them even if no opponents yet
          // The fact that they're in game_users means they accepted/joined the game

          let opponentInfo = {
            name: 'Unknown Player',
            imageUrl: game.game_type === 'singles' 
              ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
              : 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
          };

          if (opponentIds.length > 0) {
            // Get opponent profiles
            const opponentProfiles = await Promise.all(
              opponentIds.map(async (opponentId: string) => {
                const profileResult = await supabaseClient.query('profiles', {
                  select: '*',
                  filters: { id: opponentId },
                  single: true
                });
                console.log(`👤 DEBUG: Profile for opponent ${opponentId}:`, profileResult.data);
                return profileResult.data;
              })
            );

            const validOpponents = opponentProfiles.filter(profile => profile);
            console.log(`✅ DEBUG: Valid opponent profiles:`, validOpponents.map(p => ({ id: p?.id, name: p?.full_name, first: p?.first_name })));

            if (validOpponents.length > 0) {
              if (game.game_type === 'singles') {
                // For singles, show the single opponent
                const opponent = validOpponents[0];
                const opponentName = opponent.full_name || 
                                   `${opponent.first_name || ''} ${opponent.last_name || ''}`.trim() || 
                                   'Unknown Player';
                opponentInfo = {
                  name: opponentName,
                  imageUrl: opponent.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                };
              } else {
                // For doubles, show opponent team names
                if (validOpponents.length >= 2) {
                  const opponent1 = validOpponents[0];
                  const opponent2 = validOpponents[1];
                  const name1 = opponent1.first_name || opponent1.full_name?.split(' ')[0] || 'Player1';
                  const name2 = opponent2.first_name || opponent2.full_name?.split(' ')[0] || 'Player2';
                  opponentInfo = {
                    name: `${name1} & ${name2}`,
                    imageUrl: opponent1.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                  };
                } else if (validOpponents.length === 1) {
                  const opponent = validOpponents[0];
                  const opponentName = opponent.first_name || opponent.full_name?.split(' ')[0] || 'Player';
                  opponentInfo = {
                    name: `${opponentName} (need partner)`,
                    imageUrl: opponent.avatar_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
                  };
                }
              }
            }
          }

          console.log(`🎯 DEBUG: Final opponent info for game ${game.id}:`, opponentInfo);

          // Get current user's partner information for doubles games
          let partnerInfo = undefined;
          if (game.game_type === 'doubles') {
            try {
              console.log(`🔍 DEBUG: Getting partner info for doubles game ${game.id}, user: ${userId}`);
              
              // Get current user's game_users record to find partner_id
              const currentUserGameResult = await supabaseClient.query(this.gameUsersTable, {
                select: 'partner_id, partner_name',
                filters: { 
                  game_id: game.id,
                  user_id: userId 
                },
                single: true
              });

              console.log(`🎯 DEBUG: Current user game_users record:`, currentUserGameResult.data);
              console.log(`🔍 DEBUG: Checking partner_id field:`, {
                hasPartnerName: !!currentUserGameResult.data?.partner_name,
                partnerName: currentUserGameResult.data?.partner_name,
                hasPartnerId: !!currentUserGameResult.data?.partner_id,
                partnerId: currentUserGameResult.data?.partner_id,
                fullRecord: currentUserGameResult.data
              });

              if (currentUserGameResult.data?.partner_id) {
                console.log(`🔍 DEBUG: Found partner_id: ${currentUserGameResult.data.partner_id}, querying double_partners table...`);
                
                // Get partner details from double_partners table
                const partnerResult = await supabaseClient.query('double_partners', {
                  select: 'id, partner_name, avatar_url',
                  filters: { id: currentUserGameResult.data.partner_id },
                  single: true
                });

                console.log(`📊 DEBUG: Partner query result:`, partnerResult);

                if (partnerResult.data) {
                  partnerInfo = {
                    id: partnerResult.data.id,
                    name: partnerResult.data.partner_name,
                    avatar_url: partnerResult.data.avatar_url
                  };
                  console.log(`✅ DEBUG: Successfully found partner info for game ${game.id}:`, {
                    partnerId: partnerInfo.id,
                    partnerName: partnerInfo.name,
                    hasAvatar: !!partnerInfo.avatar_url,
                    avatarUrl: partnerInfo.avatar_url
                  });
                } else {
                  console.log(`❌ DEBUG: Partner not found in double_partners table for partner_id: ${currentUserGameResult.data.partner_id}`);
                }
              } else if (currentUserGameResult.data?.partner_name) {
                console.log(`🔍 DEBUG: No partner_id but found partner_name: ${currentUserGameResult.data.partner_name}, trying to find by name...`);
                
                // Fallback: Try to find partner by name for legacy games
                const currentUser = await authService.getCurrentUser();
                if (currentUser?.id) {
                  const partnerByNameResult = await supabaseClient.query('double_partners', {
                    select: 'id, partner_name, avatar_url',
                    filters: { 
                      user_id: currentUser.id,
                      partner_name: currentUserGameResult.data.partner_name 
                    },
                    single: true
                  });

                  console.log(`📊 DEBUG: Partner by name query result:`, partnerByNameResult);

                  if (partnerByNameResult.data) {
                    partnerInfo = {
                      id: partnerByNameResult.data.id,
                      name: partnerByNameResult.data.partner_name,
                      avatar_url: partnerByNameResult.data.avatar_url
                    };
                    console.log(`✅ DEBUG: Found partner by name for game ${game.id}:`, {
                      partnerId: partnerInfo.id,
                      partnerName: partnerInfo.name,
                      hasAvatar: !!partnerInfo.avatar_url,
                      avatarUrl: partnerInfo.avatar_url
                    });
                  } else {
                    console.log(`❌ DEBUG: Partner not found by name: ${currentUserGameResult.data.partner_name}`);
                  }
                }
              } else {
                console.log(`⚠️ DEBUG: No partner_id or partner_name found for user ${userId} in game ${game.id}. Game_users data:`, currentUserGameResult.data);
              }
            } catch (error) {
              console.error(`💥 ERROR getting partner info for game ${game.id}:`, error);
            }
          }

          // Get complete game details (including creator_partner) using existing method
          const gameWithDetails = await this.getGameWithDetails(game.id);

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
            original_game: gameWithDetails || game,
            creator: { 
              full_name: opponentInfo.name,
              avatar_url: opponentInfo.imageUrl,
              first_name: opponentInfo.name.split(' ')[0],
              last_name: opponentInfo.name.split(' ')[1] || '',
              id: opponentIds[0] || '',
              email: '',
              pickleball_level: 'beginner',
              created_at: '',
              updated_at: ''
            } as Profile,
            partner: partnerInfo
          };
          return userGame;
        })
      );

      console.log(`🏁 DEBUG: Final games for user ${userId}:`, gamesWithOpponents.filter(g => g !== null).map(g => ({ id: g!.id, opponentName: g!.creator?.full_name, type: g!.game_type })));

      return gamesWithOpponents.filter(game => game !== null) as UserGame[];
    } catch (error) {
      console.error('Error fetching user games:', error);
      throw error;
    }
  }

  async getUserJoinedGames(userId: string): Promise<Game[]> {
    try {
      // Get games where user is a participant (regardless of creator status)
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
        const allJoinedGames = gameResults
          .filter(result => !result.error && result.data)
          .map(result => result.data)
          .flat();

        // Filter out cancelled games in JavaScript
        joinedGames = allJoinedGames.filter((game: Game) => game.status !== 'cancelled');

        // Don't filter by creator_id - if user is in game_users, they accepted/joined the game
        // This includes cases where they are creator AND participant (like doubles games)
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
      // Get game details before cancellation for notifications
      const gameDetails = await this.getGameWithDetails(scheduleId);
      if (!gameDetails) {
        return { success: false, error: 'Game not found' };
      }

      // Verify user is the creator
      if (gameDetails.creator_id !== userId) {
        return { success: false, error: 'Only the creator can cancel this game' };
      }

      // Get user profile for notification
      const userProfile = await supabaseClient.query('profiles', {
        select: '*',
        filters: { id: userId },
        single: true
      });

      const userName = userProfile.data?.full_name || 
                      `${userProfile.data?.first_name || ''} ${userProfile.data?.last_name || ''}`.trim() || 
                      'Someone';

      // Update game status to 'cancelled' instead of deleting
      const { error: updateError } = await supabaseClient
        .from(this.tableName)
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (updateError) {
        console.error('Error cancelling schedule:', updateError);
        return { success: false, error: updateError.message || 'Failed to cancel schedule' };
      }

      // Send cancellation notification to all participants (except creator)
      if (gameDetails.players && gameDetails.players.length > 1) {
        const participantIds = gameDetails.players
          .filter(player => player.user_id !== userId)
          .map(player => player.user_id);

        // Send notification to each participant
        for (const participantId of participantIds) {
          try {
            await notificationService.scheduleGameCancelledNotification(
              scheduleId,
              userName,
              gameDetails.game_type,
              gameDetails.scheduled_date,
              gameDetails.scheduled_time
            );
          } catch (notificationError) {
            console.error('Error sending cancellation notification:', notificationError);
            // Continue with other notifications even if one fails
          }
        }
      }

      // Cancel any scheduled notifications for this game
      try {
        await notificationService.cancelGameNotifications(scheduleId);
      } catch (notificationError) {
        console.error('Error cancelling notifications:', notificationError);
        // Don't fail the operation for notification errors
      }

      return { success: true };
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  async getAvailableGames(excludeUserId: string): Promise<GameWithPlayers[]> {
    try {
      // Clean up expired games before fetching available games
      await this.cleanupExpiredGames();

      // Get all open games (open status already excludes cancelled games)
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
      
      // Get games where user is already a participant
      const participantGamesResult = await supabaseClient.query(this.gameUsersTable, {
        select: 'game_id',
        filters: { user_id: excludeUserId }
      });

      const participantGameIds = participantGamesResult.data 
        ? participantGamesResult.data.map((p: any) => p.game_id)
        : [];

      // Filter out games created by current user AND games where user is already a participant
      const availableGames = games.filter((game: Game) => 
        game.creator_id !== excludeUserId && 
        !participantGameIds.includes(game.id)
      );

      return availableGames;
    } catch (error) {
      console.error('Error fetching available games:', error);
      throw error;
    }
  }

  async updateGameUserPartner(gameId: string, userId: string, partnerId: string, partnerName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Updating game_users record with partner info:', {
        gameId,
        userId,
        partnerId,
        partnerName
      });

      // First, get the record to update (we need to handle composite filters manually)
      const existingRecordResult = await supabaseClient.query(this.gameUsersTable, {
        select: '*',
        filters: { 
          game_id: gameId,
          user_id: userId 
        },
        single: true
      });

      if (existingRecordResult.error || !existingRecordResult.data) {
        console.error('Error finding game_users record:', existingRecordResult.error);
        return { success: false, error: 'Game user record not found' };
      }

      // Update the record using the ID (since our custom client doesn't support composite filters for updates)
      const updateResult = await supabaseClient.from(this.gameUsersTable)
        .update({
          partner_id: partnerId,
          partner_name: partnerName
        })
        .eq('id', existingRecordResult.data.id);

      if (updateResult.error) {
        console.error('Error updating game_users with partner info:', updateResult.error);
        return { success: false, error: updateResult.error.message || 'Failed to update partner information' };
      }

      console.log('✅ Successfully updated game_users record with partner info');
      return { success: true };
    } catch (error) {
      console.error('Error updating game user partner:', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return { success: false, error: message };
    }
  }

  async joinGame(gameId: string, userId: string, partnerId?: string, partnerName?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if user is already in the game
      const existingUser = await supabaseClient.query(this.gameUsersTable, {
        select: '*',
        filters: { game_id: gameId, user_id: userId },
        single: true
      });

      if (existingUser.data) {
        return { success: false, error: 'You are already in this game' };
      }

      // Check if game exists and get details
      const gameDetails = await this.getGameWithDetails(gameId);
      if (!gameDetails) {
        return { success: false, error: 'Game not found' };
      }

      // Check if game is available for joining
      if (gameDetails.status !== 'open') {
        return { success: false, error: 'Game is no longer available for joining' };
      }

      // Check if game has space
      if (gameDetails.current_players >= gameDetails.max_players) {
        return { success: false, error: 'Game is full' };
      }

      // For doubles games, validate partner information
      if (gameDetails.game_type === 'doubles' && (!partnerId || !partnerName)) {
        return { success: false, error: 'Partner information is required for doubles games' };
      }

      // Add user to game with partner info
      const gameUserData: any = {
        game_id: gameId,
        user_id: userId,
        role: 'player',
        status: 'confirmed'
      };

      // Add partner info for doubles games
      if (gameDetails.game_type === 'doubles' && partnerId && partnerName) {
        gameUserData.partner_id = partnerId;
        gameUserData.partner_name = partnerName;
      }

      const { error } = await supabaseClient.from(this.gameUsersTable).insert(gameUserData);

      if (error) {
        console.error('Error joining game:', error);
        return { success: false, error: error.message || 'Failed to join game' };
      }

      // Update current_players count
      // Note: We'd need to implement an RPC function for this in Supabase
      // For now, we'll do it manually by getting the game, incrementing, and updating
      const gameResult = await supabaseClient.query(this.tableName, {
        select: 'current_players',
        filters: { id: gameId },
        single: true
      });

      if (gameResult.data) {
        const newCount = (gameResult.data.current_players || 0) + 1;
        await supabaseClient.from(this.tableName).update({ current_players: newCount }).eq('id', gameId);
      }

      // Send notification to game creator
      if (gameDetails.creator_id !== userId) {
        try {
          // Get user profile for notification
          const userProfile = await supabaseClient.query('profiles', {
            select: '*',
            filters: { id: userId },
            single: true
          });

          const userName = userProfile.data?.full_name || 
                          `${userProfile.data?.first_name || ''} ${userProfile.data?.last_name || ''}`.trim() || 
                          'Someone';

          await notificationService.scheduleGameAcceptedNotification(
            gameId,
            userName,
            gameDetails.game_type,
            gameDetails.scheduled_date,
            gameDetails.scheduled_time
          );
        } catch (notificationError) {
          console.error('Error sending game accepted notification:', notificationError);
          // Don't fail the join operation if notification fails
        }
      }

      // Schedule "game starting soon" notification for the user who joined
      try {
        const opponentName = gameDetails.creator?.full_name || 
                            `${gameDetails.creator?.first_name || ''} ${gameDetails.creator?.last_name || ''}`.trim() || 
                            'Your opponent';

        await notificationService.scheduleGameStartingSoonNotification(
          gameId,
          opponentName,
          gameDetails.game_type,
          gameDetails.venue_name,
          gameDetails.scheduled_date,
          gameDetails.scheduled_time
        );
      } catch (notificationError) {
        console.error('Error scheduling game starting soon notification:', notificationError);
        // Don't fail the join operation if notification fails
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
            
            // Get game details for retry
            const retryGameDetails = await this.getGameWithDetails(gameId);
            if (!retryGameDetails) {
              return { success: false, error: 'Game not found during retry' };
            }

            // Retry the entire operation with same data as original attempt
            const retryGameUserData: any = {
              game_id: gameId,
              user_id: userId,
              role: 'player',
              status: 'confirmed'
            };

            // Add partner info for doubles games in retry
            if (retryGameDetails.game_type === 'doubles' && partnerId && partnerName) {
              retryGameUserData.partner_id = partnerId;
              retryGameUserData.partner_name = partnerName;
            }

            const { error: retryError } = await supabaseClient.from(this.gameUsersTable).insert(retryGameUserData);
            
            if (retryError) {
              return { success: false, error: retryError.message || 'Failed to join game after refresh' };
            }
            
            // Update current_players count for retry
            const gameResult = await supabaseClient.query(this.tableName, {
              select: 'current_players',
              filters: { id: gameId },
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
      // Get game details for notification
      const gameDetails = await this.getGameWithDetails(gameId);
      if (!gameDetails) {
        return { success: false, error: 'Game not found' };
      }

      // Get user profile for notification
      const userProfile = await supabaseClient.query('profiles', {
        select: '*',
        filters: { id: userId },
        single: true
      });

      const userName = userProfile.data?.full_name || 
                      `${userProfile.data?.first_name || ''} ${userProfile.data?.last_name || ''}`.trim() || 
                      'Someone';

      // Remove user from game
      const { error } = await supabaseClient.from(this.gameUsersTable).delete().eq('game_id', gameId);

      if (error) {
        console.error('Error leaving game:', error);
        return { success: false, error: error.message || 'Failed to leave game' };
      }

      // Update current_players count
      const gameResult = await supabaseClient.query(this.tableName, {
        select: 'current_players',
        filters: { id: gameId },
        single: true
      });

      if (gameResult.data) {
        const newCount = Math.max((gameResult.data.current_players || 1) - 1, 0);
        await supabaseClient.from(this.tableName).update({ current_players: newCount }).eq('id', gameId);
      }

      // Send cancellation notification to other participants
      if (gameDetails.players) {
        const otherParticipants = gameDetails.players.filter(p => p.user_id !== userId);
        
        for (const participant of otherParticipants) {
          try {
            await notificationService.scheduleGameCancelledNotification(
              gameId,
              userName,
              gameDetails.game_type,
              gameDetails.scheduled_date,
              gameDetails.scheduled_time
            );
          } catch (notificationError) {
            console.error('Error sending game cancelled notification:', notificationError);
            // Don't fail the cancel operation if notification fails
          }
        }
      }

      // Cancel all scheduled notifications for this game
      try {
        await notificationService.cancelGameNotifications(gameId);
      } catch (notificationError) {
        console.error('Error cancelling game notifications:', notificationError);
        // Don't fail the cancel operation if notification cleanup fails
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

      // For doubles games, get creator's partner info if available
      let creatorPartner = undefined;
      if (game.game_type === 'doubles') {
        try {
          // Find creator's game_users record to get partner info
          const creatorPlayer = players.find((p: GameUser) => p.user_id === game.creator_id);
          if (creatorPlayer?.partner_id) {
            console.log(`🔍 Getting creator's partner info for game ${gameId}, partner_id: ${creatorPlayer.partner_id}`);
            
            // Get partner details from double_partners table
            const partnerResult = await supabaseClient.query('double_partners', {
              select: 'id, partner_name, avatar_url',
              filters: { id: creatorPlayer.partner_id },
              single: true
            });

            if (partnerResult.data) {
              creatorPartner = {
                id: partnerResult.data.id,
                name: partnerResult.data.partner_name,
                avatar_url: partnerResult.data.avatar_url
              };
              console.log(`✅ Found creator's partner for game ${gameId}:`, creatorPartner);
            } else {
              console.log(`❌ Creator's partner not found in double_partners table for partner_id: ${creatorPlayer.partner_id}`);
            }
          } else {
            console.log(`⚠️ No partner_id found for creator in game ${gameId}`);
          }
        } catch (error) {
          console.error(`❌ Error getting creator's partner info for game ${gameId}:`, error);
        }
      }

      return {
        ...game,
        creator: creatorResult.data,
        players: playerProfiles,
        creator_partner: creatorPartner
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
      // Clean up expired games before fetching available games
      await this.cleanupExpiredGames();
      
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