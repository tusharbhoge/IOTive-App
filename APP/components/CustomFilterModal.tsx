import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import Constants from 'expo-constants';
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL ?? "";

interface CustomFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onAddFilter: (filterName: string, selectedAppliances: string[]) => void;
  appliances: { id: number; name: string }[];
  refreshFilters: () => void; // Add this prop to refresh filters list after adding
}

export default function CustomFilterModal({ 
  visible, 
  onClose, 
  onAddFilter, 
  appliances,
  refreshFilters
}: CustomFilterModalProps) {
  const [newFilterName, setNewFilterName] = useState("");
  const [selectedAppliances, setSelectedAppliances] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleApplianceSelection = (appliance: string) => {
    setSelectedAppliances((prevSelected) =>
      prevSelected.includes(appliance)
        ? prevSelected.filter((item) => item !== appliance)
        : [...prevSelected, appliance]
    );
  };

  const handleAddFilter = async () => {
    if (!newFilterName.trim()) {
      Alert.alert("Error", "Please enter a filter name");
      return;
    }
    
    if (selectedAppliances.length === 0) {
      Alert.alert("Error", "Please select at least one appliance");
      return;
    }

    setLoading(true);
    
    try {
      // Get clientUid from AsyncStorage
      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        throw new Error("User data not found");
      }
      
      const parsedUserData = JSON.parse(userData);
      const clientUid = parsedUserData.id;
      
      if (!clientUid) {
        throw new Error("Client UID not found");
      }

      // Prepare the filter data
      const filterData = {
        clientUid,
        filterName: newFilterName.trim(),
        appliances: selectedAppliances,
        createdAt: new Date().toISOString()
      };

      // Make API call to save the filter
      const response = await axios.post(
        `${API_BASE_URL}/api/client/${clientUid}/add-filter`,
        filterData
      );

      if (response.data.success) {
        // Call the parent component's onAddFilter
        onAddFilter(newFilterName, selectedAppliances);
        
        // Refresh the filters list
        refreshFilters();
        
        // Reset form and close modal
        setNewFilterName("");
        setSelectedAppliances([]);
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to save filter");
      }
    } catch (error) {
      console.error("Error saving filter:", error);
      Alert.alert("Error", "Failed to save filter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Filter</Text>

          {/* Filter Name Input */}
          <TextInput
            style={styles.input}
            value={newFilterName}
            onChangeText={setNewFilterName}
            placeholder="Enter filter name"
            editable={!loading}
          />

          {/* Appliance Multi-Select List */}
          {loading ? (
            <ActivityIndicator size="large" color="#50C878" style={styles.loader} />
          ) : (
            <FlatList
              data={appliances}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.applianceItem,
                    selectedAppliances.includes(item.name) && styles.selectedAppliance,
                  ]}
                  onPress={() => !loading && toggleApplianceSelection(item.name)}
                  disabled={loading}
                >
                  <Text style={styles.applianceText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              style={styles.listContainer}
            />
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.cancelButton, loading && styles.disabledButton]} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, loading && styles.disabledButton]} 
              onPress={handleAddFilter}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCC",
    width: "100%",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  listContainer: {
    width: "100%",
    maxHeight: 200,
    marginBottom: 10,
  },
  applianceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    width: "100%",
    alignItems: "center",
  },
  selectedAppliance: {
    backgroundColor: "#50C878",
  },
  applianceText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    width: "100%",
  },
  cancelButton: {
    backgroundColor: "#CCC",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#50C878",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  loader: {
    marginVertical: 20,
  },
});