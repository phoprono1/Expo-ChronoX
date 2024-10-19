import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Image } from "expo-image";
import {
  getUserById,
  getUserInfo,
  updateAvatar,
} from "@/constants/AppwriteUser";
import { avatars, client } from "@/constants/AppwriteClient";
import { fetchPostById, getUserPostsCount } from "@/constants/AppwritePost";
import { config } from "@/constants/Config";
import { useSelector } from "react-redux";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { getAvatarUrl, getFileUrl } from "@/constants/AppwriteFile";
import { setUser } from "@/store/userSlice";

const DisplayAvatar = () => {
  const user = useSelector((state: any) => state.user); // Lấy trạng thái người dùng từ Redux
  const isMinimized = useSelector((state: any) => state.minimize.isMinimized); // Lấy trạng thái isMinimized từ Redux

  const [userInfo, setUserInfo] = useState<{
    name: string;
    email: string;
    avatarId: string | null;
    bio: string; // Thêm bio
    followed: number; // Thêm followed
    follower: number; // Thêm follower
    location: string | null; // Thêm location
    website: string | null; // Thêm website
    postsCount: number; // Thêm postsCount
  }>({
    name: "",
    email: "",
    avatarId: null,
    bio: "",
    followed: 0,
    follower: 0,
    location: null,
    website: null,
    postsCount: 0, // Khởi tạo postsCount
  });

  // Khởi tạo giá trị cho scale và position
  const avatarScale = useSharedValue(1);
  const avatarPositionX = useSharedValue(0);
  const avatarPositionY = useSharedValue(0);
  const followScale = useSharedValue(1); // Thêm giá trị scale cho follow, follower, posts

  const fetchUserInfo = async () => {
    // Định nghĩa lại hàm fetchUserInfo
    try {
      const userDocument = await getUserInfo(); // Gọi hàm getUserInfo từ appwriteConfig
      const postsCount = await getUserPostsCount(user.userId); // Gọi hàm getUserPostsCount từ appwriteConfig
      setUserInfo({
        name: userDocument.username,
        email: userDocument.email,
        avatarId: userDocument.avatarId,
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

  useEffect(() => {
    fetchUserInfo(); // Gọi hàm fetchUserInfo khi component được mount
  }, [user]);

  useEffect(() => {
    // Cập nhật scale và position khi isMinimized thay đổi
    if (isMinimized) {
      avatarScale.value = withTiming(0.5, { duration: 300 }); // Giảm kích thước avatar
      avatarPositionX.value = withTiming(10, { duration: 300 }); // Di chuyển avatar đến góc trên trái
      avatarPositionY.value = withTiming(10, { duration: 300 });
      followScale.value = withTiming(0, { duration: 300 }); // Giảm kích thước các phần tử follow, follower, posts
    } else {
      avatarScale.value = withTiming(1, { duration: 300 }); // Trả về kích thước ban đầu
      avatarPositionX.value = withTiming(0, { duration: 300 }); // Trả về vị trí ban đầu
      avatarPositionY.value = withTiming(0, { duration: 300 });
      followScale.value = withTiming(1, { duration: 300 }); // Giảm kích thước các phần tử follow, follower, posts
    }
  }, [isMinimized]);

  const animatedAvatarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: avatarScale.value },
        { translateX: avatarPositionX.value },
        { translateY: avatarPositionY.value },
      ],
    };
  });

  const animatedFollowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: followScale.value }],
      opacity: followScale.value, // Thêm opacity để ẩn mượt mà
    };
  });

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
      // Cập nhật avatar trong cơ sở dữ liệu bằng hàm updateAvatar
      try {
        const updatedAvatarId = await updateAvatar(finalUri); // Gọi hàm updateAvatar với uri mới và nhận về avatarId mới
        // Cập nhật avatarId cho user
        setUserInfo((prev) => ({ ...prev, avatarId: updatedAvatarId!! }));
        await fetchUserInfo(); // Gọi lại hàm fetchUserInfo để cập nhật thông tin người dùng
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
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        const newPostId = payload.$id; // Lấy $id từ payload
        const newPost = await fetchPostById(newPostId); // Gọi hàm để lấy thông tin bài viết mới
        // Lấy thông tin người dùng từ accountID
        const userInfo = await getUserById(newPost.accountID.accountID); // Hàm này cần được tạo để lấy thông tin người dùng
        // Hàm load lại số lượng bài viết
        const postsCount = await getUserPostsCount(userInfo.$id);
        setUserInfo((prev) => ({ ...prev, postsCount: postsCount }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Hàm use effect subcribe theo dõi sự kiện thay đổi avatar
  useEffect(() => {
    const unsubscribeAvatar = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        // Cập nhật avatarId cho user
        if (payload.avatarId) {
          setUserInfo((prev) => ({ ...prev, avatarId: payload.avatarId }));
        }
      }
    );

    return () => {
      unsubscribeAvatar();
    };
  }, []);

  return (
    <SafeAreaView className={`bg-white ${isMinimized ? "" : "p-4"}`}>
      <View className={`flex ${isMinimized ? "flex-row" : "items-center"}`}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Animated.Image
            source={{
              uri: userInfo.avatarId
                ? getAvatarUrl(userInfo.avatarId)
                : String(avatars.getInitials(userInfo.name, 30, 30)), // Sử dụng getFileUrl để lấy URL của avatar
            }}
            style={[animatedAvatarStyle]} // Kích thước avatar
            className="w-32 h-32 rounded-full border-4 border-gray-300"
          />
        </TouchableOpacity>

        <View
          className={`flex flex-col ${isMinimized ? "mt-10" : "items-center"}`}
        >
          <Text
            className={`font-bold text-2xl ${
              isMinimized ? "" : "text-center"
            } `}
          >
            {user.name}
          </Text>
          <Text
            className={`text-gray-500 text-sm ${
              isMinimized ? "" : "text-center"
            } `}
          >
            {user.email}
          </Text>
        </View>

        <Text
          className={`text-gray-600 text-sm mt-2 ${
            isMinimized ? "hidden" : ""
          }`}
        >
          {user.bio}
        </Text>

        <Animated.View
          style={animatedFollowStyle}
          className={`${
            isMinimized ? "hidden" : "flex flex-row justify-center w-full"
          }`}
        >
          <View className="flex-1 items-center">
            <Text className="font-bold">{user.followed}</Text>
            <Text className="text-gray-500 text-sm">Đã follow</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{user.follower}</Text>
            <Text className="text-gray-500 text-sm">Follower</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{user.postsCount}</Text>
            <Text className="text-gray-500 text-sm">Bài viết</Text>
          </View>
        </Animated.View>

        {user.location && (
          <Text
            className={`text-gray-600 text-sm mt-2 ${
              isMinimized ? "hidden" : ""
            }`}
          >
            Vị trí: {user.location}
          </Text>
        )}
        {user.website && (
          <Text
            className={`text-gray-600 text-sm mt-2 ${
              isMinimized ? "hidden" : ""
            }`}
          >
            Website: {user.website}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default DisplayAvatar;
