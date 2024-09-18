import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator"; // Import ImageManipulator
import RichTextEditor from "../RichTextEditor";
import MediaPreview from "../MediaPreview"; // Import component MediaPreview
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { createPost } from "@/constants/AppwritePost";

interface CreatePostProps {
  onPost: (post: {
    description: string;
    mediaUri: string[];
    hashtags: string[];
  }) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPost }) => {
  const [mediaUris, setMediaUris] = useState<string[]>([]); // Đổi thành mảng
  const [hashtags, setHashtags] = useState<string>("");
  const bodyRef = useRef<any>(null);
  const editorRef = useRef<any>(null);
  const router = useRouter();
  const [pressed, setPressed] = useState<boolean>(false); // Khởi tạo pressed

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 1,
      allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
    });

    if (!result.canceled) {
      const newUris = await Promise.all(
        result.assets.map(async (asset) => {
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1000 } }], // Giảm chiều rộng xuống 1000px
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } // Nén ảnh
          );
          return manipResult.uri; // Trả về URI đã nén
        })
      );

      setMediaUris((prev) => [...prev, ...newUris]); // Cập nhật mảng mediaUris
    }
  };

  const handleVideoPicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setMediaUris((prev) => [...prev, uri]); // Thêm URI video vào mảng
    }
  };

  const extractHashtags = (text: string) => {
    const regex = /#\w+/g; // Tìm tất cả các từ bắt đầu bằng #
    const foundHashtags = text.match(regex);
    return foundHashtags ? foundHashtags.map((tag) => tag.substring(1)) : []; // Trả về mảng các hashtags mà không có dấu #
  };

  const removeHashtagsFromDescription = (text: string) => {
    return text.replace(/#\w+\s*/g, ""); // Loại bỏ các từ bắt đầu bằng # và khoảng trắng theo sau
  };

  const handlePost = async () => {
    const description = bodyRef.current; // Lấy nội dung từ RichTextEditor

    if (!description.trim()) {
      // Kiểm tra nếu mô tả trống
      Alert.alert("Thông báo", "Không được để mô tả trống!"); // Hiển thị modal thông báo
      return;
    }

    // Trích xuất hashtags từ mô tả
    const extractedHashtags = extractHashtags(description);
    setHashtags(extractedHashtags.join(", ")); // Cập nhật state hashtags

    // Loại bỏ hashtags khỏi mô tả
    const cleanedDescription = removeHashtagsFromDescription(description);

    try {
      // Gọi phương thức createPost để lưu bài viết
      await createPost(
        mediaUris, // Gửi mảng mediaUris
        cleanedDescription, // Sử dụng mô tả đã loại bỏ hashtags
        extractedHashtags // Sử dụng hashtags đã trích xuất
      );

      // Reset fields
      setMediaUris([]); // Đặt lại mảng mediaUris
      setHashtags("");
      onPost({
        description: cleanedDescription,
        mediaUri: mediaUris, // Gửi mảng mediaUris
        hashtags: extractedHashtags,
      });
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
    }
  };

  const removeMedia = (uri: string) => {
    setMediaUris((prev) => prev.filter((mediaUri) => mediaUri !== uri)); // Xóa URI khỏi mảng
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 p-4 bg-white">
        <Text className="text-center text-2xl font-bold mb-4">
          Tạo bài viết
        </Text>
        <View className="flex-1">
          <RichTextEditor
            editorRef={editorRef}
            onChange={(body) => (bodyRef.current = body)}
          />
        </View>
        {mediaUris.length > 0 ? ( // Kiểm tra nếu có media
          <ScrollView horizontal className="mt-4" showsHorizontalScrollIndicator={false}>
            {mediaUris.map((uri, index) => (
              <View key={index} className="w-40 h-full mr-4">
                <MediaPreview mediaUri={uri} />
                <Pressable
                  onPress={() => removeMedia(uri)} // Gọi hàm xóa khi nhấn nút
                  style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'red', borderRadius: 15, padding: 5 }}
                >
                  <Ionicons name="trash-outline" size={20} color="white" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        <View className="flex-row items-center mt-4 border-2 border-gray-300 rounded-3xl p-4">
          <Text className="text-lg font-bold flex-1">Thêm ảnh hoặc video</Text>
          <TouchableOpacity
            onPress={handleImagePicker}
            className="flex-none ml-auto mr-4"
          >
            <Ionicons name="image-outline" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleVideoPicker}
            className="flex-none ml-auto mr-4"
          >
            <Ionicons name="videocam-outline" size={30} color="black" />
          </TouchableOpacity>
        </View>

        <Pressable
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          onPress={handlePost}
          className={`bg-blue-500 p-2 rounded-3xl mt-4 w-1/2 items-center justify-center mx-auto ${
            pressed ? "opacity-70" : "opacity-100"
          }`}
        >
          <Text className="text-white text-lg font-bold">Đăng bài</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreatePost;