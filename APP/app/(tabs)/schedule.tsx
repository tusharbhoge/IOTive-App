import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, 
  Modal, Platform, Alert, ActivityIndicator 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/themeContext';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import axios from 'axios';
import Constants from 'expo-constants';
import { Picker } from '@react-native-picker/picker';
import { getApplianceIcon } from '../../components/applianceIconMapping';

interface UserData {
  id: string;
}

interface Appliance {
  applianceId: string;
  type: string;
  powerUsage?: number;
  lastUpdated?: number;
  boardId: string; // Added boardId property
}

interface Schedule {
  id: string;
  applianceId: string;
  applianceName?: string;
  startTime: string;
  endTime: string;
  repeat: 'specific_date' | 'daily' | 'custom_days';
  days?: string[];
  date?: string;
  enabled: boolean;
  icon?: string; // Added icon property
  boardId: string; // Added boardId property
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ScheduleScreen: React.FC = () => {
  const theme = useTheme();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [showPicker, setShowPicker] = useState<'startTime' | 'endTime' | 'date' | null>(null);
  const [clientUid, setClientUid] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

  useEffect(() => {
    const fetchClientUid = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUserData: UserData = JSON.parse(userData);
          if (parsedUserData.id) {
            setClientUid(parsedUserData.id);
          }
        }
      } catch (error) {
        console.error("Error retrieving clientUid:", error);
        setError("Failed to load user data");
      }
    };

