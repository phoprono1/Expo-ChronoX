import React, { useEffect, useState, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { ResizeMode, Video } from "expo-av"; // Import Video từ expo-av
import RenderHTML from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons

interface PostCardProps {
  avatar: string;
  username: string;
  email: string;
  mediaUri: string[]; // Đổi thành mảng để hỗ trợ nhiều media
  title: string;
  hashtags: string[];
  likes: number;
  comments: number;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  showMoreOptionsIcon?: boolean; // Thêm thuộc tính này
}

const PostCard: React.FC<PostCardProps> = ({
  avatar,
  username,
  email,
  mediaUri,
  title,
  hashtags,
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  showMoreOptionsIcon = true, // Mặc định là true
}) => {
  const [liked, setLiked] = useState(isLiked); // Trạng thái thích
  const { width: windowWidth } = Dimensions.get("window"); // Lấy chiều rộng màn hình
  const [mediaTypes, setMediaTypes] = useState<string[]>([]); // Lưu trữ loại media

  const textStyle = {
    color: "black",
    fontSize: 18,
  };

  const tagsStyle = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    ul: textStyle,
    li: textStyle,
    h1: textStyle,
    h4: textStyle,
  };

  // Cập nhật trạng thái liked khi isLiked props thay đổi
  useEffect(() => {
    setLiked(isLiked);
  }, [isLiked]);

  const handleLike = async () => {
    setLiked(!liked); // Đảo ngược trạng thái thích
    await onLike(); // Gọi hàm onLike
  };

  const handleShare = () => {
    // Thêm logic chia sẻ ở đây
    onShare();
  };

  const showMoreOptions = () => {
    console.log("Show more options");
  };

  // Hàm kiểm tra MIME type
  const getMimeType = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url, { method: "HEAD" });
      const contentType = response.headers.get("Content-Type");
      return contentType; // Trả về MIME type
    } catch (error) {
      console.error("Lỗi khi lấy MIME type:", error);
      return null; // Trả về null nếu có lỗi
    }
  };

  useEffect(() => {
    const checkMediaTypes = async () => {
      const types = await Promise.all(
        mediaUri.map(async (uri) => {
          const mimeType = await getMimeType(uri);
          return mimeType?.startsWith("video/") ? "video" : "image";
        })
      );
      setMediaTypes(types);
    };

    checkMediaTypes();
  }, [mediaUri]);

  const renderMedia = (item: string, index: number) => {
    return (
      <View className="h-80 w-80 mr-6 ml-4 overflow-hidden flex-1">
        {mediaTypes[index] === "video" ? ( // Kiểm tra nếu là video
          <Video
            source={{ uri: item }}
            style={{ borderRadius: 10 }} // Bo góc video
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false} // Có thể thay đổi thành true nếu bạn muốn video lặp lại
            className="h-full w-full max-w-full"
          />
        ) : (
          <Image
            source={{ uri: item }}
            style={{ borderRadius: 10 }} // Bo góc ảnh
            contentFit="cover"
            className="h-full w-full max-w-full"
          />
        )}
      </View>
    );
  };

  const renderSingleMedia = (item: string) => {
    return (
      <View className="h-80 w-full">
        {mediaTypes[0] === "video" ? ( // Kiểm tra nếu là video
          <Video
            source={{ uri: item }}
            style={{ borderRadius: 10 }} // Bo góc video
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            className="h-full w-full"
          />
        ) : (
          <Image
            source={{ uri: item }}
            style={{ borderRadius: 10 }} // Bo góc ảnh
            contentFit="cover"
            className="h-full w-full"
          />
        )}
      </View>
    );
  };

  const renderMultipleMedia = () => {
    return (
      <FlatList
        horizontal={true}
        data={mediaUri}
        renderItem={({ item, index }) => renderMedia(item, index)}
        keyExtractor={(item) => item} // Sử dụng URI làm key
        showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
        nestedScrollEnabled={true}
      />
    );
  };

  const RenderHTMLMemo = memo(({ html }: { html: string }) => (
    <RenderHTML
      contentWidth={Dimensions.get("window").width}
      source={{ html }}
      tagsStyles={tagsStyle}
    />
  ));

  return (
    <View className="bg-white rounded-lg shadow-sm overflow-hidden w-full p-2">
      <View className="flex-row items-center p-2">
        <Image
          source={{ uri: avatar }}
          className="w-10 h-10 rounded-full ml-0" // Đặt ml-0 để avatar ở sát lề trái
        />
        <View className="ml-2">
          <Text className="font-bold text-lightgray-500">{username}</Text>
          <Text className="text-lightgray-500">{email}</Text>
        </View>
        {showMoreOptionsIcon && (
          <Pressable className="ml-auto" onPress={showMoreOptions}>
            <Ionicons name="ellipsis-horizontal" size={24} color="black" />
          </Pressable>
        )}
      </View>

      {mediaUri.length > 0 && ( // Kiểm tra nếu mảng mediaUri không rỗng
        <View>
          {mediaUri.length === 1 // Nếu chỉ có 1 media, hiển thị trực tiếp
            ? renderSingleMedia(mediaUri[0])
            : renderMultipleMedia() // Hiển thị nhiều media
          }
        </View>
      )}

      <View className="p-2 rounded opacity-80">
        <View className="mt-2">
          <RenderHTMLMemo html={title} />
        </View>
        <Text className="text-black text-base">
          {hashtags.map((tag) => `#${tag}`).join(" ")}
        </Text>
      </View>

      <View className="flex-row justify-start mt-2">
        <TouchableOpacity
          onPress={handleLike}
          className="flex flex-row items-center mr-4" // Thêm margin-right để tạo khoảng cách
        >
          <Ionicons
            name={liked ? "heart-sharp" : "heart-outline"}
            size={20}
            color="red"
          />
          <Text className="text-red-500 ml-1">{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onComment}
          className="flex flex-row items-center mr-4" // Thêm margin-right để tạo khoảng cách
        >
          <Ionicons name="chatbox-ellipses-outline" size={20} color="black" />
          <Text className="text-slate-600 ml-1">{comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShare}
          className="flex flex-row items-center"
        >
          <Ionicons name="share-social-outline" size={20} color="#475569" />
          <Text className="text-slate-600 ml-1"></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
