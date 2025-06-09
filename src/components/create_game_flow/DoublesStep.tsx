import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, StatusBar, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, UserPlus, User } from 'lucide-react-native';
import TopBar from '../ui/TopBar';
import { doublePartnersService, DoublePartner } from '../../services/doublePartnersService';
import ListItem from '../ui/ListItem';
import { authService } from '../../services/authService';

// Import colors
import { COLORS } from '../../constants/colors';

interface DoublesStepProps {
  onClose: () => void;
  onBack: () => void;
  onSelectPartner: (partner: { name: string; level: string; id?: string }) => void;
  onCreateNewPartner: () => void;
}

const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';

const DoublesStep: React.FC<DoublesStepProps> = ({ onClose, onBack, onSelectPartner, onCreateNewPartner }) => {
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
      setPartners([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSelect = (partner: DoublePartner) => {
    onSelectPartner({
      name: partner.partner_name,
      level: partner.partner_level || 'intermediate',
      id: partner.id,
    });
  };

  const renderPartnerItem = (partner: DoublePartner) => {
    const levelChip = partner.partner_level 
      ? partner.partner_level.charAt(0).toUpperCase() + partner.partner_level.slice(1)
      : 'Unknown';
    
    const chips = [levelChip];
    const chipBackgrounds = ['rgba(0, 0, 0, 0.07)'];

    const avatarIcon = partner.avatar_url ? (
      <Image 
        source={{ uri: partner.avatar_url }} 
        style={{ width: 40, height: 40, borderRadius: 20 }}
      />
    ) : (
      <User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />
    );

    return (
      <ListItem
        key={partner.id}
        avatarIcon={avatarIcon}
        title={partner.partner_name || 'Unnamed Partner'}
        chips={chips}
        chipBackgrounds={chipBackgrounds}
        onPress={() => handlePartnerSelect(partner)}
        style={styles.listItem}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title=""
        leftIcon={<X size={24} color="#000000" />}
        onLeftIconPress={onClose}
        style={styles.topBar}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Main title */}
        <Text style={styles.mainTitle}>Select Your Partner</Text>

        {/* Create new partner option */}
        <ListItem
          avatarIcon={<UserPlus size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
          title="Create a new partner"
          onPress={onCreateNewPartner}
          style={styles.createPartnerItem}
        />

        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading partners...</Text>
          </View>
        )}

        {/* Saved partners */}
        {!loading && partners.length > 0 && (
          <View style={styles.savedPartnersSection}>
            <Text style={styles.sectionTitle}>Your Partners</Text>
            {partners.map(renderPartnerItem)}
          </View>
        )}

        {/* Empty state when no partners */}
        {!loading && partners.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconContainer}>
              <User size={48} color="#CCC" />
            </View>
            <Text style={styles.emptyStateTitle}>No partners yet</Text>
            <Text style={styles.emptyStateDescription}>
              Create your first doubles partner to easily schedule games together.
            </Text>
          </View>
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  listItem: {
    marginBottom: 8,
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
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 40,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
});

export default DoublesStep; 