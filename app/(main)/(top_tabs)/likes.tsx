import { View, Text, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getUserLikedPosts } from '@/constants/AppwritePost';
import { useDispatch, useSelector } from 'react-redux';
import LikedPostItem from '@/components/cards/LikedPostItem'; // Import component mới
import { setMinimized } from '@/store/minimizeSlice';

const Likes = () => {
  const user = useSelector((state: any) => state.user); // Lấy trạng thái người dùng từ Redux
  const dispatch = useDispatch();
  const [likedPosts, setLikedPosts] = useState<any[]>([]); // Khởi tạo state để lưu bài viết yêu thích

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      dispatch(setMinimized(true)); // Cập nhật trạng thái isMinimized
    } else {
      dispatch(setMinimized(false));
    }
  };

  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        const posts = await getUserLikedPosts(user.userId); // Chờ cho Promise hoàn thành
        setLikedPosts(posts.documents); // Cập nhật state với danh sách bài viết yêu thích
      } catch (error) {
        console.error("Lỗi khi lấy bài viết yêu thích:", error);
      }
    };

    fetchLikedPosts(); // Gọi hàm để lấy bài viết yêu thích
  }, [user.userId]);

  return (
    <View className="bg-white flex-1">
      {likedPosts.length > 0 ? (
        <ScrollView onScroll={handleScroll} scrollEventThrottle={16}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {likedPosts.map((item) => (
              <LikedPostItem 
                key={item.postCollections.$id} 
                postId={item.postCollections.$id} 
                fileId={item.postCollections.fileIds[0]} // Lấy mediaUri đầu tiên
              />
            ))}
          </View>
        </ScrollView>
      ) : (
        <Text>Đang tải...</Text> // Hiển thị thông báo đang tải
      )}
    </View>
  );
}

export default Likes;