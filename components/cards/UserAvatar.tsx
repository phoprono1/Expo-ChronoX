import { getAvatarUrl } from '@/constants/AppwriteFile';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Avatar } from 'react-native-ui-lib';
import Icon from 'react-native-vector-icons/FontAwesome'; // Import biểu tượng từ FontAwesome

interface UserAvatarProps {
  userId: string; // ID của người dùng
  userName: string; // Tên người dùng
  avatarUrl: string; // Đường dẫn đến avatar
}

const UserAvatar: React.FC<UserAvatarProps> = ({ userId, userName, avatarUrl }) => {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Avatar
          source={{ uri: getAvatarUrl(avatarUrl) }} // Đường dẫn đến avatar
          size={50} // Kích thước avatar
          backgroundColor="#E5E5EA" // Màu nền nếu không có ảnh
        />
        <Text className="ml-2 text-lg font-bold">
          {userName}
        </Text>
      </View>
      <View className="flex-row">
        <TouchableOpacity className="mr-4">
          <Icon name="phone" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="video-camera" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserAvatar;