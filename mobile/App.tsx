import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { getUserFromStorage } from "./services/storage";

const App = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      const user = await getUserFromStorage();
      if (user) {
        router.replace("/(home)"); // ✅ ถ้ามี user ให้ไปที่หน้า Home
      } else {
        router.replace("/login"); // ✅ ถ้าไม่มี user ให้ไปที่ Login
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  if (loading) return <ActivityIndicator size="large" color="#007AFF" />;

  return <View />;
};

export default App;
