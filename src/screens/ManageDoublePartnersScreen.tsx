import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, User } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import services and types
import { doublePartnersService, DoublePartner } from '../services/doublePartnersService';
import { authService } from '../services/authService';
import { COLORS } from '../constants/colors';

interface ManageDoublePartnersScreenProps {
  onBack: () => void;
  onNavigateToCreatePartner?: () => void;
  onNavigateToEditPartner?: (partner: DoublePartner) => void;
}

const ManageDoublePartnersScreen: React.FC<ManageDoublePartnersScreenProps> = ({ onBack, onNavigateToCreatePartner, onNavigateToEditPartner }) => {
  const [partners, setPartners] = useState<DoublePartner[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDeletePartner = (partner: DoublePartner) => {
    Alert.alert(
      'Remove Partner',
      `Are you sure you want to remove ${partner.partner_name} from your doubles partners?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await doublePartnersService.deletePartner(partner.id);
              if (result.success) {
                loadPartners(); // Reload the list
              } else {
                Alert.alert('Error', result.error || 'Failed to remove partner');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove partner');
            }
          },
        },
      ]
    );
  };

  const handleAddPartner = () => {
    onNavigateToCreatePartner?.();
  };

  const handlePartnerCreated = () => {
    loadPartners(); // Refresh the list when a partner is created
  };

  const handleEditPartner = (partner: DoublePartner) => {
    onNavigateToEditPartner?.(partner);
  };

  const renderPartnerItem = (partner: DoublePartner) => {
    const levelChip = partner.partner_level || 'Unknown';
    
    const chips = [levelChip];
    const chipBackgrounds = ['rgba(0, 0, 0, 0.07)'];

    const avatarIcon = (
      <User size={20} color="#555" />
    );

    return (
      <ListItem
        key={partner.id}
        title={partner.partner_name || 'Unnamed Partner'}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        avatarIcon={avatarIcon}
        onPress={() => handleEditPartner(partner)}
      />
    );
  };

  const renderAddPartnerButton = () => (
    <ListItem
      avatarIcon={<Plus size={20} color="#000000" />}
      title="Create a new partner"
      onPress={handleAddPartner}
      style={styles.createPartnerItem}
    />
  );

  const renderSavedPartners = () => {
    if (partners.length === 0) {
      return null;
    }

    return (
      <View style={styles.savedPartnersSection}>
        <Text style={styles.sectionTitle}>Saved Partners</Text>
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
          Add your regular doubles partners to easily schedule games together.
        </Text>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading partners...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Your Doubles Partner"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {renderAddPartnerButton()}
        
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-Bold',
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  savedPartnersSection: {
    marginBottom: 24,
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
    paddingTop: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
});

export default ManageDoublePartnersScreen; 