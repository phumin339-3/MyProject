import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAseXZho_Df4hlLXvh5lYg5AXlFUZqHU5Q",
  authDomain: "myproject-9bc7e.firebaseapp.com",
  projectId: "myproject-9bc7e",
  storageBucket: "myproject-9bc7e.appspot.com",
  messagingSenderId: "761031996090",
  appId: "1:761031996090:web:80b4d43e27c9c6ab338883",
  measurementId: "G-YSGKSJG3ML"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);  // กำหนดการใช้งาน Realtime Database
const storage = getStorage(app);  // กำหนดการใช้งาน Firebase Storage

// ฟังก์ชันสำหรับบันทึกวิชา
export const saveCourse = (userId, courseId, courseName, classroomName, imageLink, imageFile) => {
  const db = getDatabase();
  const courseRef = ref(db, 'users/' + userId + '/classroom/' + courseId);

  // ถ้ามีการอัปโหลดรูปภาพ
  if (imageFile) {
    const storageReference = storageRef(storage, 'course-images/' + courseId);
    return uploadBytes(storageReference, imageFile).then((snapshot) => {
      return getDownloadURL(snapshot.ref).then((url) => {
        // บันทึกข้อมูลวิชาพร้อม URL รูปภาพ
        set(courseRef, {
          name: courseName,
          classroom: classroomName,
          imageUrl: url,
          status: 'active' // หรือสถานะอื่น ๆ ที่ต้องการ
        });
      });
    });
  } else {
    // ถ้าไม่มีการอัปโหลดรูปภาพ
    return set(courseRef, {
      name: courseName,
      classroom: classroomName,
      imageUrl: imageLink,
      status: 'active'
    });
  }
};

// ฟังก์ชันสำหรับดึงข้อมูลวิชาจาก Realtime Database
export const loadUserCourses = (userId) => {
  const coursesRef = ref(database, 'users/' + userId + '/classroom');
  return get(coursesRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        console.log("No data available");
        return null;
      }
    })
    .catch((error) => {
      console.error("Error fetching courses:", error);
    });
};

// ฟังก์ชันสำหรับการเข้าสู่ระบบด้วย Google
export const googleSignIn = () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("User signed in: ", user);
      window.location.href = 'dashboard.html';
    })
    .catch((error) => {
      console.log("Error signing in: ", error);
    });
};

// ฟังก์ชัน Logout
export const logout = () => {
  signOut(auth)
    .then(() => {
      console.log('User signed out');
      window.location.href = 'index.html';
    })
    .catch((error) => {
      console.error('Error during logout: ', error);
    });
};

// Monitor user authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
  } else {
    console.log('No user is logged in');
  }
});
