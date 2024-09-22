import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import { getUserById, getUserInfo, updateAvatar } from "@/constants/AppwriteUser";
import { avatars, client } from "@/constants/AppwriteClient";
import { fetchPostById, getUserPostsCount } from "@/constants/AppwritePost";
import { config } from "@/constants/Config";

const DisplayAvatar = ({ userId }: { userId: string }) => {
  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
    bio: string; // Thêm bio
    followed: number; // Thêm followed
    follower: number; // Thêm follower
    location: string | null; // Thêm location
    website: string | null; // Thêm website
    postsCount: number; // Thêm postsCount
  }>({
    name: "",
    email: "",
    avatarUrl: null,
    bio: "",
    followed: 0,
    follower: 0,
    location: null,
    website: null,
    postsCount: 0, // Khởi tạo postsCount
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userDocument = await getUserInfo(); // Gọi hàm getUserInfo từ appwriteConfig
        const postsCount = await getUserPostsCount(userId); // Gọi hàm getUserPostsCount từ appwriteConfig
        console.log("Số lượng bài viết của người dùng:" + userId, postsCount);
        setUserInfo({
          name: userDocument.username,
          email: userDocument.email,
          avatarUrl: userDocument.avatar,
          bio: userDocument.bio || "", // Lấy bio
          followed: userDocument.followed || 0, // Lấy followed
          follower: userDocument.follower || 0, // Lấy follower
          location: userDocument.location || null, // Lấy location
          website: userDocument.website || null, // Lấy website
          postsCount: postsCount, // Lấy số lượng bài viết
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

  // Hàm use effect subcribe theo dõi sự kiện tạo bài viết mới
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      async (response) => {
        console.log("Bài viết mới đã được tạo:", response.payload);
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        console.log("payload ở profile:", payload);
        const newPostId = payload.$id; // Lấy $id từ payload
        const newPost = await fetchPostById(newPostId); // Gọi hàm để lấy thông tin bài viết mới
        console.log("ID bài viết mới:", newPostId);
        // Lấy thông tin người dùng từ accountID
        const userInfo = await getUserById(newPost.accountID.accountID); // Hàm này cần được tạo để lấy thông tin người dùng
        console.log("userInfo ở profile:", userInfo.$id);
        // Hàm load lại số lượng bài viết
        const postsCount = await getUserPostsCount(userInfo.$id);
        setUserInfo((prev) => ({ ...prev, postsCount: postsCount }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <SafeAreaView className="bg-white p-4">
      <View className="flex items-center">
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Image
            source={{
              uri: userInfo.avatarUrl
                ? userInfo.avatarUrl
                : String(avatars.getInitials(userInfo.name, 30, 30)),
            }}
            className="w-32 h-32 rounded-full border-4 border-gray-300 mb-4"
          />
        </TouchableOpacity>

        <Text className="font-bold text-2xl">{userInfo.name}</Text>
        <Text className="text-gray-500 text-sm">{userInfo.email}</Text>
        <Text className="text-gray-600 text-sm mt-2">{userInfo.bio}</Text>

        <View className="flex flex-row justify-center w-full">
          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.followed}</Text>
            <Text className="text-gray-500 text-sm">Đã follow</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.follower}</Text>
            <Text className="text-gray-500 text-sm">Follower</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.postsCount}</Text>
            <Text className="text-gray-500 text-sm">Bài viết</Text>
          </View>
        </View>

        {userInfo.location && (
          <Text className="text-gray-600 text-sm mt-2">
            Vị trí: {userInfo.location}
          </Text>
        )}
        {userInfo.website && (
          <Text className="text-gray-600 text-sm mt-2">
            Website: {userInfo.website}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default DisplayAvatar;
