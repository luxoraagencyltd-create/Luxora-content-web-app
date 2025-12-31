
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Use Vite's import.meta.env in the browser. Fall back to hardcoded config when env vars are not provided.
const env = import.meta.env as Record<string, any>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? "AIzaSyC0r5R2WiU_VdHDfiV3hJwJuef7JOOegoo",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? "luxora-content-app.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? "luxora-content-app",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? "luxora-content-app.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "1094059628830",
  appId: env.VITE_FIREBASE_APP_ID ?? "1:1094059628830:web:4ba869df125dd412c3910f",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-BGB6F921DV"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
