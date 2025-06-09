import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, X, MapPin, ChevronRight } from 'lucide-react-native';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';
import { Court } from '../../services/courtsService';

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
const ICON_COLOR_DARK = '#000000';
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
        {courts.map((court) => {
          // Use real payment status from database
          const paymentStatus = court.is_free ? 'Free' : 'Paid';
          
          const chips = [
            court.distance || 'Distance TBD', // Will be calculated later with geolocation
            paymentStatus,
            court.city
          ];
          
          const chipBackgrounds = [
            'rgba(0, 0, 0, 0.07)', // Distance chip
            'rgba(0, 0, 0, 0.07)', // Payment status chip
            'rgba(0, 0, 0, 0.07)', // City chip
          ];

          return (
            <ListItem
              key={court.id}
              title={court.name}
              chips={chips}
              chipBackgrounds={chipBackgrounds}
              avatarIcon={<MapPin size={ICON_SIZE_AVATAR} color="#000000" />}
              onPress={() => onSelectCourt(court.id)}
              style={styles.listItem}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
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
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  listContainer: {
    flex: 1,
    gap: 8,
  },
  listItem: {
    // Using gap: 12 from container for consistent spacing
  },
});

export default SelectCourtStep; 