import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import { ArrowLeft, X, Calendar, Clock } from 'lucide-react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import ListItem from '../ui/ListItem';
import { globalTextStyles } from '../../styles/globalStyles';
import { COLORS } from '../../constants/colors';

interface ScheduleStepProps {
  onClose: () => void;
  onBack: () => void;
  onSchedule: (dateTimeIso: string) => void;
  isSubmitting: boolean;
}

const ICON_SIZE_ACTION = 24;
const ICON_SIZE_AVATAR = 20;
const ICON_COLOR_DARK = '#000000';
const ICON_COLOR_MEDIUM = '#888';
const STROKE_WIDTH_STANDARD = 1.8;

const ScheduleStep: React.FC<ScheduleStepProps> = ({
  onClose,
  onBack,
  onSchedule,
  isSubmitting,
}) => {
  // Helper function to round time to next 15-minute interval
  const roundToNext15Minutes = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    
    if (roundedMinutes === 60) {
      // If we round to 60 minutes, move to next hour
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(roundedMinutes);
    }
    
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  };

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(roundToNext15Minutes());
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // Helper function to check if selected time is in the past
  const isTimeInPast = (selectedDate: Date, selectedTime: Date) => {
    const now = new Date();
    const combinedDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedTime.getHours(),
      selectedTime.getMinutes(),
      0,
      0
    );
    return combinedDateTime < now;
  };

  // Helper function to get minimum time for a given date
  const getMinimumTimeForDate = (checkDate: Date) => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkDateOnly = new Date(checkDate);
    checkDateOnly.setHours(0, 0, 0, 0);
    
    // If check date is today, minimum time is current time rounded up to next 15-min interval
    if (checkDateOnly.getTime() === today.getTime()) {
      return roundToNext15Minutes();
    }
    
    // If check date is in the future, no minimum time restriction
    return null;
  };

  const onDateChangeAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      
      // If we selected today and current time is in the past, update time to valid minimum
      const minimumTime = getMinimumTimeForDate(selectedDate);
      if (minimumTime && isTimeInPast(selectedDate, time)) {
        setTime(minimumTime);
      }
    }
  };

  const onTimeChangeAndroid = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && selectedTime) {
      const hour = selectedTime.getHours();
      
      // Validate time for Android
      if (hour >= 6 && hour <= 23) {
        // Check if the selected time is in the past
        if (isTimeInPast(date, selectedTime)) {
          Alert.alert(
            'Invalid Time',
            'You cannot schedule a game in the past. Please select a future time.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        setTime(selectedTime);
      } else {
        Alert.alert(
          'Invalid Time',
          'Courts are open from 6:00 AM to 11:00 PM. Please select a time within operating hours.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleOpenDatePickerIOS = () => {
    setTempDate(new Date(date));
    setShowDatePicker(true);
  };
  const onTempDateChangeIOS = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || tempDate;
    setTempDate(currentDate);
  };
  const confirmDateIOS = () => {
    setDate(new Date(tempDate));
    
    // If we selected today and current time is in the past, update time to valid minimum
    const minimumTime = getMinimumTimeForDate(tempDate);
    if (minimumTime && isTimeInPast(tempDate, time)) {
      setTime(minimumTime);
    }
    
    setShowDatePicker(false);
  };

  const handleOpenTimePickerIOS = () => {
    // Use current time value, but ensure it's properly rounded
    let defaultTime = new Date(time);
    const currentHour = defaultTime.getHours();
    
    // If current time is between 12 AM (0) and 5 AM, set to 6 AM
    if (currentHour >= 0 && currentHour < 6) {
      defaultTime.setHours(6, 0, 0, 0);
    }
    // If current time is after 11 PM, set to 6 AM next day
    else if (currentHour >= 23) {
      defaultTime.setHours(6, 0, 0, 0);
    }
    
    // If the current time would be in the past for the selected date, use minimum valid time
    const minimumTime = getMinimumTimeForDate(date);
    if (minimumTime && isTimeInPast(date, defaultTime)) {
      defaultTime = new Date(minimumTime);
    }
    
    setTempTime(new Date(defaultTime));
    setShowTimePicker(true);
  };
  
  const onTempTimeChangeIOS = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (selectedTime) {
      const hour = selectedTime.getHours();
      
      // Restrict hours between 6 AM (6) and 11 PM (23)
      if (hour >= 6 && hour <= 23) {
        // Check if this time would be in the past for the selected date
        if (isTimeInPast(date, selectedTime)) {
          // If it's in the past, use the minimum valid time
          const minimumTime = getMinimumTimeForDate(date);
          if (minimumTime) {
            setTempTime(minimumTime);
          } else {
            setTempTime(selectedTime);
          }
        } else {
          setTempTime(selectedTime);
        }
      } else {
        // If invalid hour selected, adjust to nearest valid time
        const adjustedTime = new Date(selectedTime);
        if (hour < 6) {
          adjustedTime.setHours(6, 0, 0, 0);
        } else {
          adjustedTime.setHours(23, 0, 0, 0);
        }
        
        // Check if adjusted time is still in the past
        if (isTimeInPast(date, adjustedTime)) {
          const minimumTime = getMinimumTimeForDate(date);
          if (minimumTime) {
            setTempTime(minimumTime);
          } else {
            setTempTime(adjustedTime);
          }
        } else {
          setTempTime(adjustedTime);
        }
      }
    }
  };
  
  const confirmTimeIOS = () => {
    const hour = tempTime.getHours();
    
    // Final validation before confirming
    if (hour >= 6 && hour <= 23) {
      // Check if the selected time is in the past
      if (isTimeInPast(date, tempTime)) {
        Alert.alert(
          'Invalid Time',
          'You cannot schedule a game in the past. Please select a future time.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setTime(new Date(tempTime));
      setShowTimePicker(false);
    } else {
      Alert.alert(
        'Invalid Time',
        'Courts are open from 6:00 AM to 11:00 PM. Please select a time within operating hours.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleConfirmSchedule = () => {
    const combinedDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0, // seconds
      0 // milliseconds
    );
    onSchedule(combinedDateTime.toISOString());
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={onBack} style={styles.headerButtonLeft}>
            <ArrowLeft size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.headerButtonRight}>
            <X size={ICON_SIZE_ACTION} color={ICON_COLOR_DARK} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Schedule Your Game</Text>
          <Text style={styles.descriptionText}>
            Choose the date and time for your upcoming match.
          </Text>

          <ListItem
            title="Select Date"
            chips={[date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            onPress={Platform.OS === 'ios' ? handleOpenDatePickerIOS : () => setShowDatePicker(true)}
            avatarIcon={<Calendar size={ICON_SIZE_AVATAR} color="#000000" />}
            style={styles.listItem}
          />

          <ListItem
            title="Select Time"
            chips={[time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]}
            chipBackgrounds={['rgba(0, 0, 0, 0.07)']}
            onPress={Platform.OS === 'ios' ? handleOpenTimePickerIOS : () => setShowTimePicker(true)}
            avatarIcon={<Clock size={ICON_SIZE_AVATAR} color="#000000" />}
            style={styles.listItem}
          />
        </ScrollView>

        {/* Confirm Schedule Button - Fixed at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.confirmButton, isSubmitting && styles.disabledButton]} 
            onPress={handleConfirmSchedule}
            disabled={isSubmitting}
          >
            <Text style={[styles.confirmButtonText, isSubmitting && styles.disabledButtonText]}>
              {isSubmitting ? 'Loading...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            testID="datePickerAndroid"
            value={date}
            mode="date"
            display="default" 
            onChange={onDateChangeAndroid}
            minimumDate={new Date()} 
          />
        )}

        {Platform.OS === 'android' && showTimePicker && (
          <DateTimePicker
            testID="timePickerAndroid"
            value={time}
            mode="time"
            display="default"
            onChange={onTimeChangeAndroid}
            minuteInterval={15}
          />
        )}

        {/* Date Selection Modal */}
        {Platform.OS === 'ios' && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <DateTimePicker
                  testID="datePickerIOS"
                  value={tempDate} 
                  mode="date"
                  display="spinner"
                  onChange={onTempDateChangeIOS}
                  minimumDate={new Date()}
                  style={styles.iosPicker}
                  textColor="#000000"
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.modalButton}>
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmDateIOS} style={styles.modalButton}>
                    <Text style={[styles.modalButtonText, styles.okButtonText]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Time Selection Modal */}
        {Platform.OS === 'ios' && (
          <Modal
            transparent={true}
            animationType="fade"
            visible={showTimePicker}
            onRequestClose={() => setShowTimePicker(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Time</Text>
                <DateTimePicker
                  testID="timePickerIOS"
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={onTempTimeChangeIOS}
                  minuteInterval={15}
                  style={styles.iosPicker}
                  textColor="#000000"
                />
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)} style={styles.modalButton}>
                    <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmTimeIOS} style={styles.modalButton}>
                    <Text style={[styles.modalButtonText, styles.okButtonText]}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
  },
  topBarActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerButtonLeft: {
    padding: 8,
  },
  headerButtonRight: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 120, // Space for the fixed button container
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: '#99958B',
    marginBottom: 22,
    lineHeight: 22,
  },
  listItem: {
    marginBottom: 15,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.BACKGROUND_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },
  confirmButton: {
    backgroundColor: '#000000',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E5E7',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'InterTight-ExtraBold',
    fontWeight: '800',
    color: 'white',
  },
  disabledButtonText: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  iosPicker: {
    height: 200,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  okButtonText: {
    color: '#007AFF',
  },
});

export default ScheduleStep; 