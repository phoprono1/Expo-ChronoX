import {
  SafeAreaView,
  View,
  RefreshControl,
  Text,
  FlatList, // Thay thế ScrollView bằng FlatList
} from "react-native";
import React, { useEffect, useState } from "react";
import PostCard from "@/components/cards/PostCard"; // Import component PostCard
import { useBottomSheet } from "@/hooks/BottomSheetProvider"; // Import useBottomSheet
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  client,
  config,
  fetchPosts,
  getUserById,
} from "@/constants/appwriteConfig";

const Home = () => {
  const { isVisible } = useBottomSheet(); // Lấy hàm và isVisible từ context
  const scale = useSharedValue(1); // Khởi tạo giá trị chia sẻ cho kích thước
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await fetchPosts(); // Gọi hàm fetchPosts
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID); // Lấy thông tin người dùng
          return {
            ...post,
            userInfo, // Thêm thông tin người dùng vào bài viết
          };
        })
      );
      setPosts(postsWithUserInfo); // Cập nhật state với danh sách bài viết
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setLoading(false); // Đặt loading thành false sau khi hoàn thành
    }
  };

  useEffect(() => {
    loadPosts();

    // Lắng nghe sự kiện realtime
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      (response) => {
        console.log("Bài viết mới đã được tạo 123:", response.payload);
        loadPosts(); // Tải lại danh sách bài viết khi có bài viết mới
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
    };
  }, []);

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

  const renderItem = ({ item }: { item: any }) => (
    <Animated.View
      className="flex-1 p-1 w-full bg-white border-2 border-gray-300 rounded-3xl mb-5 shadow-md" // Thêm padding dưới cùng
      key={item.$id}
    >
      <PostCard
        avatar={item.userInfo?.avatar || ""} // Sử dụng avatar từ thông tin người dùng
        username={item.userInfo?.username || "Unknown User"} // Sử dụng username từ thông tin người dùng
        email={item.userInfo?.email || "No Email"} // Sử dụng email từ thông tin người dùng
        mediaUri={item.mediaUri}
        title={item.title}
        hashtags={item.hashtags}
        onLike={() => console.log("Liked!")}
        onComment={() => console.log("Commented!")}
      />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-white">
      <BlurView
        intensity={90}
        tint="light"
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      >
        <SafeAreaView className="flex-1">
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.$id} // Sử dụng $id làm key
            refreshControl={
              <RefreshControl
                onRefresh={loadPosts} // Gọi lại hàm loadPosts khi refresh
                refreshing={loading}
              />
            }
            ListEmptyComponent={<Text>Loading...</Text>} // Hiển thị loading nếu không có bài viết
          />
        </SafeAreaView>
      </BlurView>
    </View>
  );
};

export default Home;
