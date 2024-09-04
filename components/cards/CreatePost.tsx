import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert, // Thêm Alert để hiển thị modal
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createPost } from "@/constants/appwriteConfig"; // Import phương thức createPost
import { useBottomSheet } from '@/hooks/BottomSheetProvider'; // Import useBottomSheet

interface CreatePostProps {
  onPost: (post: {
    description: string;
    mediaUri: string;
    hashtags: string[];
  }) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPost }) => {
  useBottomSheet(); // Lấy hàm closeBottomSheet từ context
  const [description, setDescription] = useState<string>("");
  const [mediaUri, setMediaUri] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!description.trim()) { // Kiểm tra nếu mô tả trống
      Alert.alert("Thông báo", "Không được để mô tả trống!"); // Hiển thị modal thông báo
      return;
    }

    try {
      // Gọi phương thức createPost để lưu bài viết
      await createPost(mediaUri, description, hashtags.split(",").map((tag) => tag.trim()));
      // Reset fields
      setDescription("");
      setMediaUri("");
      setHashtags("");
      onPost({ description, mediaUri, hashtags: hashtags.split(",").map((tag) => tag.trim()) });
    } catch (error) {
      console.error("Lỗi khi tạo bài viết:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <View className="flex-1 p-4 bg-white">
        <Text className="text-lg mb-4">Tạo bài viết</Text>
        <TextInput
          placeholder="Mô tả"
          className="border p-2 mb-4"
          value={description}
          onChangeText={setDescription}
        />
        <TouchableOpacity
          onPress={handleImagePicker}
          className="border p-2 mb-4"
        >
          <Text>Chọn ảnh hoặc video</Text>
        </TouchableOpacity>
        {mediaUri ? (
          <Image
            source={{ uri: mediaUri }}
            style={{ width: "100%", height: 200 }}
          />
        ) : null}
        <TextInput
          placeholder="Hashtags (cách nhau bằng dấu phẩy)"
          className="border p-2 mb-4"
          value={hashtags}
          onChangeText={setHashtags}
        />
        <Button title="Đăng bài" onPress={handlePost} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreatePost;
