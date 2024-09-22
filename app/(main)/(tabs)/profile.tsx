import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";

import { useRouter } from "expo-router";
import DisplayAvatar from "@/components/cards/UserProfile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Query } from "react-native-appwrite";
import { useBottomSheet } from '@/hooks/BottomSheetProvider'; // Import useBottomSheet
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { account, client, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { getUserById, signOutUser } from "@/constants/AppwriteUser";
import { fetchPostById } from "@/constants/AppwritePost";

const Profile = () => {
  const { isVisible } = useBottomSheet(); // Lấy trạng thái từ context
  const scale = useSharedValue(1); // Khởi tạo giá trị chia sẻ cho kích thước
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null); // Thêm state cho avatar
  const router = useRouter(); // Khởi tạo router

  // Cập nhật giá trị scale khi isVisible thay đổi
  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.9 : 1, { duration: 300 }); // Thay đổi kích thước với hiệu ứng
  }, [isVisible]);

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
          setUserId(userDocument.$id); // Lấy userId từ thông tin người dùng
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

  // Tạo kiểu động cho View
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={[{ flex: 1, width: '100%', alignItems: 'center', padding: 16, backgroundColor: 'white' }, animatedStyle]}>
      <View className="w-full">
        <View className="justify-center">
          <DisplayAvatar userId={userId} />
        </View>
      </View>
      <View className="absolute bottom-20 p-2 rounded-lg">
        <Text onPress={handleSignOut} className="text-red-500">
          Đăng xuất
        </Text>
      </View>
    </Animated.View>
  );
};

export default Profile;
