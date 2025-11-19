import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import {getAuth} from 'firebase/auth';
import firebaseConfig from "./firebaseConfig";
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const real_time_db= getDatabase(app)
const auth_app=getAuth(app)
export { db,real_time_db ,auth_app};
