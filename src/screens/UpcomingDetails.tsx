import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Clock, MapPin, Zap, FileText } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

// Import game service and types
import { UserGame, gameService } from '../services/gameService';
import { authService } from '../services/authService';
import { supabaseClient } from '../lib/supabase';

interface UpcomingDetailsProps {
  game: UserGame;
  onBack: () => void;
  onCancelGame: (gameId: string) => void;
}

const UpcomingDetails: React.FC<UpcomingDetailsProps> = ({ game, onBack, onCancelGame }) => {
  const [userPartnerName, setUserPartnerName] = useState<string | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);

  const formattedDateTime = gameService.formatGameDateTime(game.date, game.time);

  // Load user's partner info for doubles games
  useEffect(() => {
    if (game.game_type === 'doubles') {
      loadUserPartner();
    }
  }, [game.game_type, game.id]);

  const loadUserPartner = async () => {
    try {
      setLoadingPartner(true);
      
      // Get current user
      const currentUser = await authService.getCurrentUser();
      if (!currentUser?.id) {
        console.log('No current user found');
        return;
      }

      // Query game_users table to find current user's record for this game
      const gameUserResult = await supabaseClient.query('game_users', {
        select: 'partner_name, partner_id',
        filters: { 
          game_id: game.id,
          user_id: currentUser.id 
        },
        single: true
      });

      if (gameUserResult.error) {
        console.log('Error fetching user partner info:', gameUserResult.error);
        return;
      }

      if (gameUserResult.data?.partner_name) {
        setUserPartnerName(gameUserResult.data.partner_name);
        console.log('✅ Found user partner:', gameUserResult.data.partner_name);
      } else {
        console.log('No partner info found for user in this game');
      }

    } catch (error) {
      console.error('Error loading user partner:', error);
    } finally {
      setLoadingPartner(false);
    }
  };

  // Placeholder images for profile pictures (fallback)
  const playerImages = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  ];

  const handleCancelGame = () => {
    Alert.alert(
      'Cancel Game',
      `Are you sure you want to cancel this game? The other players will be notified about the cancellation.`,
      [
        {
          text: 'Keep Game',
          style: 'cancel',
        },
        {
          text: 'Cancel Game',
          style: 'destructive',
          onPress: () => {
            onCancelGame(game.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get opponent information with correct avatar logic
  const getOpponentInfo = () => {
    if (game.creator) {
      const creatorName = game.creator.full_name || 
                         `${game.creator.first_name || ''} ${game.creator.last_name || ''}`.trim() || 
                         'Unknown Player';
      
      // For doubles games, use the same avatar logic as other screens
      let opponentImage = game.creator.avatar_url || playerImages[0];
      if (game.game_type === 'doubles') {
        // Type assertion to access creator_partner from original_game
        const originalGameWithDetails = game.original_game as any;
        if (originalGameWithDetails?.creator_partner?.avatar_url) {
          console.log(`🖼️ UpcomingDetails: Using creator partner avatar for doubles game ${game.id}:`, originalGameWithDetails.creator_partner.avatar_url);
          opponentImage = originalGameWithDetails.creator_partner.avatar_url;
        } else if (game.creator.avatar_url) {
          console.log(`👤 UpcomingDetails: Using creator avatar fallback for doubles game ${game.id}:`, game.creator.avatar_url);
          opponentImage = game.creator.avatar_url;
        } else {
          console.log(`⚠️ UpcomingDetails: No creator partner/creator avatar found for doubles game ${game.id}, using placeholder`);
          opponentImage = playerImages[0];
        }
      }
      
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
              name: `${creatorFirstName} & ${partnerFirstName}`,
              imageUrl: opponentImage
            };
          }
        }
        
        // Fallback for doubles without partner info
        return {
          name: `${creatorName} (need partner)`,
          imageUrl: opponentImage
        };
      }
      
      // For singles games, show creator name and avatar
      return {
        name: creatorName,
        imageUrl: opponentImage
      };
    }
    
    // Fallback
    return {
      name: 'Opponent',
      imageUrl: playerImages[0]
    };
  };

  const opponentInfo = getOpponentInfo();

  // Handle texting opponent
  const handleTextOpponent = () => {
    // For now, we'll show an alert since we don't have the opponent's phone number
    // In a real app, we'd need to store and retrieve the opponent's contact info
    Alert.alert(
      'Contact Information',
      `To contact ${opponentInfo.name}, please use the contact information they provided when creating the game.`,
      [{ text: 'OK' }]
    );
    
    // Future implementation when we have phone numbers:
    // const phoneNumber = opponent.phone_number;
    // if (phoneNumber) {
    //   const url = `sms:${phoneNumber}`;
    //   Linking.openURL(url).catch(err => {
    //     Alert.alert('Error', 'Unable to open messaging app');
    //   });
    // }
  };

  // Player profile picture with real opponent photo
  const playerAvatarIcon = (
    <View style={styles.playerPictureContainer}>
      <Image
        source={{ uri: opponentInfo.imageUrl }}
        style={styles.playerPicture}
      />
    </View>
  );

  // Player information and background color based on game type
  const getPlayerInfo = () => {
    if (game.game_type === 'singles') {
      return {
        title: opponentInfo.name, // Use real opponent name
        chip: 'Singles Game',
        backgroundColor: '#96BE6B' // Green for singles
      };
    } else {
      return {
        title: opponentInfo.name, // Use real opponent name
        chip: 'Doubles Game',
        backgroundColor: '#4DAAC2' // Blue for doubles
      };
    }
  };

  const playerInfo = getPlayerInfo();

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Upcoming Game"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        rightIcon={
          <Text style={styles.cancelText}>Cancel</Text>
        }
        onRightIconPress={handleCancelGame}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Opponent Section */}
        <ListItem
          title={playerInfo.title}
          chips={[playerInfo.chip]}
          chipBackgrounds={['rgba(255, 255, 255, 0.3)']}
          avatarIcon={playerAvatarIcon}
          style={{
            ...styles.listItem,
            backgroundColor: playerInfo.backgroundColor
          }}
        />

        {/* Date & Time Section */}
        <ListItem
          title="Date & Time"
          chips={[formattedDateTime]}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<Clock size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Location Section */}
        <ListItem
          title="Location"
          chips={[game.original_game?.venue_name || game.venue_name || 'TBD']}
          chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
          avatarIcon={<MapPin size={20} color="#000000" />}
          style={styles.listItem}
        />

        {/* Your Partner Section - Only for doubles games */}
        {game.game_type === 'doubles' && userPartnerName && (
          <ListItem
            title="Your Partner"
            chips={[userPartnerName]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            avatarIcon={<User size={20} color="#000000" />}
            style={styles.listItem}
          />
        )}

        {/* Notes Section - Only show if there are actual notes beyond partner info */}
        {game.original_game?.notes && (() => {
          let displayNotes = game.original_game.notes;
          
          // Remove partner info from notes if it exists
          if (displayNotes.includes('with partner:')) {
            displayNotes = displayNotes.replace(/with partner: [^.]+\.?\s*/g, '').trim();
          }
          
          // Only show if there are actual notes left
          if (displayNotes && displayNotes.length > 0) {
            return (
              <ListItem
                title="Game Notes"
                chips={[displayNotes]}
                chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
                avatarIcon={<FileText size={20} color="#000000" />}
                style={styles.listItem}
              />
            );
          }
          return null;
        })()}
      </ScrollView>

      {/* Text Player Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.textButton} onPress={handleTextOpponent}>
          <Text style={styles.textButtonText}>Text {opponentInfo.name}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleStyle: {
    fontSize: 20,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  listItem: {
    marginBottom: 12,
  },
  playerPictureContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  playerPicture: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  textButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default UpcomingDetails; 