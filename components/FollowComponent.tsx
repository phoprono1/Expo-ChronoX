import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { MaterialIcons, SimpleLineIcons } from "@expo/vector-icons";
import { followUser, unfollowUser } from "@/constants/AppwriteFollow"; // Import hàm followUser

interface FollowComponentProps {
  followerId: string; // ID của người theo dõi
  followedId: string; // ID của người được theo dõi
  isFollowing: boolean;
}

const FollowComponent: React.FC<FollowComponentProps> = ({ followerId, followedId, isFollowing }) => {
  const handleFollow = async () => {
    try {
      await followUser(followerId, followedId); // Gọi hàm theo dõi
    } catch (error) {
      console.error("Lỗi khi theo dõi:", error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(followerId, followedId); // Gọi hàm hủy theo dõi
    } catch (error) {
      console.error("Lỗi khi hủy theo dõi:", error);
    }
  };

  return (
    <View className="flex flex-row items-center justify-center p-2 m-2 gap-2">
      {isFollowing ? (
        <TouchableOpacity 
          className="flex flex-row items-center justify-center p-2 rounded-lg bg-red-200"
          onPress={handleUnfollow} // Gọi hàm khi nhấn nút hủy theo dõi
        >
          <SimpleLineIcons name="user-unfollow" size={20} color="black" />
          <Text className="text-xl">Hủy theo dõi</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          className="flex flex-row items-center justify-center p-2 rounded-lg bg-blue-200"
          onPress={handleFollow} // Gọi hàm khi nhấn nút theo dõi
        >
          <SimpleLineIcons name="user-follow" size={20} color="black" />
          <Text className="text-xl">Theo dõi</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity className="flex flex-row items-center justify-center p-2 rounded-lg bg-blue-200">
        <MaterialIcons name="message" size={20} color="black" />
        <Text className="text-xl">Nhắn tin</Text>
      </TouchableOpacity>
    </View>
  );
};

export default FollowComponent;