// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAu744BJb3WSycl86l7X6K8yn-o1FC8jLc",
  authDomain: "trip-split-7b10a.firebaseapp.com",
  projectId: "trip-split-7b10a",
  storageBucket: "trip-split-7b10a.firebasestorage.app",
  messagingSenderId: "991602346828",
  appId: "1:991602346828:web:91e5e3d5a945fe9b2c1de9",
  measurementId: "G-HTD132M1KJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);