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
import { cityRequestsService } from '../../services/cityRequestsService';
import { authService } from '../../services/authService';

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

  const saveCityRequest = async (cityName: string) => {
    try {
      // Try to get current user info for better tracking
      let userEmail = undefined;
      let userId = undefined;
      
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          userEmail = currentUser.email;
          userId = currentUser.id;
        }
      } catch (error) {
        console.log('No user session during city request, continuing without user info');
      }
      
      const result = await cityRequestsService.saveCityRequest(cityName, userEmail, userId);
      
      if (result.success) {
        console.log('✅ City request saved successfully');
      } else {
        console.error('❌ Failed to save city request:', result.error);
      }
    } catch (error) {
      console.error('💥 Error saving city request:', error);
    }
  };

  const handleAnotherCityPress = () => {
    Alert.alert(
      'City Not Listed?',
      'Currently, we only support the cities listed above. However, you can add your city to help us expand our coverage in the future.',
      [
        {
          text: 'Got it',
          style: 'cancel',
        },
        {
          text: 'Add your city',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Alert.prompt(
                'Add Your City',
                'Please enter the name of your city:',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Add City',
                    onPress: async (cityName) => {
                      if (cityName && cityName.trim()) {
                        console.log('🏙️ User added city:', cityName.trim());
                        
                        // Save to Supabase
                        await saveCityRequest(cityName.trim());
                        
                        Alert.alert(
                          'Thank You!',
                          `We've noted your interest in ${cityName.trim()}. We'll consider adding it in future updates!`,
                          [{ text: 'OK' }]
                        );
                        // Don't navigate to next screen, keep user here
                      }
                    },
                  },
                ],
                'plain-text'
              );
            } else {
              // For Android, show a simpler flow
              Alert.alert(
                'Add Your City',
                'Please contact us through the app to request your city be added.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
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
            avatarIcon={<MapPin size={20} color={COLORS.TEXT_PRIMARY} />}
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
    height: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CitySelectionScreen; 