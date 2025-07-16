import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBqX8W9pD0jvEBI9XWRXh-VW16yag2yaK0",
  authDomain: "medic-app1.firebaseapp.com",
  projectId: "medic-app1",
  storageBucket: "medic-app1.firebasestorage.app",
  messagingSenderId: "481675748033",
  appId: "1:481675748033:web:aa98fa4ff9eae8e1306a40",
  measurementId: "G-Z35RJYQ78N"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export { db } 