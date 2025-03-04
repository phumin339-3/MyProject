// src/components/checkin/CheckInHeader.jsx
import React from "react";

const CheckInHeader = ({ classroom, currentCheckin, checkinDate, checkInCode }) => {
  // รายละเอียดห้องเรียนจาก Firestore
  const classroomName = classroom?.info?.name || "ไม่พบข้อมูลห้องเรียน";
  const classroomCode = classroom?.info?.code || "กรุณาตรวจสอบการเชื่อมต่อ";
  const classroomRoom = classroom?.info?.room || "กรุณาตรวจสอบการเชื่อมต่อ";

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-8">
      <div className="relative z-10 p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {classroomName}
            </h1>
            <p className="text-white/90 text-lg mb-1">
              รหัสวิชา: {classroomCode}
            </p>
            <p className="text-white/90 text-lg mb-3">
              ห้องเรียน: {classroomRoom}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <h2 className="text-white text-xl font-bold">การเช็คชื่อครั้งนี้</h2>
            <p className="text-white text-base mt-1">
              <span className="opacity-80">วันที่: </span>
              <span className="font-medium">{checkinDate}</span>
            </p>
            {currentCheckin && (
              <div className="flex items-center mt-2">
                <p className="text-white mr-2">สถานะ:</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentCheckin.status === 2
                    ? "bg-green-500 text-white"
                    : currentCheckin.status === 1
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-500 text-white"
                }`}>
                  {currentCheckin.status === 2
                    ? "เสร็จสิ้น"
                    : currentCheckin.status === 1
                    ? "กำลังเช็คชื่อ"
                    : "ยังไม่เริ่ม"}
                </span>
              </div>
            )}
            {checkInCode && (
              <p className="text-white text-base mt-2">
                <span className="opacity-80">รหัสเช็คชื่อ: </span>
                <span className="font-mono font-bold bg-white/20 px-2 py-1 rounded">{checkInCode}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 -mt-20 -mr-20">
        <div className="w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>
    </div>
  );
};

export default CheckInHeader;
