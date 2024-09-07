import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import {
  avatars,
  account,
  updateAvatar,
  getUserInfo,
} from "@/constants/appwriteConfig"; // Import getUserInfo và updateAvatar

const DisplayAvatar = ({ userId }: { userId: string }) => {
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  }>({
    name: "",
    email: "",
    avatarUrl: null,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userDocument = await getUserInfo(); // Gọi hàm getUserInfo từ appwriteConfig
        setUserInfo({
          name: userDocument.username,
          email: userDocument.email,
          avatarUrl: userDocument.avatar,
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const handleChangeAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Bạn cần cấp quyền truy cập vào thư viện ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync();

    if (!result.canceled) {
      const newAvatarUri = result.assets[0].uri; // Lấy uri mới

      // Kiểm tra định dạng của ảnh
      const isHEIF =
        newAvatarUri.endsWith(".heif") || newAvatarUri.endsWith(".heic");

      let finalUri = newAvatarUri;

      // Nếu ảnh là HEIF, có thể cần xoay
      if (isHEIF) {
        const manipResult = await ImageManipulator.manipulateAsync(
          newAvatarUri,
          [{ rotate: 90 }], // Xoay 90 độ nếu cần
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );
        finalUri = manipResult.uri; // Cập nhật uri nếu đã xoay
      }

      console.log("URL của ảnh mới là:", finalUri); // Log để kiểm tra

      setUserInfo((prev) => ({ ...prev, avatarUrl: finalUri })); // Cập nhật avatar hiện tại

      // Cập nhật avatar trong cơ sở dữ liệu bằng hàm updateAvatar
      try {
        await updateAvatar(finalUri); // Gọi hàm updateAvatar với uri mới
        console.log("Cập nhật avatar trong cơ sở dữ liệu thành công");
      } catch (error) {
        console.error("Lỗi khi cập nhật avatar:", error);
      }
    }
  };

  return (
    <SafeAreaView>
      <View className="flex flex-row items-center p-2 bg-white rounded-lg shadow-sm">
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Image
            source={{
              uri: userInfo.avatarUrl
                ? userInfo.avatarUrl
                : String(avatars.getInitials(userInfo.name, 30, 30)),
            }}
            className="w-28 h-28 rounded-full mr-3"
          />
        </TouchableOpacity>

        <View className="flex flex-col">
          <Text className="font-bold text-xl">{userInfo.name}</Text>
          <Text className="text-gray-400 text-sm italic">{userInfo.email}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default DisplayAvatar;
