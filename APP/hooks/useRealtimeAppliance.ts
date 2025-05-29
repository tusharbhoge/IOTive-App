import { useEffect, useState, useRef } from "react";
import { database } from "../db/firebase-client";
import { ref, onValue, off } from "firebase/database";

interface Appliance {
  applianceId: string;
  boardId: string;
  status: boolean;
  powerUsage?: number;
  lastUpdated?: number;
  icon?: string;
  name?: string;
  room?: string;
}

const useRealtimeAppliance = (clientUid: string | null, initialData: Appliance[]) => {
  const [appliances, setAppliances] = useState<Appliance[]>(initialData);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (!clientUid) {
      setAppliances(initialData);
      return;
    }

    // Clear previous listeners
    unsubscribeRef.current.forEach(fn => fn());
    unsubscribeRef.current = [];

    // Create a map of initial data for merging
    const initialDataMap = new Map(
      initialData.map(app => [`${app.boardId}-${app.applianceId}`, app])
    );

    const appliancesRef = ref(database, `clients/${clientUid}/boards`);
    
    const unsubscribe = onValue(appliancesRef, (snapshot) => {
      const boardsData = snapshot.val();
      const updatedAppliances: Appliance[] = [];

      Object.keys(boardsData || {}).forEach(boardId => {
        Object.keys(boardsData[boardId].appliances || {}).forEach(applianceId => {
          const firebaseData = boardsData[boardId].appliances[applianceId];
          const initialAppliance = initialDataMap.get(`${boardId}-${applianceId}`) || {};

          updatedAppliances.push({
            ...initialAppliance, // Preserve backend data
            ...firebaseData,     // Override with realtime values
            applianceId,
            boardId,
            lastUpdated: Date.now()
          });
        });
      });

      setAppliances(updatedAppliances);
    });

    unsubscribeRef.current.push(unsubscribe);

    return () => {
      unsubscribeRef.current.forEach(fn => fn());
    };
  }, [clientUid, JSON.stringify(initialData)]);

  return appliances;
};

export default useRealtimeAppliance;