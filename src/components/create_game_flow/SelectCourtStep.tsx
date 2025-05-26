import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, X, MapPin, ChevronRight } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { Court } from '../../services/gameService';
import { globalTextStyles } from '../../styles/globalStyles';

interface SelectCourtStepProps {
  courts: Court[];
  isLoading: boolean;
  onClose: () => void;
  onBack: () => void;
  onSelectCourt: (courtId: string) => void;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_AVATAR = 20;
const ICON_SIZE_CHEVRON = 18;
const ICON_COLOR_DARK = '#333';
const ICON_COLOR_MEDIUM = '#888';
const STROKE_WIDTH_STANDARD = 1.8;

const SelectCourtStep: React.FC<SelectCourtStepProps> = ({
  courts,
  isLoading,
  onClose,
  onBack,
  onSelectCourt,
}) => {
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading Courts...</Text>
      </View>
    );
  }

  if (courts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.noCourtsText}>No courts available at the moment.</Text>
        <TouchableOpacity onPress={onBack} style={styles.backButtonOnError}>
            <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

      <Text style={styles.mainTitle}>Select Your Court</Text>

      <ScrollView style={styles.listContainer}>
        {courts.map((court) => (
          <ListItem
            key={court.id}
            avatarIcon={<MapPin size={ICON_SIZE_AVATAR} color={ICON_COLOR_DARK} />}
            title={court.name}
            description={court.distance}
            onPress={() => onSelectCourt(court.id)}
            rightElement={<ChevronRight size={ICON_SIZE_CHEVRON} color={ICON_COLOR_MEDIUM} />}
            style={styles.listItem}
          />
        ))}
      </ScrollView>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: ICON_COLOR_MEDIUM,
  },
  noCourtsText: {
    fontSize: 18,
    color: ICON_COLOR_DARK,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButtonOnError: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: ICON_COLOR_DARK,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    marginBottom: 12,
  },
});

export default SelectCourtStep; 