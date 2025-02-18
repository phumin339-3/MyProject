// firebase.js - แก้ไขโค้ดให้รองรับการอัปโหลดไฟล์และบันทึกข้อมูลอย่างถูกต้อง
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-auth.js';
import { getDatabase, ref, set, get, update as dbUpdate } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-database.js';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.1.2/firebase-storage.js';

// ✅ Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAseXZho_Df4hlLXvh5lYg5AXlFUZqHU5Q",
  authDomain: "myproject-9bc7e.firebaseapp.com",
  projectId: "myproject-9bc7e",
  storageBucket: "myproject-9bc7e.appspot.com",
  messagingSenderId: "761031996090",
  appId: "1:761031996090:web:80b4d43e27c9c6ab338883",
  measurementId: "G-YSGKSJG3ML"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);
const storage = getStorage(app);

/**
 * ✅ ฟังก์ชันสำหรับบันทึกคอร์สไปยัง Firebase Realtime Database และอัปโหลดรูปภาพไปยัง Firebase Storage
 * @param {string} userId - UID ของผู้ใช้ที่สร้างคอร์ส
 * @param {string} courseId - ID ของคอร์ส
 * @param {string} courseName - ชื่อคอร์ส
 * @param {string} classroomName - ชื่อห้องเรียน
 * @param {File} imageFile - ไฟล์รูปภาพที่อัปโหลด (สามารถเป็น null)
 */
export async function saveCourse(userId, courseId, courseName, classroomName, imageFile) {
    try {
        let imageUrl = '';

        if (imageFile) {
            // ✅ อัปโหลดรูปเข้า Firebase Storage
            const imageStorageRef = storageRef(storage, `courses/${userId}/${courseId}`);
            await uploadBytes(imageStorageRef, imageFile);

            // ✅ รับ URL ของรูปที่อัปโหลด
            imageUrl = await getDownloadURL(imageStorageRef);
        }

        // ✅ บันทึกข้อมูลคอร์สลง Firebase Realtime Database
        const courseRef = ref(database, `users/${userId}/classroom/${courseId}`);
        await set(courseRef, {
            name: courseName,
            classroom: classroomName,
            imageUrl, // ✅ บันทึก URL ของรูปภาพ
            status: 'active'
        });

        return true; // ส่งสถานะสำเร็จ
    } catch (error) {
        console.error('Error saving course:', error);
        throw error;
    }
}

/**
 * ✅ ฟังก์ชันสำหรับดึงข้อมูลวิชาของผู้ใช้
 * @param {string} userId - UID ของผู้ใช้
 */
export const loadUserCourses = (userId) => {
    const coursesRef = ref(database, `users/${userId}/classroom`);
    return get(coursesRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                console.log("No courses available");
                return null;
            }
        })
        .catch((error) => {
            console.error("Error fetching courses:", error);
        });
};

/**
 * ✅ ฟังก์ชันสำหรับอัปเดตโปรไฟล์โดยไม่ลบข้อมูลคอร์ส
 * @param {string} userId - UID ของผู้ใช้
 * @param {string} newName - ชื่อใหม่
 * @param {File} newPhotoFile - ไฟล์รูปใหม่ (สามารถเป็น null)
 */
export const updateUserProfile = async (userId, newName, newPhotoFile) => {
    try {
        const user = auth.currentUser;
        const userRef = ref(database, `users/${userId}`);
        
        // โหลดข้อมูลเดิมเพื่อไม่ให้ classroom หาย
        const snapshot = await get(userRef);
        const existingData = snapshot.exists() ? snapshot.val() : {};
        let photoURL = existingData.photo || '';

        if (newPhotoFile) {
            const storageReference = storageRef(storage, `profile-pictures/${userId}`);
            const uploadSnapshot = await uploadBytes(storageReference, newPhotoFile);
            photoURL = await getDownloadURL(uploadSnapshot.ref);
        }
        
        // ✅ อัปเดตเฉพาะข้อมูลที่เปลี่ยนแปลง
        await dbUpdate(userRef, {
            name: newName,
            photo: photoURL,
            email: existingData.email || user.email, // เก็บอีเมลเดิมไว้
            classroom: existingData.classroom || {} // เก็บข้อมูลคอร์สไว้
        });
        
        // ✅ อัปเดต Firebase Auth
        await updateProfile(user, { displayName: newName, photoURL });
        console.log('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
    }
};

/**
 * ✅ ฟังก์ชันสำหรับการเข้าสู่ระบบด้วย Google
 */
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

/**
 * ✅ ฟังก์ชัน Logout
 */
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

// ✅ ตรวจสอบสถานะผู้ใช้
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('No user is logged in');
    }
});
