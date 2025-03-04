// CheckIn.jsx (Main Component)
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  getDatabase,
  ref,
  onValue,
  off,
  get,
  set,
  update,
  serverTimestamp,
} from "firebase/database";

// Import Components
import LoadingSpinner from "./LoadingSpinner";
import CheckInHeader from "./CheckInHeader";
import ActionButtons from "./ActionButtons";
import TabNavigation from "./TabNavigation";
import StudentList from "./StudentList";
import ScoreList from "./ScoreList";
import QRCodeModal from "./QRCodeModal";
import UserGuideHint from "./UserGuideHint"; // เพิ่มคอมโพเนนต์คำแนะนำ

// Import Utils
import { generateRandomCode } from "./helpers";

const CheckIn = () => {
  const { classroomId, checkinId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classroom, setClassroom] = useState(null);
  const [currentCheckin, setCurrentCheckin] = useState(null);
  const [checkinDate, setCheckinDate] = useState("");
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [checkInCode, setCheckInCode] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [activeTab, setActiveTab] = useState("studentList"); // "studentList" หรือ "scoreList"

  // ดึงข้อมูลห้องเรียนจาก Firestore
  useEffect(() => {
    const fetchClassroomData = async () => {
      try {
        const firestoreDb = getFirestore();
        const docRef = doc(firestoreDb, "classroom", classroomId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setClassroom(docSnap.data());
        } else {
          console.error("ไม่พบข้อมูลห้องเรียนใน Firestore");
        }
      } catch (error) {
        console.error("Error fetching classroom data from Firestore:", error);
      }
    };

    fetchClassroomData();
  }, [classroomId]);

  // ดึงข้อมูลการเช็คชื่อและคะแนน
  useEffect(() => {
    const fetchCheckinData = async () => {
      try {
        const db = getDatabase();
        const checkinRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}`);
        
        onValue(checkinRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const formattedDate = data.createdAt 
              ? new Date(data.createdAt).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : "ไม่ระบุวันเวลา";
            
            setCheckinDate(formattedDate);
            setCurrentCheckin({
              id: checkinId,
              code: data.code || "",
              date: data.date || formattedDate,
              status: data.status || 0,
              question_show: data.question_show || false,
              createdAt: data.createdAt
            });
            setCheckInCode(data.code || "");
            
            // ถ้ายังไม่มีรหัสเช็คชื่อให้สร้างอัตโนมัติ
            if (!data.code) {
              const generatedCode = generateRandomCode(6);
              setCheckInCode(generatedCode);
              update(checkinRef, { code: generatedCode });
            }
          }
        });

        // ดึงข้อมูลนักเรียนที่เช็คชื่อ
        const studentsRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/students`);
        
        onValue(studentsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const studentsList = Object.entries(data).map(([key, value]) => ({
              id: key,
              stdid: value.stdid || "",
              name: value.name || "",
              remark: value.remark || "",
              date: value.date || "",
            }));
            setStudents(studentsList);
          } else {
            setStudents([]);
          }
        });

        // ดึงข้อมูลคะแนน
        const scoresRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/scores`);
        
        onValue(scoresRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const scoresList = Object.entries(data).map(([key, value]) => ({
              id: key,
              stdid: value.stdid || "",
              name: value.name || "",
              remark: value.remark || "",
              date: value.date || "",
              score: value.score || 0,
              status: value.status !== undefined ? value.status : 0,
            }));
            setScores(scoresList);
          } else {
            setScores([]);
          }
          setLoading(false);
        });
        
        // อัพเดทสถานะเป็น "กำลังเช็คชื่อ" โดยอัตโนมัติถ้าเข้ามาในหน้านี้
        await update(checkinRef, { status: 1 });
      } catch (error) {
        console.error("Error fetching checkin data:", error);
        setLoading(false);
      }
    };

    fetchCheckinData();
    
    // Clean up
    return () => {
      const db = getDatabase();
      const checkinRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}`);
      const studentsRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/students`);
      const scoresRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/scores`);
      
      off(checkinRef);
      off(studentsRef);
      off(scoresRef);
    };
  }, [classroomId, checkinId]);

  // อัพเดทคะแนนอัตโนมัติเมื่อมีนักเรียนเช็คชื่อใหม่
  useEffect(() => {
    const updateScoresFromStudents = async () => {
      if (students.length === 0) return;
      
      try {
        const db = getDatabase();
        const scoresRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/scores`);
        const scoresSnapshot = await get(scoresRef);
        let scoresData = {};
        
        if (scoresSnapshot.exists()) {
          scoresData = scoresSnapshot.val();
        }
        
        // ตรวจสอบว่ามีนักเรียนใหม่ที่ต้องอัพเดทคะแนนหรือไม่
        let hasUpdates = false;
        
        students.forEach(student => {
          if (!scoresData[student.id] || scoresData[student.id].status !== 1) {
            hasUpdates = true;
            scoresData[student.id] = {
              ...(scoresData[student.id] || {}),
              stdid: student.stdid,
              name: student.name,
              date: student.date,
              remark: student.remark || "",
              score: 10, // คะแนนเริ่มต้น
              status: 1,  // มาเรียน
              uid: student.id
            };
          }
        });
        
        // อัพเดทข้อมูลถ้ามีการเปลี่ยนแปลง
        if (hasUpdates) {
          await set(scoresRef, scoresData);
        }
      } catch (error) {
        console.error("Error updating scores automatically:", error);
      }
    };
    
    updateScoresFromStudents();
  }, [students, classroomId, checkinId]);

  // สร้าง QR Code สำหรับเช็คชื่อ
  const generateQRCode = async () => {
    if (!checkInCode) {
      const code = generateRandomCode(6);
      setCheckInCode(code);
      
      try {
        const db = getDatabase();
        const checkinRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}`);
        await update(checkinRef, { code: code });
      } catch (error) {
        console.error("Error setting check-in code:", error);
      }
    }
    
    try {
      // สร้างข้อมูลสำหรับ QR Code
      const qrData = JSON.stringify({
        classroomId,
        checkinId,
        code: checkInCode
      });
      
      const QRCode = (await import('qrcode')).default;
      // สร้าง URL ของ QR Code
      const qrCodeURL = await QRCode.toDataURL(qrData);
      setQrCodeData(qrCodeURL);
      setShowQRCode(true);
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("เกิดข้อผิดพลาดในการสร้าง QR Code");
    }
  };

  // บันทึกคะแนนทั้งหมด
  const saveAllScores = async () => {
    try {
      const db = getDatabase();
      const scoresRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}/scores`);
      const updatedScores = {};
      
      scores.forEach(score => {
        updatedScores[score.id] = {
          stdid: score.stdid,
          name: score.name,
          remark: score.remark,
          date: score.date,
          score: score.score,
          status: parseInt(score.status),
          uid: score.id
        };
      });
      
      await set(scoresRef, updatedScores);
      
      // ปิดการเช็คชื่อโดยอัตโนมัติ
      const checkinRef = ref(db, `classroom/${classroomId}/checkin/${checkinId}`);
      await update(checkinRef, { status: 2 }); // เสร็จสิ้นการเช็คชื่อ
      
      alert("บันทึกคะแนนและปิดการเช็คชื่อเรียบร้อย");
      
      // นำผู้ใช้กลับไปยังหน้าจัดการห้องเรียน
      navigate(`/manage-classroom/${classroomId}`);
    } catch (error) {
      console.error("Error saving scores:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกคะแนน");
    }
  };

  const handleBack = () => {
    navigate(`/manage-classroom/${classroomId}`);
  };

  const navigateToQuestion = () => {
    navigate(`/checkin/${classroomId}/${checkinId}/question`);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="group flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition duration-200 mb-6"
        >
          <svg
            className="w-5 h-5 transform group-hover:-translate-x-1 transition duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="font-medium">กลับสู่หน้าจัดการห้องเรียน</span>
        </button>

        {/* Header Section */}
        <CheckInHeader 
          classroom={classroom} 
          currentCheckin={currentCheckin}
          checkinDate={checkinDate}
          checkInCode={checkInCode}
        />

        {/* แสดงคำแนะนำการใช้งาน */}
        <UserGuideHint />

        {/* Main Action Buttons */}
        <ActionButtons 
          generateQRCode={generateQRCode} 
          navigateToQuestion={navigateToQuestion} 
        />

        {/* Tab Navigation */}
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          studentCount={students.length}
          scoreCount={scores.length}
        />

        {/* Conditional Content Based on Active Tab */}
        {activeTab === "studentList" ? (
          <StudentList 
            students={students} 
            classroomId={classroomId}
            checkinId={checkinId}
          />
        ) : (
          <ScoreList 
            scores={scores} 
            setScores={setScores}
            saveAllScores={saveAllScores}
            classroomId={classroomId}
            checkinId={checkinId}
          />
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeModal 
          checkInCode={checkInCode}
          qrCodeData={qrCodeData}
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default CheckIn;
