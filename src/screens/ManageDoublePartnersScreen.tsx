import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, User, ChevronRight } from 'lucide-react-native';

// Import custom components
import TopBar from '../components/ui/TopBar';
import ListItem from '../components/ui/ListItem';

// Import colors
import { COLORS } from '../constants/colors';

interface ManageDoublePartnersScreenProps {
  onBack: () => void;
  onCreateNewPartner: () => void;
  onSelectPartner: (partnerName: string) => void;
}

const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 18;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';

// Dummy saved partners (in a real app, this would come from user's saved partners)
const savedPartners = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Mike Rodriguez' },
  { id: '3', name: 'Emma Wilson' },
];

const ManageDoublePartnersScreen: React.FC<ManageDoublePartnersScreenProps> = ({ 
  onBack, 
  onCreateNewPartner, 
  onSelectPartner 
}) => {
  const handleSavedPartnerSelect = (partnerName: string) => {
    onSelectPartner(partnerName);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <StatusBar barStyle="dark-content" />
      
      <TopBar
        title="Your doubles partners"
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Create new partner option */}
        <View style={styles.createPartnerSection}>
          <ListItem
            avatarIcon={<Plus size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
            title="Create a new partner"
            onPress={onCreateNewPartner}
            rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
            style={styles.listItem}
          />
        </View>

        {/* Saved partners section */}
        {savedPartners.length > 0 && (
          <View style={styles.savedPartnersSection}>
            <Text style={styles.sectionTitle}>Saved Partners</Text>
            {savedPartners.map((partner) => (
              <ListItem
                key={partner.id}
                avatarIcon={<User size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
                title={partner.name}
                onPress={() => handleSavedPartnerSelect(partner.name)}
                rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
                style={styles.listItem}
              />
            ))}
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
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  createPartnerSection: {
    marginBottom: 30,
  },
  savedPartnersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#000000',
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 12,
    minHeight: 60,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ManageDoublePartnersScreen; 