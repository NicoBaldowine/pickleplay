import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Switch, ScrollView } from 'react-native';
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
      <SafeAreaView style={styles.container}>
        <TopBar 
          title="Manage Notifications" 
          leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
          onLeftIconPress={onBack}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopBar 
        title="Manage Notifications" 
        leftIcon={<ArrowLeft size={24} color={COLORS.TEXT_PRIMARY} />}
        onLeftIconPress={onBack}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Choose which notifications you'd like to receive to stay updated on your games.
        </Text>

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
              trackColor={{ false: COLORS.BACKGROUND_SECONDARY, true: COLORS.PRIMARY }}
              thumbColor={settings.gameAccepted ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
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
              trackColor={{ false: COLORS.BACKGROUND_SECONDARY, true: COLORS.PRIMARY }}
              thumbColor={settings.gameExpired ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
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
              trackColor={{ false: COLORS.BACKGROUND_SECONDARY, true: COLORS.PRIMARY }}
              thumbColor={settings.gameCancelled ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
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
              trackColor={{ false: COLORS.BACKGROUND_SECONDARY, true: COLORS.PRIMARY }}
              thumbColor={settings.gameStartingSoon ? COLORS.WHITE : COLORS.TEXT_SECONDARY}
            />
          </View>
        </View>

        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Note</Text>
          <Text style={styles.noteText}>
            Make sure to allow notifications for PicklePlay in your device settings to receive these alerts.
          </Text>
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
  description: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    lineHeight: 22,
  },
  settingsSection: {
    backgroundColor: COLORS.WHITE,
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BACKGROUND_SECONDARY,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  noteSection: {
    backgroundColor: COLORS.BACKGROUND_SECONDARY,
    borderRadius: 12,
    padding: 16,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});

export default ManageNotificationsScreen; 