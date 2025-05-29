import admin from "firebase-admin";

export const getFilters = async (req, res) => {
    try {
        const { clientUid } = req.params; // Get userUid from request parameters

        console.log(`🔍 Fetching filters for user: ${clientUid}`);

        // Reference to the "filters" subcollection inside "clientInformation" document
        const filtersRef = admin.firestore()
            .collection("clientInformation")
            .doc(String(clientUid))
            .collection("filters");

        // Fetch all filter documents
        const snapshot = await filtersRef.get();

        if (snapshot.empty) {
            console.log("⚠️ No filters found!");
            return res.status(404).json({ message: "No filters found!" });
        }

        // Extract filter data from documents
        const filters = snapshot.docs.map(doc => ({
            filterId: doc.id,
            ...doc.data()
        }));

        console.log(`✅ Retrieved ${filters.length} filters`);
        res.status(200).json({ filters });

    } catch (error) {
        console.error("❌ Error fetching filters:", error);
        res.status(500).json({ message: "Error fetching filters", error: error.message });
    }
};


export const addFilter = async (req, res) => {
    try {
      const { clientUid } = req.params;
      const { filterName, appliances } = req.body;
  
      // 1. Input Validation
      if (!clientUid) {
        return res.status(400).json({ success: false, message: 'Client UID is required' });
      }
  
      if (!filterName?.trim()) {
        return res.status(400).json({ success: false, message: 'Filter name is required' });
      }
  
      if (!Array.isArray(appliances) || appliances.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one appliance must be selected' });
      }
  
      // 2. Get Firestore references
      const db = admin.firestore();
      const clientInfoRef = db.collection('clientInformation').doc(clientUid);
      const filtersCollectionRef = clientInfoRef.collection('filters');
      
      // 3. Check for duplicate filter name
      const duplicateCheck = await filtersCollectionRef
        .where('name', '==', filterName.trim())
        .limit(1)
        .get();
  
      if (!duplicateCheck.empty) {
        return res.status(400).json({ success: false, message: 'Filter name already exists' });
      }
  
      // 4. Create new filter data
      const newFilter = {
        filterId: filterName.trim(), // Generate a new ID
        name: filterName.trim(),
        appliances,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
  
      // 5. Create batch write
      const batch = db.batch();
      
      // Add to filters subcollection
      const filterDocRef = filtersCollectionRef.doc(newFilter.filterId);
      batch.set(filterDocRef, newFilter);
  
      // 6. Commit the batch
      await batch.commit();
  
      // 7. Return success response
      return res.status(201).json({
        success: true,
        message: 'Filter created successfully',
        filter: {
          ...newFilter,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
  
    } catch (error) {
      console.error('Error saving custom filter:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save filter',
        error: error.message
      });
    }
  };