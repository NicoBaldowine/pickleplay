import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, User } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import services and types
import { doublePartnersService, DoublePartner } from '../services/doublePartnersService';
import { authService } from '../services/authService';
import { COLORS } from '../constants/colors';
import { GameWithPlayers } from '../services/gameService';

interface FindDoublesProps {
  game: GameWithPlayers;
  user: any;
  profile: any;
  onBack: () => void;
  onPartnerSelected: (partner: DoublePartner) => void;
}

const FindDoubles: React.FC<FindDoublesProps> = ({ game, user, profile, onBack, onPartnerSelected }) => {
  const [partners, setPartners] = useState<DoublePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      if (currentUser?.id) {
        const userPartners = await doublePartnersService.getPartners(currentUser.id);
        setPartners(userPartners);
      }
    } catch (error) {
      console.error('Error loading partners:', error);
      Alert.alert('Error', 'Failed to load your double partners');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSelect = (partner: DoublePartner) => {
    console.log('🎯 FindDoubles - Partner selected:', {
      partner: partner,
      partnerName: partner?.partner_name,
      partnerId: partner?.id,
      partnerType: typeof partner
    });

    // Navigate directly to FindReview with the selected partner
    (navigation as any).navigate('FindReview', { 
      game,
      user,
      profile,
      selectedPartner: partner,
      onAcceptGame: (gameId: string, phoneNumber: string, notes?: string, partnerId?: string, partnerName?: string) => {
        // This will be handled by the main navigation flow
        // For now, just navigate back to games
        (navigation as any).navigate('TabNavigator', { screen: 'Games' });
      }
    });
  };

  const handleCreatePartner = () => {
    // Navigate to CreatePartnerScreen
    (navigation as any).navigate('CreatePartner', {
      // Pass a callback to refresh partners when a new one is created
      onPartnerCreated: () => {
        loadPartners(); // Refresh the partners list
      }
    });
  };

  const renderPartnerItem = (partner: DoublePartner) => {
    const levelChip = partner.partner_level || 'Unknown';
    
    const chips = [levelChip];
    const chipBackgrounds = ['rgba(0, 0, 0, 0.07)'];

    const avatarIcon = partner.avatar_url ? (
      <Image 
        source={{ uri: partner.avatar_url }} 
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
    ) : (
      <User size={20} color="#555" />
    );

    return (
      <ListItem
        key={partner.id}
        title={partner.partner_name || 'Unnamed Partner'}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        onPress={() => handlePartnerSelect(partner)}
        style={styles.partnerItem}
      />
    );
  };

  const renderCreatePartnerButton = () => (
    <ListItem
      avatarIcon={<Plus size={20} color="#000000" />}
      title="Create a new partner"
      onPress={handleCreatePartner}
      style={styles.createPartnerItem}
    />
  );

  const renderSavedPartners = () => {
    if (partners.length === 0) {
      return null;
    }

    return (
      <View style={styles.savedPartnersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Partners</Text>
        </View>
        {partners.map(renderPartnerItem)}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (partners.length > 0) {
      return null;
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconContainer}>
          <User size={48} color="#CCC" />
        </View>
        <Text style={styles.emptyStateTitle}>No double partners yet</Text>
        <Text style={styles.emptyStateDescription}>
          Create your first doubles partner to start playing games together.
        </Text>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#000000" />
      <Text style={styles.loadingText}>Loading partners...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Select Your Partner"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {renderCreatePartnerButton()}
        
        {loading ? (
          renderLoadingState()
        ) : (
          <>
            {renderSavedPartners()}
            {renderEmptyState()}
          </>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  createPartnerItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  savedPartnersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  partnerItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minHeight: 60,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#888',
    marginTop: 12,
  },
});

export default FindDoubles; 