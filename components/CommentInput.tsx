import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import PostCard from "./cards/PostCard";
import {
  fetchPostById,
  isPostLiked,
  getPostStatistics,
  toggleLikePost,
  createComment,
  getCommentsByPostId,
} from "@/constants/AppwritePost"; // Import hàm để lấy bài viết
import { getCurrentUserId, getUserById } from "@/constants/AppwriteUser";
import { account, client } from "@/constants/AppwriteClient";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import CommentItem from "./CommentItem";
import { config } from "@/constants/Config";
import CommentInputField from "./CommentInputField";

interface CommentInputProps {
  onSubmit: (comment: string) => void;
  postId: string; // Thêm postId vào props
}

const CommentInput: React.FC<CommentInputProps> = ({ onSubmit, postId }) => {
  const [comment, setComment] = useState("");
  const [postData, setPostData] = useState<any>(null); // State để lưu thông tin bài viết
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false); // State để theo dõi trạng thái bàn phím

  const handleSubmit = async () => {
    if (comment.trim()) {
      await createComment(postId, currentUserId ?? "", comment);
      onSubmit(comment);

      // Cập nhật số lượng bình luận trong postData
      setPostData((prevPostData: any) => ({
        ...prevPostData,
        comments: prevPostData.comments + 1, // Tăng số lượng bình luận lên 1
      }));

      setComment(""); // Reset input
      //tạo hàm đóng keyboard
      Keyboard.dismiss();
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

  // Hàm để lấy thông tin bài viết
  const loadPostData = async () => {
    if (currentUserId == null) {
      loadCurrentUserId();
    }
    try {
      const data = await fetchPostById(postId);
      const userInfo = await getUserById(data.accountID.accountID);
      const liked = await isPostLiked(postId, currentUserId ?? "");
      const statisticsPost = (await getPostStatistics(postId)) || 0;

      // Lấy danh sách bình luận
      const commentResponse = await getCommentsByPostId(postId);
      const commentList = commentResponse.documents || []; // Đảm bảo commentList là một mảng

      setPostData({
        ...data,
        userInfo,
        isLiked: liked,
        likes: statisticsPost.likes || 0,
        comments: statisticsPost.comments || 0,
        commentList, // Lưu commentList vào postData
      });
    } catch (error) {
      console.error("Lỗi khi lấy thông tin bài viết:", error);
    }
  };

  useEffect(() => {
    loadCurrentUserId();
    loadPostData(); // Gọi hàm khi component được khởi tạo
  }, [postId]);

  useEffect(() => {
    if (currentUserId) {
      loadPostData(); // Gọi loadPosts khi currentUserId đã được thiết lập
    } else {
      console.log("currentUserId vẫn là null");
    }
  }, [currentUserId]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true); // Bàn phím hiện ra
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // Bàn phím ẩn
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const subscription = client.subscribe(
      `databases.${config.databaseId}.collections.${config.commentCollectionId}.documents`,
      async (response) => {
        if (!currentUserId) {
          await loadCurrentUserId(); // Đợi cho đến khi currentUserId được thiết lập
        }
        await loadPostData(); // Đảm bảo currentUserId đã có giá trị
      }
    );

    return () => {
      subscription();
    };
  }, [currentUserId]);

  const handleLike = async () => {
    if (!postData) return; // Kiểm tra xem postData có tồn tại không

    try {
      const newLikesCount = postData.isLiked
        ? postData.likes - 1
        : postData.likes + 1; // Cập nhật số lượng likes

      // Gọi hàm để toggle like
      await toggleLikePost(postData.$id, currentUserId ?? "");

      // Cập nhật trạng thái liked và số lượng likes trong state
      setPostData((prevPostData: any) => ({
        ...prevPostData,
        isLiked: !prevPostData.isLiked,
        likes: newLikesCount,
      }));
    } catch (error) {
      console.error("Lỗi khi thích bài viết:", error);
    }
  };

  return (
    <View>
      <ScrollView
        className="p-4 mb-16"
        contentContainerStyle={{ paddingBottom: keyboardVisible ? 310 : 0 }} // Thêm khoảng cách khi bàn phím hiện ra
      >
        {postData ? (
          <>
            <PostCard
              avatar={postData.userInfo?.avatarId || ""}
              username={postData.userInfo?.username || "Unknown User"}
              email={postData.userInfo?.email || "No Email"}
              fileIds={postData.fileIds}
              title={postData.title}
              hashtags={postData.hashtags}
              likes={postData.likes}
              comments={postData.comments}
              isLiked={postData.isLiked}
              onLike={handleLike}
              onTitlePress={() => {}}
              onHashtagPress={() => {}}
              onUserInfoPress={() => {}}
              onComment={() => {}}
              onShare={() => {
                throw new Error("Function not implemented.");
              }}
              showMoreOptionsIcon={false}
            />
            <View
              className={`mt-4 mb-2 gap-4 ${
                postData.mediaUri == null ? "" : "pb-80"
              }`}
            >
              <Text className="text-lg font-bold">Bình luận</Text>
              {postData.commentList.map((comment: any) => (
                <View
                  key={comment.$id} // Đảm bảo rằng mỗi comment có một key duy nhất
                  className={`${
                    postData.commentList.length === 1 ? "pb-20" : ""
                  }`}
                >
                  <CommentItem item={comment} />
                </View>
              ))}
              {postData.commentList.length === 0 && (
                <Text className="text-gray-500 p-20 text-center">
                  Không có bình luận nào
                </Text>
              )}
            </View>
          </>
        ) : (
          <Text>Đang tải dữ liệu...</Text>
        )}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 20}
        className="absolute bottom-0 left-0 right-0 padding-0 bg-white"
      >
        <CommentInputField
          placeholder="Nhập bình luận..."
          value={comment}
          onChangeText={setComment}
          onSubmit={handleSubmit}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default CommentInput;
