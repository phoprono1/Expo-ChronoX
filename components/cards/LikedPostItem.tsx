import { getFileUrl } from "@/constants/AppwriteFile";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

interface LikedPostItemProps {
  postId: string; // ID của bài viết
  fileId: string; // Thay đổi từ mediaUri sang fileId
}

const LikedPostItem: React.FC<LikedPostItemProps> = ({ postId, fileId }) => {
  const [mediaType, setMediaType] = useState<string | null>(null); // Chỉ cần một giá trị cho mediaType
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const { openBottomSheet } = useBottomSheet();


  const getMimeType = async (url: string): Promise<string | null> => {
    if (url == null) {
      return null;
    }
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
    const checkMediaType = async () => {
      const url = getFileUrl(fileId); // Sử dụng getFileUrl để lấy URL đầy đủ
      setMediaUrl(url);
      const mimeType = await getMimeType(url);
      if (mimeType) {
        if (mimeType.startsWith("video/")) {
          setMediaType("video");
        } else if (mimeType.startsWith("image/")) {
          setMediaType("image");
        } else {
          setMediaType(null); // Không hiển thị gì nếu không phải video hoặc image
        }
      }
    };

    checkMediaType();
  }, [fileId]);

  // Tạo hàm handleComment
  const handleComment = (postId: string) => {
    openBottomSheet("comment", postId); // Mở modal bình luận và truyền postId
    console.log("Commented on post with ID:", postId);
  };

  return (
    mediaType ? ( // Chỉ hiển thị nếu mediaType không null
      <View className="m-2 flex flex-row items-center">
        <Text className="hidden">ID: {postId}</Text>
        <TouchableOpacity onPress={() => {
          handleComment(postId);
        }}>
        {mediaType === "video" ? ( // Kiểm tra nếu là video
          <Video
            source={{ uri: mediaUrl!! }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false} // Có thể thay đổi thành true nếu bạn muốn video lặp lại
            className="h-24 w-24 rounded-lg"
          />
        ) : (
          <Image
            source={{ uri: mediaUrl!! }}
            resizeMode="cover"
            className="h-24 w-24 rounded-lg"
          />
        )}
      </TouchableOpacity>
      </View>
    ) : null // Không hiển thị gì nếu không có media
  );
};

export default LikedPostItem;