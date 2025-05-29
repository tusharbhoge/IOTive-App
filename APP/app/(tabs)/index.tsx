import React, { useState, useEffect, useRef } from "react";
import useRealtimeAppliance from "../../hooks/useRealtimeAppliance"; // Adjust the path as needed
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing
} from "react-native";
import { useTheme } from "../../context/themeContext";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import CustomFilterModal from "../../components/CustomFilterModal";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from 'expo-constants';
import { getApplianceIcon } from "../../components/applianceIconMapping";


interface UserData {
  id: string;
  name: string;
  role: string;
  token: string;
}

interface Appliance {
  applianceId: string;
  boardId: string;
  status: boolean;
  icon?: string;
  name: string;
  room: string;
  powerUsage?: number;
  lastUpdated?: number;
}

interface Filter {
  name: string;
  appliances: string[];
}

const { width } = Dimensions.get("window");
const BUTTON_SIZE = width / 2.7;
const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

export default function ControlPanelScreen() {
  const theme = useTheme();
  const [clientUid, setClientUid] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [customFilters, setCustomFilters] = useState<Filter[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  
  const realtimeAppliances = useRealtimeAppliance(clientUid, appliances);

  // And this useEffect:
  useEffect(() => {
    if (realtimeAppliances.length > 0) {
      setAppliances((prev) =>
        prev.map((app) => {
          const updatedApp = realtimeAppliances.find(
            (ra) => ra.applianceId === app.applianceId && ra.boardId === app.boardId
          );
          return updatedApp ? { ...app, ...updatedApp } : app;
        })
      );
    }
  }, [JSON.stringify(realtimeAppliances)]);
  
 

  // Fetch clientUid from AsyncStorage
  useEffect(() => {
    const fetchClientUid = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUserData: UserData = JSON.parse(userData);
          setClientUid(parsedUserData.id);
        }
      } catch (error) {
        console.error("Error retrieving clientUid:", error);
      }
    };
    fetchClientUid();
  }, []);

  // Fetch appliances from the backend
  useEffect(() => {
    if (!clientUid) return;

    const fetchAppliances = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/client/${clientUid}/get-appliances`);
        const appliancesWithIcons = response.data.appliances.map((appliance: Appliance) => ({
          ...appliance,
          icon: getApplianceIcon(appliance.applianceId),
          powerUsage: appliance.powerUsage || 0,
          lastUpdated: Date.now(),
        }));
        setAppliances(appliancesWithIcons);
      } catch (error) {
        console.error("Error fetching appliances:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppliances();
  }, [clientUid]);

  // Fetch custom filters from the backend
  useEffect(() => {
    if (!clientUid) return;
  
    const fetchFilters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/client/${clientUid}/get-filters`);
        setCustomFilters(response.data.filters);
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };
  
    fetchFilters();
  }, [clientUid, isModalVisible]);

  const toggleSwitch = async (applianceId: string) => {
    try {
      const appliance = appliances.find((app) => app.applianceId === applianceId);
      if (!appliance) return;

      const response = await axios.post(`${API_BASE_URL}/api/client/${clientUid}/toggle-appliance`, {
        clientUid,
        boardId: appliance.boardId,
        applianceName: appliance.applianceId,
      });

      setAppliances((prev) =>
        prev.map((app) =>
          app.applianceId === applianceId
            ? { ...app, status: response.data.newStatus }
            : app
        )
      );
    } catch (error) {
      console.error("Error toggling appliance:", error);
    }
  };

  const filterOptions = [
    "All",
    "Active",
    ...new Set(appliances.map((app) => app.room)),
    ...customFilters.map((f) => f.name),
    "Create New Filter",
  ];

  const handleFilterChange = (value: string) => {
    if (value === "Create New Filter") {
      setIsModalVisible(true);
    } else {
      setSelectedFilter(value);
    }
  };

  const turnOffAllSwitches = async () => {
    try {
      for (const appliance of filteredAppliances) {
        if (appliance.status) {
          await axios.post(`${API_BASE_URL}/api/client/${clientUid}/toggle-appliance`, {
            clientUid,
            boardId: appliance.boardId,
            applianceName: appliance.applianceId,
          });
        }
      }
      setAppliances((prev) =>
        prev.map((app) =>
          filteredAppliances.some((filteredApp) => filteredApp.applianceId === app.applianceId)
            ? { ...app, status: false }
            : app
        )
      );
    } catch (error) {
      console.error("Error turning off all appliances:", error);
    }
  };

  const turnOnAllSwitches = async () => {
    try {
      for (const appliance of filteredAppliances) {
        if (!appliance.status) {
          await axios.post(`${API_BASE_URL}/api/client/${clientUid}/toggle-appliance`, {
            clientUid,
            boardId: appliance.boardId,
            applianceName: appliance.applianceId,
          });
        }
      }
      setAppliances((prev) =>
        prev.map((app) =>
          filteredAppliances.some((filteredApp) => filteredApp.applianceId === app.applianceId)
            ? { ...app, status: true }
            : app
        )
      );
    } catch (error) {
      console.error("Error turning on all appliances:", error);
    }
  };

  const filteredAppliances = appliances.filter((app) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Active") return app.status;
    if (app.room === selectedFilter) return true;
    const customFilter = customFilters.find((f) => f.name === selectedFilter);
    return customFilter ? customFilter.appliances.includes(app.applianceId) : false;
  });

  const ApplianceButton = React.memo(({ item }: { item: Appliance }) => {
    const iconAnim = useRef(new Animated.Value(1)).current;
    const thunderAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (item.status) {
        // Appliance icon pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(iconAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true
            }),
            Animated.timing(iconAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true
            })
          ])
        ).start();

        // Thunder icon pulse animation
        Animated.loop(
          Animated.sequence([
            Animated.timing(thunderAnim, {
              toValue: 1.3,
              duration: 800,
              useNativeDriver: true
            }),
            Animated.timing(thunderAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true
            })
          ])
        ).start();
      } else {
        iconAnim.setValue(1);
        thunderAnim.setValue(1);
      }

      return () => {
        iconAnim.stopAnimation();
        thunderAnim.stopAnimation();
      };
    }, [item.status]);

    return (
      <TouchableOpacity
        style={[
          styles.switchButton,
          { backgroundColor: theme.card },
          item.status ? styles.glowEffect : styles.shadowEffect,
        ]}
        onPress={() => toggleSwitch(item.applianceId)}
        activeOpacity={0.7}
      >
        <Animated.View style={{ transform: [{ scale: iconAnim }] }}>
          <Icon 
            name={item.icon || "power-plug"}
            size={30} 
            color={item.status ? "#50C878" : theme.text} 
          />
        </Animated.View>
        
        <Text style={[styles.switchText, { color: item.status ? "#50C878" : theme.text }]}>
          {item.applianceId}
        </Text>
        
        <View style={styles.powerContainer}>
          {item.status && (
            <Animated.View style={{ 
              transform: [{ scale: thunderAnim }],
              opacity: thunderAnim.interpolate({
                inputRange: [1, 1.3],
                outputRange: [0.8, 1]
              }) 
            }}>
              <Icon 
                name="lightning-bolt" 
                size={16} 
                color="#FFD700" 
                style={styles.thunderIcon}
              />
            </Animated.View>
          )}
          <Text style={[
            styles.powerText, 
            { color: item.status ? "#50C878" : "#888" }
          ]}>
            {item.powerUsage !== undefined ? `${item.powerUsage} W` : '-- W'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  const renderItem = ({ item }: { item: Appliance }) => (
    <ApplianceButton item={item} />
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#50C878" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterContainer}>
          <Text style={[styles.filterText, { color: theme.text }]}>{selectedFilter}</Text>
          <Icon name="chevron-down" size={20} color={theme.text} />
          <Picker
            selectedValue={selectedFilter}
            onValueChange={handleFilterChange}
            style={styles.picker}
            dropdownIconColor={theme.text}
          >
            {filterOptions.map((option, index) => (
              <Picker.Item 
                key={`${option}_${index}`} 
                label={option} 
                value={option} 
              />
            ))}
          </Picker>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            { backgroundColor: appliances.some((app) => app.status) ? "#FF0000" : "#50C878" },
          ]}
          onPress={() => {
            if (appliances.some((app) => app.status)) {
              turnOffAllSwitches();
            } else {
              turnOnAllSwitches();
            }
          }}
        >
          <Icon name="power" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAppliances}
        keyExtractor={(item) => `${item.applianceId}_${item.boardId}`}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      />
      
      <CustomFilterModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddFilter={async (filterName, selectedAppliances) => {
          try {
            const response = await axios.post(`${API_BASE_URL}/api/client/${clientUid}/add-filter`, {
              filterName,
              appliances: selectedAppliances
            });
            
            if (response.data.success) {
              setCustomFilters(prev => [...prev, {
                name: filterName,
                appliances: selectedAppliances
              }]);
            }
          } catch (error) {
            console.error("Error adding filter:", error);
          }
        }}
        appliances={appliances.map((app) => ({ 
          id: Number(app.applianceId), 
          name: app.applianceId 
        }))}
        refreshFilters={() => {
          const fetchFilters = async () => {
            try {
              const response = await axios.get(`${API_BASE_URL}/api/client/${clientUid}/get-filters`);
              setCustomFilters(response.data.filters);
            } catch (error) {
              console.error("Error fetching filters:", error);
            }
          };
          fetchFilters();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: "center" },
  grid: { alignItems: "center", justifyContent: "center", padding: 0 },
  switchButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
    elevation: 5,
  },
  shadowEffect: {
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  glowEffect: {
    shadowColor: "#50C878",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.5,
    shadowRadius: 1000,
    elevation: 15,
  },
  switchText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
    textAlign: "center",
  },
  filterRow: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 5,
    width: "60%",
    position: "relative",
  },
  filterText: { fontSize: 16, marginRight: 5 },
  picker: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
  },
  toggleButton: {
    padding: 5,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  thunderIcon: {
    marginRight: 4,
  },
  powerText: {
    fontSize: 14,
  },
});

