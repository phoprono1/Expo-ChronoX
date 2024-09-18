import { View, Text, Image } from "react-native";
import React from "react";
import * as Localization from 'expo-localization';

interface CommentItemProps {
  item: any;
}

const CommentItem: React.FC<CommentItemProps> = ({ item }) => {
  // Định dạng ngày giờ theo ngôn ngữ của người dùng
  const formattedDate = new Intl.DateTimeFormat(Localization.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(item.$createdAt));

  return (
    <View className="flex-row items-center p-2">
      <Image
        source={{ uri: item.userCollections.avatar }} // Lấy avatar từ userCollections
        className="w-10 h-10 rounded-full ml-0" // Đặt ml-0 để avatar ở sát lề trái
      />
      <View className="ml-2">
        <View className="flex-row items-center">
            <Text className="font-bold text-lightgray-500">{item.userCollections.username}</Text>
            <Text className="text-lightgray-500 font-normal text-xs ml-2 italic">
              {formattedDate}
            </Text>
        </View>
        <Text className="text-lightgray-500">{item.comment}</Text>
      </View>
    </View>
  );
};

export default CommentItem;