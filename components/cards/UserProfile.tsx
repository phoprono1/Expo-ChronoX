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

const DisplayAvatar = () => {
  const user = useSelector((state: any) => state.user); // Lấy trạng thái người dùng từ Redux
  const isMinimized = useSelector((state: any) => state.minimize.isMinimized); // Lấy trạng thái isMinimized từ Redux

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

  // Khởi tạo giá trị cho scale và position
  const avatarScale = useSharedValue(1);
  const avatarPositionX = useSharedValue(0);
  const avatarPositionY = useSharedValue(0);
  const followScale = useSharedValue(1); // Thêm giá trị scale cho follow, follower, posts

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userDocument = await getUserInfo(); // Gọi hàm getUserInfo từ appwriteConfig
        const postsCount = await getUserPostsCount(user.userId); // Gọi hàm getUserPostsCount từ appwriteConfig
        console.log(
          "Số lượng bài viết của người dùng:" + user.userId,
          postsCount
        );
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
    <SafeAreaView className={`bg-white ${isMinimized ? "" : "p-4"}`}>
      <View className={`flex ${isMinimized ? "flex-row" : "items-center"}`}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <Animated.Image
            source={{
              uri: user.avatar
                ? user.avatar
                : String(avatars.getInitials(user.name, 30, 30)),
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
