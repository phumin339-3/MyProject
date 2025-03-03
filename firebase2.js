import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // เพิ่มการนำเข้า Firestore
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup ,signOut} from "firebase/auth";
import { getDatabase} from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID,
  databaseURL:import.meta.env.VITE_DATABASE_URL
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);  // การเชื่อมต่อกับ Firestore
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export  const database = getDatabase(app);
export default app;



// ฟังก์ชันสร้างข้อมูล /users/{uid}
async function createUser(uid, name, email, photo, classroom) {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    name: name,
    email: email,
    photo: photo,
  });

  // สร้างข้อมูลห้องเรียนที่ผู้ใช้เข้าร่วม
  const promises = classroom.map(async (cid) => {
    const classroomRef = doc(db, "users", uid, "classroom", cid);
    await setDoc(classroomRef, {
      status: 2, // สถานะเป็นนักเรียน
    });
  });

  // รอให้ข้อมูลทั้งหมดถูกเพิ่มก่อนจะเสร็จสิ้น
  await Promise.all(promises);
}

// ฟังก์ชันสร้างข้อมูล /classroom/{cid}
async function createClassroom(cid, owner, code, name, photo, room) {
  const classroomRef = doc(db, "classroom", cid);
  await setDoc(classroomRef, {
    owner: owner,
    info: {
      code: code,
      name: name,
      photo: photo,
      room: room,
    },
  });
}

// ฟังก์ชันสร้างข้อมูล /classroom/{cid}/students/{sid}
async function addStudentToClassroom(cid, sid, stdid, name) {
  const studentRef = doc(db, "classroom", cid, "students", sid);
  await setDoc(studentRef, {
    stdid: stdid,
    name: name,
    status: 0, // ยังไม่ตรวจสอบ
  });
}

// ฟังก์ชันสร้างข้อมูล /classroom/{cid}/checkin/{cno}
async function createCheckin(cid, cno, code, date, status) {
  const checkinRef = doc(db, "classroom", cid, "checkin", cno.toString());
  await setDoc(checkinRef, {
    code: code,
    date: date,
    status: status,
  });
}

// ฟังก์ชันสร้างข้อมูล /classroom/{cid}/checkin/{cno}/students/{sid}
async function addStudentToCheckin(cid, cno, sid, stdid, name, remark, date) {
  const checkinStudentRef = doc(db, "classroom", cid, "checkin", cno.toString(), "students", sid);
  await setDoc(checkinStudentRef, {
    stdid: stdid,
    name: name,
    remark: remark,
    date: date,
  });
}

// ฟังก์ชันสร้างข้อมูล /classroom/{cid}/checkin/{cno}/scores/{stdid}
async function addScoreToCheckin(cid, cno, stdid, score, status) {
  const scoreRef = doc(db, "classroom", cid, "checkin", cno.toString(), "scores", stdid);
  await setDoc(scoreRef, {
    score: score,
    status: status,
  });
}

// ฟังก์ชันสร้างคำถาม /classroom/{cid}/checkin/{cno}/question_no
async function addQuestionToCheckin(cid, cno, questionNo, text, show) {
  const questionRef = doc(db, "classroom", cid, "checkin", cno.toString(), "question_no", questionNo.toString());
  await setDoc(questionRef, {
    text: text,
    show: show,
  });
}

// ฟังก์ชันสร้างคำตอบ /classroom/{cid}/checkin/{cno}/answers/{qno}
async function addAnswerToCheckin(cid, cno, qno, stdid, text, time) {
  const answerRef = doc(db, "classroom", cid, "checkin", cno.toString(), "answers", qno.toString(), "students", stdid);
  await setDoc(answerRef, {
    text: text,
    time: time,
  });
}


// ฟังก์ชันสำหรับลงชื่อเข้าใช้ด้วย Google
// export const signInWithGoogle = async () => {
//   const auth = getAuth();
//   const provider = new GoogleAuthProvider();
//   try {
//     const userCredential = await signInWithPopup(auth, provider);
//     return userCredential;  // คืนค่า userCredential
//   } catch (error) {
//     console.error('Error signing in with Google:', error);
//     throw error;  // ส่ง error ออกไปให้ component handle
//   }
// }

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log("User Logged In:", user);  //  ตรวจสอบค่าผู้ใช้ที่ login

    if (user) {
      const { uid, displayName, email, photoURL } = user;

      console.log("Saving to Firestore:", uid, displayName, email); 

      // บันทึกข้อมูล
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { uid, name: displayName, email, photoURL }, { merge: true });

      console.log("Firestore Saved Successfully!");  //  ตรวจสอบว่า save สำเร็จ

      return userCredential;
    }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// ฟังก์ชันสำหรับการออกจากระบบ
export const logout = async (navigate) => {
  const auth = getAuth();
  
  try {
    await signOut(auth);  // เรียกใช้ฟังก์ชัน signOut ของ Firebase
    console.log("User signed out successfully");

    // ลบข้อมูลผู้ใช้จาก LocalStorage
    localStorage.removeItem('user');

    // ใช้ navigate เพื่อไปหน้า login
    navigate('/');  // เปลี่ยนเส้นทางไปที่หน้า login
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};
