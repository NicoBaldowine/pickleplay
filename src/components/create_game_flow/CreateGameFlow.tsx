import React, { useState, useEffect } from 'react';
import { View, Alert, ActivityIndicator, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gameService } from '../../services/gameService';
import { authService } from '../../services/authService';
import { courtsService, Court } from '../../services/courtsService';
import TypeOfGameStep from './TypeOfGameStep';
import DoublesStep from './DoublesStep';
import CreatePartnerStep from './CreatePartnerStep';
import SelectCourtStep from './SelectCourtStep';
import OpponentLevelStep from './OpponentLevelStep';
import ScheduleStep from './ScheduleStep';
import ReviewStep from './ReviewStep';

// Import colors
import { COLORS } from '../../constants/colors';

// Define types for the create game flow
export type GameType = 'singles' | 'doubles';
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export interface CreateGameData {
    game_type: GameType;
    court_id: string;
    player_level: PlayerLevel;
    scheduled_time: string;
    partner_name?: string;
    partner_id?: string;
    notes?: string;
    status?: string;
}

interface CreateGameFlowProps {
  onClose: () => void;
  onGameCreated: (gameId: string) => void;
}

const CreateGameFlow: React.FC<CreateGameFlowProps> = ({ onClose, onGameCreated }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false); 
  const [isFetchingCourts, setIsFetchingCourts] = useState(false); 
  const [courts, setCourts] = useState<Court[]>([]); // Will use dummy data or be empty for now
  const [isCreatingNewPartner, setIsCreatingNewPartner] = useState(false); // Track if we're in create partner flow
  const [gameData, setGameData] = useState<Partial<CreateGameData>>({
    game_type: undefined,
    court_id: undefined,
    player_level: undefined,
    scheduled_time: undefined,
    partner_name: undefined,
    partner_id: undefined,
    notes: undefined,
  });

  useEffect(() => {
    // Load courts from Supabase
    loadCourts();
  }, []);

  const loadCourts = async () => {
    try {
      setIsFetchingCourts(true);
      const courtsData = await courtsService.getCourtsByCity('Denver');
      setCourts(courtsData);
    } catch (error) {
      console.error('Error loading courts:', error);
      Alert.alert('Error', 'Failed to load courts. Please try again.');
      setCourts([]); // Set empty array on error
    } finally {
      setIsFetchingCourts(false);
    }
  };

  const handleNextStep = () => {
    console.log('🔄 Moving to next step from:', step);
    setStep(prev => prev + 1);
  };
  const handlePrevStep = () => {
    console.log('🔄 Moving to previous step from:', step);
    setStep(prev => prev - 1);
  };

  const updateGameData = (data: Partial<CreateGameData>) => {
    console.log('📝 Updating game data:', data);
    setGameData(prev => ({ ...prev, ...data }));
  };

  const handleTypeSelect = (type: GameType) => {
    console.log('🎮 Selected game type:', type);
    updateGameData({ game_type: type });
    handleNextStep();
  };

  const handleCreateNewPartner = () => {
    console.log('👥 Creating new partner');
    setIsCreatingNewPartner(true);
    handleNextStep();
  };

  const handlePartnerCreated = (partnerData: { name: string; lastname: string; level: string; id?: string }) => {
    const fullName = `${partnerData.name} ${partnerData.lastname}`;
    console.log('✅ Partner created:', fullName, 'ID:', partnerData.id);
    updateGameData({ 
      partner_name: fullName,
      partner_id: partnerData.id // Store newly created partner ID
      // Don't set player_level here - let OpponentLevelStep handle it
    });
    setIsCreatingNewPartner(false);
    handleNextStep();
  };

  const handlePartnerSelect = (partner: { name: string; level: string; id?: string }) => {
    console.log('👥 Partner selected:', partner.name, 'ID:', partner.id);
    updateGameData({ 
      partner_name: partner.name,
      partner_id: partner.id // Store partner ID for database operations
      // Don't set player_level here - let OpponentLevelStep handle it
    });
    setIsCreatingNewPartner(false);
    handleNextStep();
  };

  const handleLevelSelect = (level: PlayerLevel) => {
    console.log('🎯 Level selected:', level);
    updateGameData({ player_level: level });
    // Reset the creating partner flag when level is selected
    setIsCreatingNewPartner(false);
    handleNextStep();
  };

  const handleCourtSelect = (courtId: string) => {
    console.log('🏟️ Court selected:', courtId);
    updateGameData({ court_id: courtId });
    handleNextStep();
  };

  const handleScheduleSelect = (dateTimeIso: string) => {
    console.log('📅 Schedule selected:', dateTimeIso);
    console.log('📅 Current gameData:', gameData);
    
    // Ensure player_level is set before proceeding to review
    if (!gameData.player_level) {
      console.error('❌ No player_level set when trying to schedule!');
      Alert.alert('Missing Information', 'Please select a skill level for the game.');
      return;
    }
    
    updateGameData({ scheduled_time: dateTimeIso });
    handleNextStep(); // Go to ReviewStep instead of creating game immediately
  };

  const handleScheduleGame = async (notes: string, phoneNumber: string) => {
    setIsLoading(true);

    try {
      // Debug logging
      console.log('🎯 Creating game with data:', gameData);
      console.log('🎯 Player level:', gameData.player_level);

      // Validate that player_level is set
      if (!gameData.player_level) {
        Alert.alert('Missing Information', 'Please select a skill level for the game.');
        setIsLoading(false);
        return;
      }

      // Get current user and profile 
      const currentUser = await authService.getCurrentUser();
      const currentProfile = await authService.getProfile(currentUser?.id || '');

      if (!currentUser || !currentProfile) {
        Alert.alert('Error', 'Please log in to create a game.');
        setIsLoading(false);
        return;
      }

      // Convert scheduled_time to Date object and extract date/time parts
      const gameDateTime = new Date(gameData.scheduled_time!);
      const gameDate = gameDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
      const gameTime = gameDateTime.toTimeString().slice(0, 5); // HH:MM

      // Get court name for location
      const selectedCourt = courts.find(court => court.id === gameData.court_id);

      // Create the game
      const result = await gameService.createGame({
        creator_id: currentUser.id,
        game_type: gameData.game_type!,
        skill_level: gameData.player_level!,
        venue_name: selectedCourt?.name || 'Unknown Court',
        venue_address: selectedCourt?.address || 'Address TBD',
        city: 'Denver', // Extract city from address in real app
        scheduled_date: gameDate,
        scheduled_time: gameTime,
        notes: gameData.game_type === 'doubles' && gameData.partner_name 
          ? `${notes || ''} with partner: ${gameData.partner_name}.`.trim()
          : notes || undefined
      });
      
      if (result.success && result.gameId) {
        // If it's a doubles game and we have a partner, add them to the game
        if (gameData.game_type === 'doubles' && gameData.partner_name) {
          // TODO: In a real app, we'd need to find the partner's user ID
          // For now, we'll just note it in the game notes
          console.log('Partner specified:', gameData.partner_name);
        }
        
        Alert.alert('Game Scheduled!', `Your ${gameData.game_type} game has been scheduled successfully.`);
        onGameCreated(result.gameId);
      } else {
        // Check if the error is about session expiration
        if (result.error?.includes('Session expired') || result.error?.includes('JWT expired')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again to continue.',
            [
              { text: 'OK', onPress: () => {
                // You might want to navigate to login screen here
                onClose();
              }}
            ]
          );
        } else {
          Alert.alert('Creation Failed', result.error || 'Could not create game. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('Error creating game in flow:', error);
      
      // Check for JWT expired in catch block too
      if (error.message?.includes('JWT expired') || error.message?.includes('Session expired')) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please log in again to continue.',
          [
            { text: 'OK', onPress: () => {
              onClose();
            }}
          ]
        );
      } else {
        Alert.alert('Creation Failed', error.message || 'Could not create game. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingCourts && step === 5 && courts.length === 0) { 
    return <View style={styles.centered}><ActivityIndicator size="large" /><Text>Loading courts...</Text></View>;
  }

  const renderStep = () => {
    console.log(`🚀 Rendering step ${step} - gameType: ${gameData.game_type}, isCreatingNewPartner: ${isCreatingNewPartner}, player_level: ${gameData.player_level}`);
    
    switch (step) {
      case 1:
        // Type selection (Singles or Doubles)
        return (
          <TypeOfGameStep
            onClose={onClose}
            onSelectType={handleTypeSelect}
          />
        );
      case 2:
        // Doubles: Partner selection, Singles: Level selection
        if (gameData.game_type === 'doubles') {
          return (
            <DoublesStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectPartner={handlePartnerSelect}
              onCreateNewPartner={handleCreateNewPartner}
            />
          );
        } else {
          return (
            <OpponentLevelStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectLevel={handleLevelSelect} 
            />
          );
        }
      case 3:
        // Doubles: Create partner if needed, Singles: Court selection
        if (gameData.game_type === 'doubles' && isCreatingNewPartner) {
          return (
            <CreatePartnerStep
              onClose={onClose}
              onBack={handlePrevStep}
              onCreatePartner={handlePartnerCreated}
            />
          );
        } else if (gameData.game_type === 'doubles') {
          // Already have partner, now select level
          return (
            <OpponentLevelStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectLevel={handleLevelSelect} 
            />
          );
        } else {
          // Singles: Court selection
          return (
            <SelectCourtStep
              courts={courts}
              isLoading={isFetchingCourts} 
              onClose={onClose}
              onBack={handlePrevStep}
              onSelectCourt={handleCourtSelect}
            />
          );
        }
      case 4:
        // Doubles: Level or Court selection, Singles: Schedule
        if (gameData.game_type === 'doubles') {
          if (!gameData.player_level) {
            // Need to select level (from CreatePartnerStep)
            return (
              <OpponentLevelStep
                onClose={onClose}
                onBack={handlePrevStep}
                onSelectLevel={handleLevelSelect} 
              />
            );
          } else {
            // Have level, now select court
            return (
              <SelectCourtStep
                courts={courts}
                isLoading={isFetchingCourts} 
                onClose={onClose}
                onBack={handlePrevStep}
                onSelectCourt={handleCourtSelect}
              />
            );
          }
        } else {
          // Singles: Schedule
          return (
            <ScheduleStep
              onClose={onClose}
              onBack={handlePrevStep}
              onSchedule={handleScheduleSelect} 
              isSubmitting={false} 
            />
          );
        }
      case 5:
        // Doubles: Court or Schedule, Singles: Review
        if (gameData.game_type === 'doubles') {
          if (!gameData.court_id) {
            // Need to select court
            return (
              <SelectCourtStep
                courts={courts}
                isLoading={isFetchingCourts} 
                onClose={onClose}
                onBack={handlePrevStep}
                onSelectCourt={handleCourtSelect}
              />
            );
          } else {
            // Have court, now schedule
            return (
              <ScheduleStep
                onClose={onClose}
                onBack={handlePrevStep}
                onSchedule={handleScheduleSelect} 
                isSubmitting={false} 
              />
            );
          }
        } else {
          // Singles: Review
          return (
            <ReviewStep
              onClose={onClose}
              onBack={handlePrevStep}
              onScheduleGame={handleScheduleGame}
              isSubmitting={isLoading}
              gameData={gameData}
              courts={courts}
            />
          );
        }
      case 6:
        // Doubles: Schedule or Review
        if (gameData.game_type === 'doubles') {
          if (!gameData.scheduled_time) {
            // Need to schedule
            return (
              <ScheduleStep
                onClose={onClose}
                onBack={handlePrevStep}
                onSchedule={handleScheduleSelect} 
                isSubmitting={false} 
              />
            );
          } else {
            // Have everything, review
            return (
              <ReviewStep
                onClose={onClose}
                onBack={handlePrevStep}
                onScheduleGame={handleScheduleGame}
                isSubmitting={isLoading}
                gameData={gameData}
                courts={courts}
              />
            );
          }
        }
        return null;
      case 7:
        // Doubles: Final Review
        if (gameData.game_type === 'doubles') {
          return (
            <ReviewStep
              onClose={onClose}
              onBack={handlePrevStep}
              onScheduleGame={handleScheduleGame}
              isSubmitting={isLoading}
              gameData={gameData}
              courts={courts}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" />
      {renderStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateGameFlow; 