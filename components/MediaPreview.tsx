import React from "react";
import { View, Image } from "react-native";
import { Video as ExpoVideo } from "expo-av";

interface MediaPreviewProps {
  mediaUri: string;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ mediaUri }) => {
  const isVideo =
    mediaUri.endsWith(".mp4") ||
    mediaUri.endsWith(".mov") ||
    mediaUri.endsWith(".avi") ||
    mediaUri.endsWith(".mkv"); // Kiểm tra xem URI có phải là video không

  return (
    <View
      style={{
        width: "100%",
        height: 200,
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      {isVideo ? (
        <ExpoVideo
          source={{ uri: mediaUri }}
          style={{ width: "100%", height: "100%" }}
          useNativeControls
          isLooping
        />
      ) : (
        <Image
          source={{ uri: mediaUri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

export default MediaPreview;