    fetchClientUid();
  }, []);

  useEffect(() => {
    if (!clientUid) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await Promise.all([fetchAppliances(), fetchSchedules()]);
        setInitialLoadComplete(true);
      } catch (err) {
        console.error('Error in fetchInitialData:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientUid]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchAppliances(), fetchSchedules()]);
    } catch (err) {
      console.error('Error in fetchInitialData:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppliances = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/client/${clientUid}/get-appliances`,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      setAppliances(response.data.appliances || []);
    } catch (err) {
      console.error('Error fetching appliances:', err);
      throw err;
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/client/${clientUid}/schedules`
      );
  
      // Validate and transform the response data
      const validatedSchedules = (response.data.schedules || []).map((schedule: any) => {
        if (!schedule.id) {
          console.warn('Schedule missing ID:', schedule);
          return null;
        }
        return {
          id: schedule.id,
          applianceId: schedule.applianceId || '',
          applianceName:  schedule.applianceId || '',
          boardId: schedule.boardId || '',
          startTime: schedule.startTime || '00:00',
          endTime: schedule.endTime || '00:00',
          repeat: schedule.repeat || 'daily',
          days: schedule.days || [],
          date: schedule.date || '',
          icon: getApplianceIcon(schedule.applianceId),
          enabled: schedule.enabled !== undefined ? schedule.enabled : true
        };
      }).filter(Boolean); // Remove any null entries
  
      setSchedules(validatedSchedules);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      throw err;
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString || timeString === '00:00') return 'Not set';
    const [hours, minutes] = timeString.split(':');
    return `${parseInt(hours) % 12 || 12}:${minutes.padStart(2, '0')} ${parseInt(hours) >= 12 ? 'PM' : 'AM'}`;
  };

  const showPickerModal = (field: 'startTime' | 'endTime' | 'date') => {
    if (Platform.OS === 'android') {
      const mode = field === 'date' ? 'date' : 'time';
      DateTimePickerAndroid.open({
        value: new Date(),
        mode,
        is24Hour: true,
        onChange: (event, date) => {
          if (date && currentSchedule) {
            if (field === 'date') {
              setCurrentSchedule({ 
                ...currentSchedule, 
                date: date.toISOString().split('T')[0] 
              });
            } else {
              const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              setCurrentSchedule({ 
                ...currentSchedule, 
                [field]: timeString 
              });
            }
          }
        },
      });
    } else {
      setShowPicker(field);
    }
  };

  const handlePickerChange = (event: any, selectedDate?: Date) => {
    setShowPicker(null);
    if (selectedDate && currentSchedule && showPicker) {
      if (showPicker === 'date') {
        setCurrentSchedule({ 
          ...currentSchedule, 
          date: selectedDate.toISOString().split('T')[0] 
        });
      } else {
        const timeString = `${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
        setCurrentSchedule({ 
          ...currentSchedule, 
          [showPicker]: timeString 
        });
      }
    }
  };

  const addSchedule = () => {
    setCurrentSchedule({
      id: '',
      applianceId: '',
      applianceName: '',
      boardId: '',
      startTime: '00:00',
      endTime: '00:00',
      repeat: 'daily',
      enabled: true,
    });
    setModalVisible(true);
  };



  const saveSchedule = async () => {
    if (!currentSchedule || !clientUid) {
      Alert.alert('Error', 'Missing required information');
      return;
    }
  
    // Validation checks
    const errors: string[] = [];
  
    if (!currentSchedule.applianceId) {
      errors.push('Please select an appliance');
    }

    if (!currentSchedule.boardId) {
      errors.push('No board assigned to selected appliance');
    }
  
    if (!currentSchedule.startTime || currentSchedule.startTime === '00:00') {
      errors.push('Please select a start time');
    }
  
    if (!currentSchedule.endTime || currentSchedule.endTime === '00:00') {
      errors.push('Please select an end time');
    }
  
    if (currentSchedule.startTime && currentSchedule.endTime && 
        currentSchedule.startTime >= currentSchedule.endTime) {
      errors.push('End time must be after start time');
    }
  
    if (currentSchedule.repeat === 'specific_date' && !currentSchedule.date) {
      errors.push('Please select a specific date');
    }
  
    if (currentSchedule.repeat === 'custom_days' && 
        (!currentSchedule.days || currentSchedule.days.length === 0)) {
      errors.push('Please select at least one day');
    }
  
    if (errors.length > 0) {
      Alert.alert(
        'Validation Error', 
        errors.join('\n\n'),
        [{ text: 'OK' }]
      );
      return;
    }
  
    try {
      setLoading(true);
  
      const requestData = {
        applianceId: currentSchedule.applianceId,
        applianceName: currentSchedule.applianceName || currentSchedule.applianceId,
        startTime: currentSchedule.startTime,
        endTime: currentSchedule.endTime,
        boardId: currentSchedule.boardId,
        repeat: currentSchedule.repeat,
        days: currentSchedule.days || [],
        date: currentSchedule.date || '',
        enabled: currentSchedule.enabled,
      };
  
      if (currentSchedule.id) {
        // Update existing schedule
        const response = await axios.put(
          `${API_BASE_URL}/api/client/${clientUid}/schedules/${currentSchedule.id}`,
          requestData
        );
        
        setSchedules(schedules.map(s => 
          s.id === currentSchedule.id ? response.data.schedule : s
        ));
      } else {
        // Create new schedule
        const response = await axios.post(
          `${API_BASE_URL}/api/client/${clientUid}/schedules`,
          requestData
        );
        
        setSchedules(prev => [response.data.schedule, ...prev]);
      }
  
      setModalVisible(false);
      setCurrentSchedule(null);
    } catch (err) {
      console.error('Error saving schedule:', err);
      let errorMessage = 'Failed to save schedule';
      
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      fetchSchedules(); // Refresh schedules after saving
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
      if (!clientUid) return;
  
      try {
        setLoading(true);
        await axios.delete(`${API_BASE_URL}/api/client/${clientUid}/schedules/${id}`);
        setSchedules(schedules.filter(schedule => schedule.id !== id));
      } catch (error) {
        console.error('Error deleting schedule:', error);
        Alert.alert(
          'Error',
          `Failed to delete schedule: ${axios.isAxiosError(error) ? error.response?.data?.message || error.message : 'An unknown error occurred'}`
        );
      } finally {
        setLoading(false);
      }
    };
  
    const confirmDelete = (id: string) => {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this schedule?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          { 
            text: 'Delete', 
            onPress: () => deleteSchedule(id),
            style: 'destructive'
          }
        ]
      );
    };

    const toggleScheduleStatus = async (id: string, newEnabledState: boolean) => {
      if (!clientUid || !id) return;
      
      try {
        // Optimistic UI update
        setSchedules(prev => prev.map(s => 
          s.id === id ? { ...s, enabled: newEnabledState } : s
        ));
    
        const response = await axios.patch(
          `${API_BASE_URL}/api/client/${clientUid}/schedules/${id}/status`,
          { enabled: newEnabledState }
        );
    
        if (!response.data.success) {
          throw new Error(response.data.message || 'Toggle failed');
        }
    
        // Final confirmation update
        setSchedules(prev => prev.map(s => 
          s.id === id ? { ...s, enabled: newEnabledState } : s
        ));
    
      } catch (error) {
        console.error('Error updating schedule status:', error);
        
        // Revert optimistic update
        setSchedules(prev => prev.map(s => 
          s.id === id ? { ...s, enabled: !newEnabledState } : s
        ));
    
        Alert.alert(
          'Error',
          `Failed to update schedule status: ${
            axios.isAxiosError(error) 
              ? error.response?.data?.message || error.message 
              : 'An unknown error occurred'
          }`
        );
      }
    };

  const toggleDaySelection = (day: string) => {
    if (!currentSchedule) return;
    
    const newDays = currentSchedule.days ? [...currentSchedule.days] : [];
    const dayIndex = newDays.indexOf(day);
    
    if (dayIndex > -1) {
      newDays.splice(dayIndex, 1);
    } else {
      newDays.push(day);
    }
    
    setCurrentSchedule({ ...currentSchedule, days: newDays });
  };

  const renderScheduleItem = ({ item }: { item: Schedule }) => {
    const icon = getApplianceIcon(item.applianceId);

    if (!item.id) {
      console.warn('Schedule missing ID:', item);
      return null;
    }

    return (
        <Swipeable
          renderRightActions={() => (
            <TouchableOpacity 
              style={[styles.deleteButton, { backgroundColor: theme.danger }]} 
              onPress={() => confirmDelete(item.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.card }]}
          onPress={() => {
            setCurrentSchedule(item);
            setModalVisible(true);
          }}
        >
          <View style={styles.cardContent}>
            <View style={styles.applianceHeader}>
              <Icon 
                          name={icon || "power-plug"}
                          size={20} 
                          color={item.enabled ? "#50C878" : theme.text} 
                          style={styles.applianceIcon}
                        />
              <Text style={[styles.applianceName, { color:theme.text }]}>{item.applianceId}</Text>
            </View>
            <Text style={[styles.time, { color: theme.text }]}>
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </Text>
            <Text style={[styles.repeat, { color: theme.text }]}>
              {item.repeat === 'daily' ? 'Every day' : 
               item.repeat === 'specific_date' ? `On ${item.date}` : 
               `On ${item.days?.join(', ')}`}
            </Text>
          </View>
          <Switch 
            value={item.enabled} 
            onValueChange={(value) => toggleScheduleStatus(item.id, value)}
          />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (!initialLoadComplete && loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.text, marginTop: 10 }}>Loading schedules...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            setError(null);
            fetchInitialData();
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <FlatList
        data={schedules}
        renderItem={renderScheduleItem}
        keyExtractor={(item) => item.id || `${item.applianceId}-${item.startTime}`}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.text }]}>
                No schedules found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.text }]}>
                Tap the + button to add a new schedule
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={schedules.length === 0 ? styles.emptyListContainer : null}
        refreshing={loading}
        onRefresh={fetchInitialData}
      />
      
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: theme.primary}]} 
        onPress={addSchedule}
      >
        <Text style={styles.addText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={[styles.modalContent, { backgroundColor: theme.modal }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {currentSchedule?.id ? 'Edit Schedule' : 'Add Schedule'}
            </Text>
            
            <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
              <Picker
                selectedValue={currentSchedule?.applianceId}
                onValueChange={(itemValue) => {
                  if (currentSchedule) {
                    const selectedAppliance = appliances.find(a => a.applianceId === itemValue);
                    if (!selectedAppliance) return;
                    
                    setCurrentSchedule({
                      ...currentSchedule,
                      applianceId: selectedAppliance.applianceId,
                      boardId: selectedAppliance.boardId, // Auto-set from appliance
                      applianceName: selectedAppliance.applianceId
                    });
                    
                  }
                }}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="Select an appliance" value="" />
                {appliances.map(appliance => (
                  <Picker.Item
                    key={appliance.applianceId}
                    label={appliance.applianceId}
                    value={appliance.applianceId}
                  />
                ))}
              </Picker>
            </View>
            
            <View style={styles.timeContainer}>
              <TouchableOpacity 
                onPress={() => showPickerModal('startTime')} 
                style={[styles.timeButton, { backgroundColor: theme.button }]}
              >
                <Text style={{ color: theme.text }}>
                  Start: {formatTime(currentSchedule?.startTime || '')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => showPickerModal('endTime')} 
                style={[styles.timeButton, { backgroundColor: theme.button }]}
              >
                <Text style={{ color: theme.text }}>
                  End: {formatTime(currentSchedule?.endTime || '')}
                </Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <DateTimePicker
                value={new Date()}
                mode={showPicker === 'date' ? 'date' : 'time'}
                is24Hour={true}
                display="default"
                onChange={handlePickerChange}
              />
            )}

            <View style={styles.repeatContainer}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Repeat:</Text>
              
              <View style={styles.repeatOptions}>
                <TouchableOpacity
                  style={[
                    styles.repeatOption,
                    currentSchedule?.repeat === 'daily' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => currentSchedule && setCurrentSchedule({ ...currentSchedule, repeat: 'daily' })}
                >
                  <Text style={{ color: currentSchedule?.repeat === 'daily' ? 'white' : theme.text }}>
                    Every Day
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.repeatOption,
                    currentSchedule?.repeat === 'specific_date' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => currentSchedule && setCurrentSchedule({ ...currentSchedule, repeat: 'specific_date' })}
                >
                  <Text style={{ color: currentSchedule?.repeat === 'specific_date' ? 'white' : theme.text }}>
                    Specific Date
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.repeatOption,
                    currentSchedule?.repeat === 'custom_days' && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => currentSchedule && setCurrentSchedule({ ...currentSchedule, repeat: 'custom_days' })}
                >
                  <Text style={{ color: currentSchedule?.repeat === 'custom_days' ? 'white' : theme.text }}>
                    Custom Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {currentSchedule?.repeat === 'specific_date' && (
              <TouchableOpacity 
                onPress={() => showPickerModal('date')} 
                style={[styles.dateButton, { backgroundColor: theme.button }]}
              >
                <Text style={{ color: theme.text }}>
                  Date: {currentSchedule?.date || 'Select date'}
                </Text>
              </TouchableOpacity>
            )}

            {currentSchedule?.repeat === 'custom_days' && (
              <View style={styles.daysContainer}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Days:</Text>
                <View style={styles.daysGrid}>
                  {daysOfWeek.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        currentSchedule.days?.includes(day) && { backgroundColor: theme.primary }
                      ]}
                      onPress={() => toggleDaySelection(day)}
                    >
                      <Text style={{ 
                        color: currentSchedule.days?.includes(day) ? 'white' : theme.text 
                      }}>
                        {day.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)} 
                style={[styles.cancelButton, { backgroundColor: theme.secondary }]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={saveSchedule} 
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  center: { justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyListContainer: { flex: 1, justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 18, fontWeight: '600' },
  emptySubtext: { textAlign: 'center', fontSize: 14, marginTop: 8 },
  errorText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  card: { 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  cardContent: { flex: 1 },
  applianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  applianceIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  applianceName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  time: { fontSize: 14, marginBottom: 4 },
  repeat: { fontSize: 12, fontStyle: 'italic' },
  deleteButton: { 
    justifyContent: 'center', 
    alignItems: 'flex-end',
    padding: 15,
    margin:10,
    marginBottom:18,
    width: 80,
  },
  deleteText: { color: 'white', fontWeight: 'bold' },
  addButton: { 
    position: 'absolute', 
    bottom: 20, 
    right: 20, 
    borderRadius: 50, 
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addText: { color: 'white', fontSize: 24 },
  retryButton: {
    padding: 12,
    borderRadius: 5,
    marginTop: 20,
    width: '50%',
    alignItems: 'center',
  },
  modalBackground: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    width: '90%', 
    padding: 20, 
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeButton: { 
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  dateButton: {
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  repeatContainer: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  repeatOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  repeatOption: {
    padding: 10,
    borderRadius: 5,
    width: '30%',
    alignItems: 'center',
  },
  daysContainer: {
    marginBottom: 15,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '14%',
    aspectRatio: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: { 
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: { 
    padding: 12,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: { 
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ScheduleScreen;