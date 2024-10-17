import {
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { getCurrentUserId, getUserById } from "@/constants/AppwriteUser";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { account } from "@/constants/AppwriteClient";
import {
  fetchUserPostsFirst,
  fetchUserPostsNext,
  getPostStatistics,
  isPostLiked,
  toggleLikePost,
} from "@/constants/AppwritePost";
import PostCard from "@/components/cards/PostCard"; // Import component PostCard
import DisplayAvatar from "@/components/cards/UserProfile";
import { useDispatch, useSelector } from "react-redux";
import { setMinimized } from "@/store/minimizeSlice";
import { getFileDownload } from "@/constants/AppwriteFile";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";

const Index = () => {
  // Sử dụng kiểu đã định nghĩa
  const scale = useSharedValue(1);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastID, setLastID] = useState<string | null>(null);
  const [limit, setLimit] = useState(3);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dispatch = useDispatch();
  const isMinimized = useSelector((state: any) => state.minimize.isMinimized); // Lấy trạng thái isMinimized từ Redux
  const { openBottomSheet } = useBottomSheet();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 100) {
      dispatch(setMinimized(true)); // Cập nhật trạng thái isMinimized
    } else {
      dispatch(setMinimized(false));
    }
  };

  const loadCurrentUserId = async () => {
    try {
      const currentAccount = await account.get();
      const currentUserId = await getCurrentUserId(currentAccount.$id);
      setCurrentUserId(currentUserId);
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
    if (!currentUserId) return; // Dừng lại nếu currentUserId chưa có giá trị
    setLoading(true);
    try {
      const fetchedPosts = await fetchUserPostsFirst(currentUserId, limit);
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
      const fetchedPosts = await fetchUserPostsNext(
        currentUserId,
        lastID,
        limit
      );
      console.log("Sự kiện load thêm post đã được kích hoạt 1:", fetchedPosts);
      const uniquePosts = fetchedPosts.filter(
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
  
      // Log postsWithUserInfo để kiểm tra
      console.log("Posts with user info:", postsWithUserInfo);
  
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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

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
      className="flex-1 p-1 w-full bg-white border-2 border-gray-300 rounded-3xl mb-10 shadow-md"
      key={item.$id}
    >
      <PostCard
        avatar={item.userInfo?.avatar || ""}
        username={item.userInfo?.username || "Unknown User"}
        email={item.userInfo?.email || "No Email"}
        fileIds={item.fileIds}
        title={item.title}
        hashtags={item.hashtags}
        likes={item.likes}
        comments={item.comments}
        isLiked={item.isLiked}
        onUserInfoPress={() => {}}
        onLike={() => handleLike(item.$id, index)} // Gọi hàm handleLike
        onTitlePress={() => handleComment(item.$id)}
        onHashtagPress={() => {}}
        onComment={() => handleComment(item.$id)}
        onShare={() =>
          handleShareFile(
            item.mediaUri,
            item.fileExtension,
            item.fileIds,
            item.title
          )
        }
        showMoreOptionsIcon={false}
      />
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <SafeAreaView className="flex-1 mb-16 mt-2">
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.$id}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingNext ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : null
            }
            style={{ flex: 1 }}
            scrollEventThrottle={16}
            onScroll={handleScroll} // Thêm sự kiện cuộn
          />
        </SafeAreaView>
      )}
      <View className="mb-24"></View>
    </SafeAreaView>
  );
};

export default Index;
