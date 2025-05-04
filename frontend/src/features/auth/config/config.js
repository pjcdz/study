// filepath: /root/manu-simplechatapp/frontend/src/features/auth/config/config.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB0pxIijgEDPdN4UVSAVMb9cDPJs27MMfo",
    authDomain: "terminalchat-4f5ed.firebaseapp.com",
    projectId: "terminalchat-4f5ed",
    storageBucket: "terminalchat-4f5ed.firebasestorage.app",
    messagingSenderId: "1045312373840",
    appId: "1:1045312373840:web:f01201d4d107a8c7f6fd55",
    measurementId: "G-NB0B0B6FRQ"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };