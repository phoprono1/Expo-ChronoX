import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

interface PostCardProps {
  avatar: string;
  username: string;
  email: string;
  mediaUri: string; // Đường dẫn đến ảnh hoặc video
  title: string;
  hashtags: string[];
  onLike: () => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ avatar, username, email, mediaUri, title, hashtags, onLike, onComment }) => {
  const [liked, setLiked] = useState(false); // Trạng thái thích
  const [showInfo, setShowInfo] = useState(true); // Trạng thái hiển thị thông tin

  const handleLike = () => {
    setLiked(!liked); // Đảo ngược trạng thái thích
    onLike(); // Gọi hàm onLike
  };

  const handleImagePress = () => {
    setShowInfo(!showInfo); // Đảo ngược trạng thái hiển thị thông tin
  };

  return (
    <View className="bg-white rounded-lg shadow-sm p-4 overflow-hidden border-2 border-gray-300 w-full">
      {/* Phần hiển thị ảnh hoặc video */}
      <View className="h-80 rounded-lg overflow-hidden mb-2 relative">
        <TouchableOpacity onPress={handleImagePress}>
          <Image source={{ uri: mediaUri }} className="w-full h-full" resizeMode="cover" />
        </TouchableOpacity>
        
        {/* Phần thông tin người dùng */}
        {showInfo && (
          <BlurView intensity={50} tint="light" style={[styles.blurContainer, { position: 'absolute', top: 1, left: 1, flexDirection: 'row', alignItems: 'center' }]}>
            <Image source={{ uri: avatar }} className="w-10 h-10 rounded-full ml-2" />
            <View style={{ marginLeft: 8 }}>
              <Text className="font-bold text-lightgray-500">{username}</Text>
              <Text className="text-lightgray-500">{email}</Text>
            </View>
          </BlurView>
        )}

        {/* Phần thông tin bài viết */}
        {showInfo && (
          <BlurView intensity={50} tint="light" style={[styles.blurContainer, { position: 'absolute', bottom: 1, right: 1 }]}>
            <View className="p-2 rounded opacity-80">
              <Text className="font-bold text-base text-slate-50">{title}</Text>
              <Text className="text-white text-sm">{hashtags.join(' ')}</Text>
            </View>
          </BlurView>
        )}
      </View>

      {/* Phần thích và bình luận tách ra với icon */}
      <View className="flex-row justify-between mt-2">
        <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={liked ? "heart-sharp" : "heart-outline"} size={20} color="red" />
          <Text className="text-red-500 ml-1">Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onComment} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="chatbubble" size={20} color="#475569" />
          <Text className="text-slate-600 ml-1">Bình luận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    blurContainer: {
        flex: 1,
        padding: 2,
        margin: 4,
        textAlign: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 15,
      },
})

export default PostCard;