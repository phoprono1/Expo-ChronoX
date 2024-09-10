import {
  SafeAreaView,
  View,
  RefreshControl,
  Text,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import PostCard from "@/components/cards/PostCard";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  client,
  config,
  fetchPostsFirst,
  fetchPostsNext,
  getUserById,
} from "@/constants/appwriteConfig";

const Home = () => {
  const { isVisible } = useBottomSheet();
  const scale = useSharedValue(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await fetchPostsFirst(limit);
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          return {
            ...post,
            userInfo,
          };
        })
      );
      setPosts(postsWithUserInfo);
      setLastID(fetchedPosts.length > 0 ? fetchedPosts[fetchedPosts.length - 1].$id : null);
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (loadingNext || !lastID) return;
    setLoadingNext(true);
    try {
      const fetchedPosts = await fetchPostsNext(lastID, limit);
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.documents.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          return {
            ...post,
            userInfo,
          };
        })
      );
      setPosts((prevPosts) => [...prevPosts, ...postsWithUserInfo]);
      setLastID(fetchedPosts.documents.length > 0 ? fetchedPosts.documents[fetchedPosts.documents.length - 1].$id : null);
    } catch (error) {
      console.error("Lỗi khi tải thêm bài viết:", error);
    } finally {
      setLoadingNext(false);
    }
  };

  useEffect(() => {
    loadPosts();

    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      (response) => {
        console.log("Bài viết mới đã được tạo:", response.payload);
        loadPosts();
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.8 : 1, { duration: 200 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderItem = ({ item }: { item: any }) => (
    <Animated.View
      className="flex-1 p-1 w-full bg-white border-2 border-gray-300 rounded-3xl mb-5 shadow-md"
      key={item.$id}
    >
      <PostCard
        avatar={item.userInfo?.avatar || ""}
        username={item.userInfo?.username || "Unknown User"}
        email={item.userInfo?.email || "No Email"}
        mediaUri={item.mediaUri}
        title={item.title}
        hashtags={item.hashtags}
        onLike={() => console.log("Liked!")}
        onComment={() => console.log("Commented!")}
        onShare={() => console.log("Shared!")}
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
            keyExtractor={(item) => item.$id}
            refreshControl={
              <RefreshControl
                onRefresh={loadPosts}
                refreshing={loading}
              />
            }
            ListEmptyComponent={<Text>Loading...</Text>}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingNext ? <Text>Đang tải thêm...</Text> : null}
          />
        </SafeAreaView>
      </BlurView>
    </View>
  );
};

export default Home;