import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft, X, User, ChevronRight, Plus } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';

interface DoublesStepProps {
  onClose: () => void;
  onBack: () => void;
  onSelectPartner: (partnerName: string) => void;
  onCreateNewPartner: () => void;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 18;
const ICON_COLOR_DARK = '#333';
const ICON_COLOR_MEDIUM = '#888';
const ICON_COLOR_BLUE = '#007AFF';

// Dummy saved partners (in a real app, this would come from user's saved partners)
const savedPartners = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Mike Rodriguez' },
  { id: '3', name: 'Emma Wilson' },
];

const DoublesStep: React.FC<DoublesStepProps> = ({ onClose, onBack, onSelectPartner, onCreateNewPartner }) => {
  const handleSavedPartnerSelect = (partnerName: string) => {
    onSelectPartner(partnerName);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBarActions}>
        <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
          <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={styles.headerButtonRight}>
          <X size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
        </TouchableOpacity>
      </View>

      <Text style={styles.mainTitle}>Your Doubles Partner</Text>
      <Text style={styles.descriptionText}>
        Who will be playing with you? Create a new partner or select from your saved partners.
      </Text>

      {/* Create new partner option */}
      <View style={styles.createPartnerSection}>
        <ListItem
          avatarIcon={<Plus size={ICON_SIZE_AVATAR} color={ICON_COLOR_MEDIUM} />}
          title="Create a new partner"
          onPress={onCreateNewPartner}
          rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
          style={styles.createPartnerItem}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF2D6',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtonLeft: {
    padding: 8,
  },
  headerButtonRight: {
    padding: 8,
  },
  mainTitle: {
    ...globalTextStyles.h2,
    marginBottom: 30,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
  },
  createPartnerSection: {
    marginBottom: 30,
  },
  createPartnerItem: {
    marginBottom: 8,
  },
  savedPartnersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 12,
  },
});

export default DoublesStep; 