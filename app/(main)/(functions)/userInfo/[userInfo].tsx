import { View, Text, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router"; // Import useLocalSearchParams
import { account, client, databases } from "@/constants/AppwriteClient";
import { config } from "@/constants/Config";
import { Query } from "react-native-appwrite";
import { useDispatch, useSelector } from "react-redux";
import { setUserInfo } from "@/store/usersInfo";
import { getUserPostsCount } from "@/constants/AppwritePost";
import UsersProfile from "@/components/cards/UsersProfile";
import UsersPosts from "@/components/cards/UsersPosts";
import FollowComponent from "@/components/FollowComponent";
import { getCurrentUserId } from "@/constants/AppwriteUser";
import { isFollowing } from "@/constants/AppwriteFollow";

const UserInfo = () => {
  const { userInfoId } = useLocalSearchParams(); // Lấy userInfo từ params
  const { currentUserId } = useLocalSearchParams(); // Lấy currentUserId từ params
  const dispatch = useDispatch();
  const [followingStatus, setFollowingStatus] = useState(false); // Trạng thái theo dõi

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

  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${config.databaseId}.collections.${config.followCollectionId}.documents`,
      async (response) => {
        const currentAccount = await account.get();
        const currentAccountId = currentAccount.$id; // Lấy ID của tài khoản hiện tại
        const events = JSON.parse(JSON.stringify(response.events)); // Chuyển đổi payload về đối tượng
        const payload = JSON.parse(JSON.stringify(response.payload)); 
        // Kiểm tra sự kiện
        if (
          events.some(
            (event: string | string[]) =>
              event.includes("create") && payload.$id
          )
        ) {
          // Nếu là sự kiện create
          // Kiểm tra quyền đọc
          if (payload.$permissions.includes(`read("user:${currentAccountId}")`)) {
            setFollowingStatus(true); // Đặt trạng thái theo dõi thành true
          }
        } else if (
          events.some(
            (event: string | string[]) =>
              event.includes("delete") && payload.$id
          )
        ) {
          // Nếu là sự kiện delete
          // Kiểm tra quyền đọc
          if (payload.$permissions.includes(`read("user:${currentAccountId}")`)) {
            setFollowingStatus(false); // Đặt trạng thái theo dõi thành false
          }
        }
      }
    );

    return () => {
      unsubscribe(); // Hủy đăng ký khi component unmount
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <UsersProfile />
      {Array.isArray(userInfoId) ? null : userInfoId ===
        currentUserId ? null : (
        <FollowComponent
          followerId={
            typeof currentUserId === "string" ? currentUserId : currentUserId[0]
          }
          followedId={userInfoId} // Chuyển đổi sang string
          isFollowing={followingStatus} // Truyền trạng thái theo dõi vào FollowComponent
        />
      )}
      <UsersPosts />
    </SafeAreaView>
  );
};

export default UserInfo;
