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
  onLike: () => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  avatar,
  username,
  email,
  mediaUri,
  title,
  hashtags,
  onLike,
  onComment,
}) => {
  const [liked, setLiked] = useState(false); // Trạng thái thích
  const { width: windowWidth } = Dimensions.get("window"); // Lấy chiều rộng màn hình
  const adjustedWidth = windowWidth - 28; // Trừ đi 2px
  const [mediaTypes, setMediaTypes] = useState<string[]>([]); // Lưu trữ loại media

  const textStyle = {
    color: 'black',
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

  const handleLike = () => {
    setLiked(!liked); // Đảo ngược trạng thái thích
    onLike(); // Gọi hàm onLike
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
      const types = await Promise.all(mediaUri.map(async (uri) => {
        const mimeType = await getMimeType(uri);
        return mimeType?.startsWith("video/") ? "video" : "image";
      }));
      setMediaTypes(types);
    };

    checkMediaTypes();
  }, [mediaUri]);

  const renderMedia = (item: string, index: number) => {
    return (
      <View style={{ width: adjustedWidth, height: 200, marginRight: 10 }}>
        {mediaTypes[index] === "video" ? ( // Kiểm tra nếu là video
          <Video
            source={{ uri: item }}
            style={{ width: "100%", height: "100%", borderRadius: 10 }} // Bo góc video
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false} // Có thể thay đổi thành true nếu bạn muốn video lặp lại
          />
        ) : (
          <Image
            source={{ uri: item }}
            style={{ width: "100%", height: "100%", borderRadius: 10 }} // Bo góc ảnh
            contentFit="cover"
          />
        )}
      </View>
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
        <Pressable className="ml-auto">
          <Ionicons name="ellipsis-horizontal" size={24} color="black" />
        </Pressable>
      </View>

      {mediaUri.length > 0 && ( // Kiểm tra nếu mảng mediaUri không rỗng
        <View>
          {mediaUri.length === 1 ? ( // Nếu chỉ có 1 media, hiển thị trực tiếp
            renderMedia(mediaUri[0], 0)
          ) : (
            <FlatList
              horizontal
              data={mediaUri}
              renderItem={({ item, index }) => renderMedia(item, index)}
              keyExtractor={(item) => item} // Sử dụng URI làm key
              showsHorizontalScrollIndicator={false} // Ẩn thanh cuộn ngang
            />
          )}
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

      <View className="flex-row justify-between mt-2">
        <TouchableOpacity
          onPress={handleLike}
          className="flex flex-row items-center"
        >
          <Ionicons
            name={liked ? "heart-sharp" : "heart-outline"}
            size={20}
            color="red"
          />
          <Text className="text-red-500 ml-1">Thích</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onComment}
          className="flex flex-row items-center"
        >
          <Ionicons name="chatbubble" size={20} color="#475569" />
          <Text className="text-slate-600 ml-1">Bình luận</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostCard;
