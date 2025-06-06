import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';

// Import colors and components
import { COLORS } from '../constants/colors';
import TopBar from '../components/ui/TopBar';

interface NotificationSettings {
  gameAccepted: boolean;
  gameExpired: boolean;
  gameCancelled: boolean;
  gameStartingSoon: boolean;
}

interface ManageNotificationsScreenProps {
  onBack?: () => void;
}

const ManageNotificationsScreen: React.FC<ManageNotificationsScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    gameAccepted: true,
    gameExpired: true,
    gameCancelled: true,
    gameStartingSoon: true,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveNotificationSettings(newSettings);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <StatusBar barStyle="dark-content" />
        <TopBar 
          title="Manage Notifications" 
          leftIcon={<ArrowLeft size={24} color="#000000" />}
          onLeftIconPress={onBack}
          style={styles.topBar}
          titleContainerStyle={styles.titleContainer}
          titleStyle={styles.titleStyle}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" />
      <TopBar 
        title="Manage Notifications" 
        leftIcon={<ArrowLeft size={24} color="#000000" />}
        onLeftIconPress={onBack}
        style={styles.topBar}
        titleContainerStyle={styles.titleContainer}
        titleStyle={styles.titleStyle}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Game Accepted</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone accepts your scheduled game
              </Text>
            </View>
            <Switch
              value={settings.gameAccepted}
              onValueChange={(value) => handleToggle('gameAccepted', value)}
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor={settings.gameAccepted ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Game Expired</Text>
              <Text style={styles.settingDescription}>
                Get notified when your scheduled game expires without anyone joining
              </Text>
            </View>
            <Switch
              value={settings.gameExpired}
              onValueChange={(value) => handleToggle('gameExpired', value)}
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor={settings.gameExpired ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Game Cancelled</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone cancels an upcoming game you're part of
              </Text>
            </View>
            <Switch
              value={settings.gameCancelled}
              onValueChange={(value) => handleToggle('gameCancelled', value)}
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor={settings.gameCancelled ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Game Starting Soon</Text>
              <Text style={styles.settingDescription}>
                Get notified 1 hour before your upcoming game starts
              </Text>
            </View>
            <Switch
              value={settings.gameStartingSoon}
              onValueChange={(value) => handleToggle('gameStartingSoon', value)}
              trackColor={{ false: '#E0E0E0', true: '#000000' }}
              thumbColor={settings.gameStartingSoon ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  settingsSection: {
    backgroundColor: '#F5E9CF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
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
});

export default ManageNotificationsScreen; 