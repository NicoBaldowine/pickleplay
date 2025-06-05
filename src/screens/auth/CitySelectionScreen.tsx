import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { ArrowLeft, MapPin, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';

// Import colors and components
import { COLORS } from '../../constants/colors';
import { globalTextStyles } from '../../styles/globalStyles';
import ListItem from '../../components/ui/ListItem';
import TopBar from '../../components/ui/TopBar';

interface CitySelectionScreenProps {
  onBack: () => void;
  onCitySelected: (city: string) => void;
}

const SUPPORTED_CITIES = [
  { id: 'denver', name: 'Denver', supported: true },
  { id: 'aurora', name: 'Aurora', supported: true },
  { id: 'lakewood', name: 'Lakewood', supported: true },
  { id: 'boulder', name: 'Boulder', supported: true },
  { id: 'colorado-springs', name: 'Colorado Springs', supported: true },
];

const CitySelectionScreen: React.FC<CitySelectionScreenProps> = ({ onBack, onCitySelected }) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const handleCitySelect = (cityId: string) => {
    const city = SUPPORTED_CITIES.find(c => c.id === cityId);
    if (city?.supported) {
      onCitySelected(city.name);
    }
  };

  const handleAnotherCityPress = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Enter your city',
        'Please enter the name of your city:',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: (cityName) => {
              if (cityName && cityName.trim()) {
                onCitySelected(cityName.trim());
              }
            },
          },
        ],
        'plain-text'
      );
    } else {
      // For Android, you could use a different approach or Alert.alert
      Alert.alert('Enter City', 'Please use one of the available cities for now.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <TopBar
        title=""
        leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
        onLeftIconPress={onBack}
        style={styles.topBar}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Select your city</Text>

        {/* City List */}
        <View style={styles.cityList}>
          {SUPPORTED_CITIES.map((city) => (
            <ListItem
              key={city.id}
              title={city.name}
              avatarIcon={<MapPin size={20} color={COLORS.TEXT_PRIMARY} />}
              onPress={() => handleCitySelect(city.id)}
              style={styles.listItem}
            />
          ))}
          
          {/* Another city option */}
          <ListItem
            title="Another city"
            avatarIcon={<MapPin size={20} color={COLORS.TEXT_SECONDARY} />}
            rightElement={<ChevronRight size={16} color={COLORS.TEXT_SECONDARY} />}
            onPress={handleAnotherCityPress}
            style={styles.listItem}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBar: {
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 24,
  },
  cityList: {
    gap: 8,
  },
  listItem: {
    marginBottom: 8,
    height: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CitySelectionScreen; 