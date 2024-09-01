import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import {
  account,
  databases,
  config,
  updateAvatar,
  signOutUser,
} from "@/constants/appwriteConfig"; // Import phương thức signOutUser
import { useRouter } from "expo-router";
import DisplayAvatar from "@/components/cards/UserProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Query } from "react-native-appwrite";

const Profile = () => {
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null); // Thêm state cho avatar
  const router = useRouter(); // Khởi tạo router

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentAccount = await account.get(); // Lấy thông tin tài khoản hiện tại
        const userDocuments = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal("accountID", currentAccount.$id)]
        );

        if (userDocuments.documents.length > 0) {
          const userDocument = userDocuments.documents[0];
          setEmail(userDocument.email); // Lấy email từ thông tin người dùng
          setAvatar(userDocument.avatar); // Lấy avatar từ document
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("token"); // Xóa token
      await signOutUser(); // Gọi hàm signOutUser từ appwriteConfig
      router.replace("/SignIn"); // Thay thế route để không quay lại trang trước
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  return (
    <View className="flex-1 w-full items-center p-4 bg-white">
      <View className="w-full">
        <View className="justify-center">
          <DisplayAvatar userId={email} />
        </View>
      </View>
      <View className="absolute bottom-20 p-2 rounded-lg">
        <Text onPress={handleSignOut} className="text-red-500">
          Đăng xuất
        </Text>
      </View>
    </View>
  );
};

export default Profile;
