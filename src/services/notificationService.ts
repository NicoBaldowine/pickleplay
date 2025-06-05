import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  gameAccepted: boolean;
  gameExpired: boolean;
  gameCancelled: boolean;
  gameStartingSoon: boolean;
}

export type NotificationType = keyof NotificationSettings;

class NotificationService {
  private pushToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return false;
      }

      // Request permission for notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return false;
      }

      // Get push token
      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        const pushTokenString = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        this.pushToken = pushTokenString;
        console.log('Push token:', pushTokenString);
      } catch (e: unknown) {
        console.log('Error getting push token:', e);
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem('notificationSettings');
      if (settingsJson) {
        return JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('Error getting notification settings:', error);
    }

    // Default settings
    return {
      gameAccepted: true,
      gameExpired: true,
      gameCancelled: true,
      gameStartingSoon: true,
    };
  }

  async isNotificationTypeEnabled(type: NotificationType): Promise<boolean> {
    const settings = await this.getNotificationSettings();
    return settings[type];
  }

  async scheduleGameAcceptedNotification(
    gameId: string,
    opponentName: string,
    gameType: 'singles' | 'doubles',
    scheduledDate: string,
    scheduledTime: string
  ): Promise<void> {
    if (!(await this.isNotificationTypeEnabled('gameAccepted'))) {
      return;
    }

    const title = '🎾 Game Accepted!';
    const body = `${opponentName} has accepted your ${gameType} game scheduled for ${this.formatDateTime(scheduledDate, scheduledTime)}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'gameAccepted',
          gameId,
          opponentName,
          gameType,
        },
      },
      trigger: null, // Show immediately
    });
  }

  async scheduleGameExpiredNotification(
    gameId: string,
    gameType: 'singles' | 'doubles',
    scheduledDate: string,
    scheduledTime: string
  ): Promise<void> {
    if (!(await this.isNotificationTypeEnabled('gameExpired'))) {
      return;
    }

    const title = '⏰ Game Expired';
    const body = `Your ${gameType} game scheduled for ${this.formatDateTime(scheduledDate, scheduledTime)} has expired. No one joined in time.`;

    // Schedule notification for when the game time passes
    const gameDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();
    
    if (gameDateTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'gameExpired',
            gameId,
            gameType,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: gameDateTime,
        },
      });
    }
  }

  async scheduleGameCancelledNotification(
    gameId: string,
    cancelledBy: string,
    gameType: 'singles' | 'doubles',
    scheduledDate: string,
    scheduledTime: string
  ): Promise<void> {
    if (!(await this.isNotificationTypeEnabled('gameCancelled'))) {
      return;
    }

    const title = '❌ Game Cancelled';
    const body = `${cancelledBy} has cancelled the ${gameType} game scheduled for ${this.formatDateTime(scheduledDate, scheduledTime)}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'gameCancelled',
          gameId,
          cancelledBy,
          gameType,
        },
      },
      trigger: null, // Show immediately
    });
  }

  async scheduleGameStartingSoonNotification(
    gameId: string,
    opponentName: string,
    gameType: 'singles' | 'doubles',
    venueName: string,
    scheduledDate: string,
    scheduledTime: string
  ): Promise<void> {
    if (!(await this.isNotificationTypeEnabled('gameStartingSoon'))) {
      return;
    }

    const title = '🏓 Game Starting Soon!';
    const body = `Your ${gameType} game with ${opponentName} starts in 1 hour at ${venueName}`;

    // Schedule notification for 1 hour before the game
    const gameDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const notificationTime = new Date(gameDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
    const now = new Date();
    
    if (notificationTime > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'gameStartingSoon',
            gameId,
            opponentName,
            gameType,
            venueName,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notificationTime,
        },
      });
    }
  }

  async cancelGameNotifications(gameId: string): Promise<void> {
    // Cancel all scheduled notifications for this game
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.gameId === gameId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  private formatDateTime(date: string, time: string): string {
    try {
      const dateObj = new Date(`${date}T${time}`);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    } catch (error) {
      return `${date} at ${time}`;
    }
  }

  // Add notification listeners
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export const notificationService = new NotificationService(); 