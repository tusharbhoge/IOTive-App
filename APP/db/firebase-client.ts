import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyYourApiKeyHere", // Replace with your actual API key
  authDomain: "ioitive.firebaseapp.com",
  databaseURL: "https://ioitive-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ioitive",
  storageBucket: "ioitive.appspot.com",
  messagingSenderId: "123456789012", // Replace with your actual sender ID
  appId: "1:123456789012:web:abcdef123456" // Replace with your actual app ID
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };