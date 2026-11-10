export const firebaseConfig = {
  apiKey: "AIzaSyAu744BJb3WSycl86l7X6K8yn-o1FC8jLc",
  authDomain: "trip-split-7b10a.firebaseapp.com",
  projectId: "trip-split-7b10a",
  storageBucket: "trip-split-7b10a.firebasestorage.app",
  messagingSenderId: "991602346828",
  appId: "1:991602346828:web:91e5e3d5a945fe9b2c1de9",
  measurementId: "G-HTD132M1KJ"
};

export const firebaseReady = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);