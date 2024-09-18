import React from "react";
import { View, TextInput, TouchableOpacity, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";

interface CommentInputFieldProps extends TextInputProps {
  onSubmit: () => void; // Hàm để xử lý khi gửi bình luận
}

const CommentInputField: React.FC<CommentInputFieldProps> = ({ onSubmit, ...props }) => {
  return (
    <View className="flex-row items-center mb-2">
      <TextInput
        {...props} // Truyền các props cho TextInput
        className="flex-1 border border-gray-300 p-2 rounded-xl h-10"
      />
      <TouchableOpacity
        onPress={onSubmit}
        className="bg-blue-500 p-2 rounded-2xl items-center justify-center w-10 ml-2"
      >
        <Feather name="send" size={22} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default CommentInputField;