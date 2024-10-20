import { View, Text } from 'react-native';
import React from 'react';
import { useBottomSheet } from '@/hooks/BottomSheetProvider'; // Import useBottomSheet
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const Search = () => {
  const { isVisible } = useBottomSheet(); // Lấy trạng thái từ context
  const scale = useSharedValue(1); // Khởi tạo giá trị chia sẻ cho kích thước

  // Cập nhật giá trị scale khi isVisible thay đổi
  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.9 : 1, { duration: 300 }); // Thay đổi kích thước với hiệu ứng
  }, [isVisible]);

  // Tạo kiểu động cho Text
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.Text style={animatedStyle}>search</Animated.Text>
    </SafeAreaView>
  );
};

export default Search;