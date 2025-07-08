import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCojtJHrF3YIuK9sbNZduup8FVfZusRcsI",
  authDomain: "medic-app-4553d.firebaseapp.com",
  projectId: "medic-app-4553d",
  storageBucket: "medic-app-4553d.appspot.com",
  messagingSenderId: "731977918402",
  appId: "1:731977918402:web:cb412a6fc21d746574985b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 