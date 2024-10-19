import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { client, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { Query } from "react-native-appwrite";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { setUserInfo } from "@/store/usersInfo";
import { isFollowing } from "@/constants/AppwriteFollow"; // Import hàm sendMessage
import {
  fetchChats,
  getMessageById,
  MessageType,
  sendMessage,
} from "@/constants/AppwriteChat";
import UserAvatar from "@/components/cards/UserAvatar";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  senderId: string | string[]; // ID của người gửi
  receiverId: string | string[]; // ID của người nhận
  text: string; // Nội dung tin nhắn
  timestamp: Date; // Thời gian gửi tin nhắn
}

const Chat = () => {
  const { userInfoId, currentUserId } = useLocalSearchParams(); // Lấy userInfo từ params
  const [followingStatus, setFollowingStatus] = useState(false); // Trạng thái theo dõi
  const [messages, setMessages] = useState<Message[]>([]); // Danh sách tin nhắn
  const [newMessage, setNewMessage] = useState(""); // Tin nhắn mới
  const [lastID, setLastID] = useState<string | null>(null); // ID của tin nhắn cuối cùng
  const [loadingMore, setLoadingMore] = useState(false); // Trạng thái đang tải thêm tin nhắn
  const userInfo = useSelector((state: any) => state.userInfo); // Lấy trạng thái người dùng từ Redux
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocuments = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal("$id", userInfoId)]
        );

        if (userDocuments.documents.length > 0) {
          const userDocument = userDocuments.documents[0];
          const userInfo = {
            $id: userDocument.$id,
            userId: userDocument.accountID,
            email: userDocument.email,
            avatar: userDocument.avatarId,
            name: userDocument.username, // Thêm name
            bio: userDocument.bio || "", // Thêm bio
            followed: userDocument.followed || 0, // Thêm followed
            follower: userDocument.follower || 0, // Thêm follower
            location: userDocument.location || null, // Thêm location
            website: userDocument.website || null, // Thêm website
            postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount
          };

          dispatch(setUserInfo(userInfo)); // Dispatch action để cập nhật trạng thái

          // Kiểm tra xem người dùng hiện tại đã theo dõi người dùng này chưa
          const following = await isFollowing(
            typeof currentUserId === "string"
              ? currentUserId
              : currentUserId[0],
            userInfo.$id
          );
          setFollowingStatus(following); // Cập nhật trạng thái theo dõi
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, []);

  const loadChats = async () => {
    if (loadingMore) return; // Nếu đang tải thì không làm gì cả
    setLoadingMore(true); // Đặt trạng thái đang tải

    try {
      const limit = 20; // Số lượng tin nhắn tải về mỗi lần
      const chats = await fetchChats(
        currentUserId,
        userInfo.$id,
        limit,
        lastID || undefined // Sử dụng lastID để tải tin nhắn cũ
      ); // Gọi hàm fetchChats

      if (chats.length > 0) {
        // Ánh xạ các đối tượng Document thành đối tượng Message
        const mappedChats = chats.map((chat) => ({
          senderId: chat.sender.$id,
          receiverId: userInfo.$id,
          text: chat.message,
          timestamp: new Date(chat.$createdAt), // Chuyển đổi thời gian tạo thành đối tượng Date
        }));
        setMessages((prevMessages) => [...prevMessages, ...mappedChats]); // Cập nhật danh sách tin nhắn
        setLastID(chats[chats.length - 1].$id); // Cập nhật lastID
      }
    } catch (error) {
      console.error("Lỗi khi tải tin nhắn:", error);
    } finally {
      setLoadingMore(false); // Đặt lại trạng thái sau khi hoàn thành
    }
  };

  useEffect(() => {
    loadChats(); // Tải tin nhắn khi component được mount

    // Lắng nghe sự kiện realtime
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.chatCollectionId}.documents`,
      async (response) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          const payload = JSON.parse(JSON.stringify(response.payload));
          const newMessageId = payload.$id;
          const newMessage = await getMessageById(newMessageId);
          // Kiểm tra xem tin nhắn có phải là của người gửi hoặc người nhận không
          if (
            newMessage &&
            ((newMessage.senderId === currentUserId &&
              newMessage.receiverId === userInfoId) ||
              (newMessage.senderId === userInfoId &&
                newMessage.receiverId === currentUserId))
          ) {
            setMessages((prevMessages) => [newMessage, ...prevMessages]); // Cập nhật danh sách tin nhắn
          }
        }
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
      setMessages([]); // Reset danh sách tin nhắn
      setLastID(null); // Reset lastID
    };
  }, []);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        // Gửi tin nhắn
        await sendMessage(
          currentUserId,
          userInfoId,
          newMessage,
          MessageType.TEXT
        ); // Gửi tin nhắn với messageType là 'text'
        setNewMessage(""); // Xóa tin nhắn sau khi gửi
      } catch (error) {
        console.error("Lỗi khi gửi tin nhắn:", error);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? -40 : 0} // Điều chỉnh khoảng cách nếu cần
    >
      <SafeAreaView className="flex-1 p-4">
        <UserAvatar
          userId={userInfo.$id}
          userName={userInfo.name}
          avatarUrl={userInfo.avatar}
        />
        <Text>Đang chat với {userInfoId}</Text>
        <FlatList
          data={messages}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf:
                  item.senderId === currentUserId ? "flex-end" : "flex-start", // Căn chỉnh tin nhắn
                marginVertical: 5,
              }}
            >
              <Text
                className={`p-2 rounded-lg ${
                  item.senderId === currentUserId
                    ? "bg-blue-500 text-white" // Màu cho tin nhắn của người gửi
                    : "bg-gray-300 text-black" // Màu cho tin nhắn của người nhận
                }`}
              >
                {item.text}
              </Text>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
          className="flex-1"
          inverted // Thêm thuộc tính inverted để hiển thị tin nhắn từ dưới lên
          onEndReached={loadChats} // Gọi hàm loadChats khi kéo lên
          onEndReachedThreshold={0} // Ngưỡng kích hoạt sự kiện kéo lên
        />

        <View className="flex-row items-center mt-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-full p-2 mr-2"
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChangeText={setNewMessage}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="p-2 bg-blue-500 rounded-full"
          >
            <Text className="text-white">Gửi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Chat;
