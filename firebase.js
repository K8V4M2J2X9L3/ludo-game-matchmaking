import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDqLXsrjgMcW4dXSLQIdKLL2PEfMc2vXfI",
  authDomain: "user69-83afc.firebaseapp.com",
  databaseURL: "https://user69-83afc-default-rtdb.firebaseio.com",
  projectId: "user69-83afc",
  storageBucket: "user69-83afc.firebasestorage.app",
  messagingSenderId: "228502191488",
  appId: "1:228502191488:web:7669f479348dc2da23d565",
  measurementId: "G-BF8X15QTMD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export default app;
