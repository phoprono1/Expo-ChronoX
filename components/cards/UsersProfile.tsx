import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { avatars, client } from "@/constants/AppwriteClient";
import { useSelector } from "react-redux";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { config } from "@/constants/Config";

const UsersProfile = () => {
  const userInfo = useSelector((state: any) => state.userInfo); // Lấy trạng thái người dùng từ Redux
  const isMinimized = useSelector(
    (state: any) => state.minimizeUsersInfo.isMinimized
  ); // Lấy trạng thái isMinimized từ Redux
  console.log("info của user này", userInfo);

  const [followerCount, setFollowerCount] = useState(userInfo.follower); // Thêm state cho số lượng follower

  // Cập nhật followerCount khi userInfo thay đổi
  useEffect(() => {
    setFollowerCount(userInfo.follower);
  }, [userInfo.follower]);

  // Khởi tạo giá trị cho scale và position
  const avatarScale = useSharedValue(1);
  const avatarPositionX = useSharedValue(0);
  const avatarPositionY = useSharedValue(0);
  const followScale = useSharedValue(1); // Thêm giá trị scale cho follow, follower, posts

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

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        console.log(
          "Đã có chuyện gì đó xảy ra ở UsersProfile: ",
          response.payload
        );
        const payload = JSON.parse(JSON.stringify(response.payload));
        console.log("id của user thay đổi là: ", payload.$id);
        console.log("số lượng follower của user đó là: ", payload.follower);
        console.log("sự kiện này gồm user gì 1", userInfo.$id)
        console.log("sự kiện này gồm user gì 2", payload.$id)
        if (userInfo.$id == payload.$id) {
          setFollowerCount(payload.follower); // Cập nhật state với số lượng follower mới
          console.log("sự kiện này đã được kích hoạt!")
        }
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
    };
  }, []);

  return (
    <SafeAreaView className={`bg-white ${isMinimized ? "" : "p-4"}`}>
      <View className={`flex ${isMinimized ? "flex-row" : "items-center"}`}>
        <TouchableOpacity onPress={() => {}}>
          <Animated.Image
            source={{
              uri: userInfo.avatar
                ? userInfo.avatar
                : String(avatars.getInitials(userInfo.name, 30, 30)),
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
            {userInfo.name}
          </Text>
          <Text
            className={`text-gray-500 text-sm ${
              isMinimized ? "" : "text-center"
            } `}
          >
            {userInfo.email}
          </Text>
        </View>

        <Text
          className={`text-gray-600 text-sm mt-2 ${
            isMinimized ? "hidden" : ""
          }`}
        >
          {userInfo.bio}
        </Text>

        <Animated.View
          style={animatedFollowStyle}
          className={`${
            isMinimized ? "hidden" : "flex flex-row justify-center w-full"
          }`}
        >
          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.followed}</Text>
            <Text className="text-gray-500 text-sm">Đã follow</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{followerCount}</Text>
            <Text className="text-gray-500 text-sm">Follower</Text>
          </View>

          <View className="flex-1 items-center">
            <Text className="font-bold">{userInfo.postsCount}</Text>
            <Text className="text-gray-500 text-sm">Bài viết</Text>
          </View>
        </Animated.View>

        {userInfo.location && (
          <Text
            className={`text-gray-600 text-sm mt-2 ${
              isMinimized ? "hidden" : ""
            }`}
          >
            Vị trí: {userInfo.location}
          </Text>
        )}
        {userInfo.website && (
          <Text
            className={`text-gray-600 text-sm mt-2 ${
              isMinimized ? "hidden" : ""
            }`}
          >
            Website: {userInfo.website}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default UsersProfile;
