import {
  SafeAreaView,
  View,
  RefreshControl,
  Text,
  FlatList,
  Share,
  TouchableOpacity,
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

import { account, client } from "@/constants/AppwriteClient";
import { getUserById } from "@/constants/AppwriteUser";
import {
  fetchPostById,
  fetchPostByStatisticsId,
  fetchPostsFirst,
  fetchPostsNext,
  getPostStatistics,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";
import { config } from "@/constants/Config";
import { getFile, getFileDownload } from "@/constants/AppwriteFile";

const Home = () => {
  const { isVisible } = useBottomSheet();
  const scale = useSharedValue(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { openBottomSheet } = useBottomSheet();
  const loadCurrentUserId = async () => {
    try {
      const currentAccount = await account.get();
      const currentUserId = await getUserById(currentAccount.$id);
      setCurrentUserId(currentUserId.$id);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  useEffect(() => {
    if (currentUserId) {
      console.log("currentUserId đã được thiết lập:", currentUserId);
      loadPosts(); // Gọi loadPosts khi currentUserId đã được thiết lập
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [currentUserId]);

  const loadPosts = async () => {
    console.log("currentUserId hiện tại: ", currentUserId);
    if (!currentUserId) loadCurrentUserId(); // Kiểm tra xem currentUserId đã được lấy chưa
    setLoading(true);
    try {
      const fetchedPosts = await fetchPostsFirst(limit);
      const postsWithUserInfo = await Promise.all(
        fetchedPosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, currentUserId ?? "");
          const statisticsPost = (await getPostStatistics(post.$id)) || 0;
          return {
            ...post,
            userInfo,
            isLiked: liked,
            likes: statisticsPost.likes || 0,
            comments: statisticsPost.comments || 0,
          };
        })
      );
      setPosts(postsWithUserInfo);
      setLastID(
        fetchedPosts.length > 0
          ? fetchedPosts[fetchedPosts.length - 1].$id
          : null
      );
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (!currentUserId || loadingNext || !lastID) return;
    setLoadingNext(true);
    try {
      const fetchedPosts = await fetchPostsNext(lastID, limit);
      const uniquePosts = fetchedPosts.documents.filter(
        (post) => !posts.some((existingPost) => existingPost.$id === post.$id)
      );
      const postsWithUserInfo = await Promise.all(
        uniquePosts.map(async (post) => {
          const userInfo = await getUserById(post.accountID.accountID);
          const liked = await isPostLiked(post.$id, currentUserId);
          const statisticsPost = await getPostStatistics(post.$id);
          return {
            ...post,
            userInfo,
            isLiked: liked,
            likes: statisticsPost.likes || 0,
            comments: statisticsPost.comments || 0,
          };
        })
      );
      setPosts((prevPosts) => [...prevPosts, ...postsWithUserInfo]);
      setLastID(
        uniquePosts.length > 0 ? uniquePosts[uniquePosts.length - 1].$id : null
      );
    } catch (error) {
      console.error("Lỗi khi tải thêm bài viết:", error);
    } finally {
      setLoadingNext(false);
    }
  };

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.postCollectionId}.documents`,
      async (response) => {
        console.log("Bài viết mới đã được tạo:", response.payload);
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng

        console.log("payload:", payload);
        const newPostId = payload.$id; // Lấy $id từ payload
        console.log("ID bài viết mới:", newPostId);

        // Lấy thông tin bài viết mới
        const newPost = await fetchPostById(newPostId); // Gọi hàm để lấy thông tin bài viết mới

        // Lấy thông tin người dùng từ accountID
        const userInfo = await getUserById(newPost.accountID.accountID); // Hàm này cần được tạo để lấy thông tin người dùng
        const liked = await isPostLiked(newPost.$id, currentUserId ?? "");
        const statisticsPost = (await getPostStatistics(newPost.$id)) || 0;

        // Kết hợp thông tin bài viết và người dùng
        const postWithUserInfo = {
          ...newPost,
          userInfo, // Thêm thông tin người dùng vào bài viết
          isLiked: liked,
          likes: statisticsPost.likes || 0,
          comments: statisticsPost.comments || 0,
        };

        setPosts((prevPosts) => [postWithUserInfo, ...prevPosts]); // Thêm bài viết mới vào đầu danh sách
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe_like_comment = client.subscribe(
      `databases.${config.databaseId}.collections.${config.statisticsPostCollectionId}.documents`,
      async (response) => {
        console.log("Thông tin bài viết mới đã được cập nhật:", response.payload);
        const payload = JSON.parse(JSON.stringify(response.payload)); // Chuyển đổi payload về đối tượng
  
        // Lấy ID bài viết từ payload
        const statisticsPostId = payload.$id;
        const postId = await fetchPostByStatisticsId(statisticsPostId);
        console.log("ID bài viết:", postId.$id);
        const updatedLikes = payload.likes; // Giả sử payload chứa số lượng likes mới
        const updatedComments = payload.comments; // Giả sử payload chứa số lượng comments mới
        console.log("số lượng likes:", updatedLikes);
        console.log("số lượng comments:", updatedComments);
  
        // Kiểm tra currentUserId trước khi tiếp tục
        if (!currentUserId) {
          console.log("currentUserId chưa được thiết lập.");
          return; // Dừng lại nếu currentUserId chưa có giá trị
        }
  
        // Cập nhật số lượng likes cho bài viết tương ứng
        console.log("ID bài viết nào đó:", postId.$id);
        const liked = await isPostLiked(postId.$id, currentUserId);
        console.log("Đã like chưa:", liked);
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.$id === postId.$id ? { ...post, likes: updatedLikes, comments: updatedComments, isLiked: liked } : post
          )
        );
      }
    );
  
    return () => {
      unsubscribe_like_comment();
    };
  }, [currentUserId]); // Thêm currentUserId vào dependency array

  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.8 : 1, { duration: 200 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleLike = async (postId: string, index: number) => {
    const post = posts[index];
    const newLikesCount = post.isLiked ? post.likes - 1 : post.likes + 1; // Cập nhật số lượng likes
    const statisticsPost = await getPostStatistics(postId);
    console.log("số lượng likes:", statisticsPost.likes);

    await toggleLikePost(postId, currentUserId ?? "");

    // Cập nhật trạng thái liked và số lượng likes trong state
    setPosts((prevPosts) =>
      prevPosts.map((p, i) =>
        i === index ? { ...p, isLiked: !post.isLiked, likes: newLikesCount } : p
      )
    );

    console.log("Liked post with ID:", postId);
  };

  // Tạo hàm handleComment
  const handleComment = (postId: string) => {
    openBottomSheet("comment", postId); // Mở modal bình luận và truyền postId
    console.log("Commented on post with ID:", postId);
  };
  // Hàm chia sẻ file
  const handleShareFile = async (
    fileUrl: string | string[],
    fileExtension: string,
    fileIds: string[],
    title: string
  ) => {
    console.log("fileUrl:", fileUrl);
    try {
      if (Array.isArray(fileUrl)) {
        fileUrl = fileUrl[0];
      }

      if (typeof fileUrl !== "string") {
        throw new Error("URL không hợp lệ");
      }

      // Tải file về
      const downloadResponse = await getFileDownload(fileIds[0]); // Giả sử hàm này trả về một đối tượng chứa đường dẫn tệp
      const localFilePath =
        downloadResponse.href || downloadResponse.toString(); // Lấy đường dẫn tệp đã tải về
      console.log("localFilePath:", localFilePath);

      // Chia sẻ file
      await Share.share({
        url: localFilePath, // Sử dụng đường dẫn tệp đã tải về
        message: title,
        title: `Chia sẻ tệp: ${fileUrl.split("/").pop()}`, // Tên tệp từ URL
      });
    } catch (error) {
      console.error("Lỗi khi chia sẻ file:", error);
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <Animated.View
      style={animatedStyle}
      className="flex-1 p-1 w-full bg-white border-2 border-gray-300 rounded-3xl mb-5 shadow-md"
      key={item.$id}
    >
      <TouchableOpacity
        onPress={() => {
          handleComment(item.$id);
        }}
        activeOpacity={0.7}
      >
        <PostCard
          avatar={item.userInfo?.avatar || ""}
          username={item.userInfo?.username || "Unknown User"}
          email={item.userInfo?.email || "No Email"}
          mediaUri={item.mediaUri}
          title={item.title}
          hashtags={item.hashtags}
          likes={item.likes}
          comments={item.comments}
          isLiked={item.isLiked}
          onLike={() => handleLike(item.$id, index)} // Gọi hàm handleLike
          onComment={() => handleComment(item.$id)}
          onShare={() =>
            handleShareFile(
              item.mediaUri,
              item.fileExtension,
              item.fileIds,
              item.title
            )
          }
          showMoreOptionsIcon={true}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-white m-2">
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
              <RefreshControl onRefresh={loadPosts} refreshing={loading} />
            }
            ListEmptyComponent={<Text>Loading...</Text>}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingNext ? <Text>Đang tải thêm...</Text> : null
            }
          />
        </SafeAreaView>
      </BlurView>
    </View>
  );
};

export default Home;
