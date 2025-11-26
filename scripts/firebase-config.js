// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// Firebase Configuration and Initialization
// This file sets up the connection to your Firebase project

// Import Firebase modules from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEKLZhTN2GQyAuFUveEoZ6L_l8lxcLZUY",
    authDomain: "beyond-borders-dashboard.firebaseapp.com",
    projectId: "beyond-borders-dashboard",
    storageBucket: "beyond-borders-dashboard.firebasestorage.app",
    messagingSenderId: "597204970170",
    appId: "1:597204970170:web:8e3ba75ad027b636fcb083"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

// Export so other files can use them
export { auth, db };