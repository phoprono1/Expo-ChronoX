import { View } from 'react-native';
import React from 'react';
import PostCard from '@/components/cards/PostCard'; // Import component PostCard
import { useBottomSheet } from '@/hooks/BottomSheetProvider'; // Import useBottomSheet
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const Home = () => {
  const { isVisible } = useBottomSheet(); // Lấy hàm và isVisible từ context
  const scale = useSharedValue(1); // Khởi tạo giá trị chia sẻ cho kích thước

  // Cập nhật giá trị scale khi isVisible thay đổi
  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.8 : 1, { duration: 200 }); // Thay đổi kích thước với hiệu ứng
  }, [isVisible]);

  // Tạo kiểu động cho PostCard
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View className="flex-1 bg-white p-4">
      <Animated.View style={animatedStyle}>
        <PostCard 
          avatar="https://picsum.photos/200" 
          username="Nguyễn Văn A" 
          email="nguyenvana@example.com" 
          mediaUri="https://picsum.photos/200" 
          title="Tiêu đề bài viết" 
          hashtags={['#hashtag1', '#hashtag2']} 
          onLike={() => console.log('Liked!')} 
          onComment={() => console.log('Commented!')} 
        />
      </Animated.View>
    </View>
  );
};

export default Home;