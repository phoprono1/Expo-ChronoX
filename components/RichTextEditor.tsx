import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useState } from "react";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { useThemeColor } from "@/hooks/useThemeColor";
import { TouchableOpacity } from "react-native-gesture-handler";

const RichTextEditor = ({
  editorRef,
  onChange,
}: {
  editorRef: any;
  onChange: (body: string) => void;
}) => {
  const [isFirstFocus, setIsFirstFocus] = useState(true); // Biến để kiểm tra lần focus đầu tiên

  const handleFocus = () => {
    if (isFirstFocus) {
      editorRef.current.focusContentEditor(); // Hiện bàn phím lần đầu
      setIsFirstFocus(false); // Đánh dấu đã focus lần đầu
    } else {
      // Kiểm tra xem bàn phím có đang mở không
      if (Keyboard.isVisible()) {
        editorRef.current.blurContentEditor(); // Tắt bàn phím nếu đang mở
      } else {
        editorRef.current.focusContentEditor(); // Hiện bàn phím nếu đang tắt
      }
    }
  };

  return (
    <TouchableOpacity onPress={() => Keyboard.dismiss()}>
      <View className="min-h-[285px]">
        <RichToolbar
          actions={[
            actions.setStrikethrough,
            actions.removeFormat,
            actions.setBold,
            actions.setItalic,
            actions.insertOrderedList,
            actions.blockquote,
            actions.alignLeft,
            actions.alignCenter,
            actions.alignRight,
            actions.code,
            actions.line,
            actions.heading1,
            actions.heading4,
          ]}
          iconMap={{
            [actions.heading1]: ({ tintColor }: { tintColor: string }) => (
              <Text style={{ color: tintColor }}>H1</Text>
            ),
            [actions.heading4]: ({ tintColor }: { tintColor: string }) => (
              <Text style={{ color: tintColor }}>H4</Text>
            ),
          }}
          style={styles.richBar}
          flatContainerStyle={styles.flatStyle}
          selectedIconTintColor={useThemeColor(
            { light: "#000", dark: "#fff" },
            "text"
          )}
          editor={editorRef}
          disable={false}
        />
        <RichEditor
          ref={editorRef}
          containerStyle={styles.rich}
          editorStyle={styles.contentStyle}
          placeholder="Chia sẻ cảm xúc của bạn!"
          onFocus={handleFocus} // Sử dụng hàm handleFocus
          onChange={onChange}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  richBar: {
    borderWidth: 0,
    borderColor: "#ccc",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    overflow: "hidden",
  },
  flatStyle: {
    paddingHorizontal: 8,
    gap: 3,
  },
  rich: {
    minHeight: 240,
    flex: 1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderColor: "#ccc",
    padding: 10,
    overflow: "hidden",
  },
  contentStyle: {
    color: "black",
  },
});

export default RichTextEditor;
