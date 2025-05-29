import { useEffect, useState } from 'react';
import admin from '../../zappServer/src/db/firebaseAdmin.js';

const useRealtimeDB = (path) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    const db = admin.database();
    
    setLoading(true);
    
    // Get initial data
    db.ref(path).once('value')
      .then((snapshot) => {
        setData(snapshot.val());
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });

    // Set up real-time listener
    const listener = db.ref(path).on('value', 
      (snapshot) => setData(snapshot.val()),
      (err) => setError(err)
    );

    // Cleanup function
    return () => {
      db.ref(path).off('value', listener);
    };
  }, [path]);

  return { data, loading, error };
};

export default useRealtimeDB;


// not using this hook yet, but it is a good example of how to use the firebase realtime database with hooks