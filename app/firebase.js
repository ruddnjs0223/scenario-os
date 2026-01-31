// app/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ▼ 여기를 아까 복사한 본인의 설정값으로 바꾸세요!
const firebaseConfig = {
  apiKey: "AIzaSyDkqI1DlTMKW0hYEsu9TVlljdglkmQbNKI",
  authDomain: "sn-cmtiy-test.firebaseapp.com",
  projectId: "sn-cmtiy-test",
  storageBucket: "sn-cmtiy-test.firebasestorage.app",
  messagingSenderId: "580118605250",
  appId: "1:580118605250:web:f5ce5066447c2f1b117a5b",
  measurementId: "G-30KTWX6SXG"
};

// 파이어베이스 시작!
const app = initializeApp(firebaseConfig);
// 데이터베이스 도구 내보내기
export const db = getFirestore(app);