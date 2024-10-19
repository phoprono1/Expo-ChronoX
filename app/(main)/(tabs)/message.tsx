import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useBottomSheet } from "@/hooks/BottomSheetProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { areFriends, getFriendsList, updateFollowStatus } from "@/constants/AppwriteFollow";
import { Avatar } from "react-native-ui-lib";
import { client } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { router } from "expo-router";
import { getAvatarUrl } from "@/constants/AppwriteFile";

// Cập nhật interface Followed
interface Followed {
  $id: string;
  accountID: string;
  avatarId: string | null;
  bio: string | null;
  email: string;
  followed: number;
  follower: number;
  location: string | null;
  username: string;
  website: string | null;
  status: string;
  isOnline: boolean; // Thay đổi này
  lastMessage?: string;
  lastMessageTime?: string;
}

const Message = () => {
  const { isVisible } = useBottomSheet();
  const scale = useSharedValue(1);
  const user = useSelector((state: any) => state.currentUser);
  const [userInfo, setUserInfo] = useState(user);
  const [friendsList, setFriendsList] = useState<Followed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const friends = await getFriendsList(userInfo.$id);
      const followedList = friends.map((friend: any) => ({
        ...friend.followed,
        isOnline: friend.followed.status === "online",
      }));
      setFriendsList(followedList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách bạn bè:", error);
      setError("Không thể tải danh sách bạn bè. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo.$id) {
      fetchFriends();
    }
  }, [userInfo.$id]);

  useEffect(() => {
    setUserInfo(user);
  }, [user]);

  useEffect(() => {
    if (!userInfo.$id) return;

    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.userCollectionId}.documents`,
      async (response) => {
        const updatedUser = JSON.parse(JSON.stringify(response.payload));
        
        // Kiểm tra xem có sự thay đổi trong followed hoặc follower không
        if (updatedUser.followed !== undefined || updatedUser.follower !== undefined) {
          // Nếu có, kiểm tra xem userInfo và updatedUser có phải là bạn bè không
          const areTheyFriends = await updateFollowStatus(userInfo.$id, updatedUser.$id);

          if (areTheyFriends) {
            // Nếu là bạn bè, cập nhật danh sách bạn bè
            setFriendsList((prevList) => {
              const existingFriend = prevList.find(friend => friend.$id === updatedUser.$id);
              if (existingFriend) {
                // Cập nhật thông tin bạn bè hiện có
                return prevList.map(friend => 
                  friend.$id === updatedUser.$id 
                    ? { ...friend, ...updatedUser, isOnline: updatedUser.status === "online" }
                    : friend
                );
              } else {
                // Thêm bạn mới vào danh sách
                return [...prevList, { ...updatedUser, isOnline: updatedUser.status === "online" }];
              }
            });
          } else {
            // Nếu không còn là bạn bè, xóa khỏi danh sách
            setFriendsList((prevList) => prevList.filter(friend => friend.$id !== updatedUser.$id));
          }
        } else {
          // Nếu chỉ có sự thay đổi trong trạng thái online/offline
          setFriendsList((prevList) =>
            prevList.map((friend) =>
              friend.$id === updatedUser.$id
                ? { ...friend, isOnline: updatedUser.status === "online" }
                : friend
            )
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userInfo.$id]);

  React.useEffect(() => {
    scale.value = withTiming(isVisible ? 0.9 : 1, { duration: 200 });
  }, [isVisible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleChat = (userId: string) => {
    router.push({
      pathname: "../(main)/(functions)/chat/[chat]",
      params: { userInfoId: userId, currentUserId: userInfo.$id },
    });
  };

  const renderStoryItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity className="items-center mr-4">
      <View className="relative">
        <Avatar source={{ uri: getAvatarUrl(item.avatarId!!)  || undefined }} size={60} />
        <View
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
            item.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </View>
      <Text className="text-center mt-1 text-xs" numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: Followed }) => (
    <TouchableOpacity className="flex-row items-center p-3 border-b border-gray-200" onPress={() =>handleChat(item.$id)}>
      <View className="relative">
        <Avatar source={{ uri: getAvatarUrl(item.avatarId!!) || undefined }} size={50} />
        <View
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            item.isOnline ? "bg-green-500" : "bg-gray-400"
          }`}
        />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-semibold">{item.username}</Text>
        <Text className="text-gray-500" numberOfLines={1}>
          {item.lastMessage || "Bắt đầu cuộc trò chuyện"}
        </Text>
      </View>
      {item.lastMessageTime && (
        <Text className="text-xs text-gray-400">{item.lastMessageTime}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.Text style={animatedStyle} className="text-xl font-bold p-4">
        Tin nhắn
      </Animated.Text>
      <View className="max-h-24">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="pl-2 pb-2"
        >
          {friendsList.map((friend) => (
            <React.Fragment key={friend.$id}>
              {renderStoryItem({ item: friend })}
            </React.Fragment>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <FlatList
          data={friendsList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.$id}
        />
      </View>
    </SafeAreaView>
  );
};

export default Message;
