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
} from 'react-native';
import { ArrowLeft, MapPin, ChevronDown } from 'lucide-react-native';
import * as Location from 'expo-location';

// Import colors
import { COLORS } from '../../constants/colors';

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
  { id: 'other', name: 'Other City', supported: false },
];

const DENVER_AREA_CITIES = ['denver', 'boulder', 'aurora', 'lakewood', 'thornton', 'westminster', 'arvada', 'centennial', 'colorado springs', 'springs'];

const CitySelectionScreen: React.FC<CitySelectionScreenProps> = ({ onBack, onCitySelected }) => {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationDetected, setLocationDetected] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        await detectLocation();
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address?.city && address?.region) {
        const cityName = address.city.toLowerCase();
        const region = address.region.toLowerCase();
        
        // Check if they're in Denver area (Colorado)
        if (region.includes('colorado') || region.includes('co')) {
          if (DENVER_AREA_CITIES.some(denverCity => cityName.includes(denverCity))) {
            setLocationDetected('denver');
            setSelectedCity('denver');
            return;
          }
        }
        
        setLocationDetected('other');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
    }
  };

  const handleCitySelect = (cityId: string) => {
    const city = SUPPORTED_CITIES.find(c => c.id === cityId);
    
    if (city?.supported) {
      setSelectedCity(cityId);
    } else {
      // Show error for unsupported cities
      Alert.alert(
        'Coming Soon! 🚀',
        'PicklePlay is not available in your city yet, but we\'re expanding fast! We\'ll notify you as soon as we launch in your area.',
        [
          {
            text: 'Get Notified',
            onPress: () => {
              // TODO: Implement waitlist functionality
              console.log('Add to waitlist');
            },
          },
          {
            text: 'Choose Different City',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleContinue = () => {
    if (selectedCity) {
      const city = SUPPORTED_CITIES.find(c => c.id === selectedCity);
      if (city) {
        onCitySelected(city.name);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your City</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Title */}
        <Text style={styles.title}>Where do you want to play?</Text>
        
        {/* Location Detection */}
        {loading && (
          <View style={styles.locationSection}>
            <ActivityIndicator size="small" color={COLORS.TEXT_PRIMARY} />
            <Text style={styles.locationText}>Detecting your location...</Text>
          </View>
        )}

        {locationDetected === 'denver' && (
          <View style={styles.locationSection}>
            <MapPin size={16} color={COLORS.SUCCESS} />
            <Text style={styles.locationText}>Great! We detected you're in the Denver area</Text>
          </View>
        )}

        {/* City List */}
        <View style={styles.cityList}>
          {SUPPORTED_CITIES.filter(city => city.supported).map((city) => (
            <TouchableOpacity
              key={city.id}
              style={[
                styles.cityItem,
                selectedCity === city.id && styles.cityItemSelected
              ]}
              onPress={() => handleCitySelect(city.id)}
            >
              <Text style={[
                styles.cityText,
                selectedCity === city.id && styles.cityTextSelected
              ]}>
                {city.name}
              </Text>
              {selectedCity === city.id && (
                <View style={styles.checkmark} />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Other city option */}
          <TouchableOpacity
            style={styles.cityItem}
            onPress={() => handleCitySelect('other')}
          >
            <Text style={styles.cityText}>My city isn't listed</Text>
            <ChevronDown size={16} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Continue Button */}
      {selectedCity && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 32,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
  },
  cityList: {
    gap: 12,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cityItemSelected: {
    borderColor: COLORS.TEXT_PRIMARY,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  cityText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
  },
  cityTextSelected: {
    color: COLORS.TEXT_PRIMARY,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.TEXT_PRIMARY,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_LIGHT,
  },
  continueButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
});

export default CitySelectionScreen; 