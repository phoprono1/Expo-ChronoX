import { useEffect, useRef, useState } from "react";
import { View, ActivityIndicator, AppState, AppStateStatus } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import MainTabNavigator from "./(main)/(tabs)/_layout";
import SignIn from "./(auth)/SignIn";
import { BottomSheetProvider } from "@/hooks/BottomSheetProvider";
import { account, databases } from "@/constants/AppwriteClient";
import { Provider, useDispatch } from "react-redux";
import store from "@/store/store";
import { config } from "@/constants/Config";
import { Query } from "react-native-appwrite";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { setUser } from "@/store/currentUser";
import { getCurrentUserId, updateUserStatus } from "@/constants/AppwriteUser";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null); // Thêm state để lưu userID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const dispatch = useDispatch();
  const appState = useRef(AppState.currentState);

  const loadCurrentUserId = async () => {
    try {
      const currentAccount = await account.get();
      const currentUserId = await getCurrentUserId(currentAccount.$id);
      setCurrentUserId(currentUserId);
      await updateUserOnlineStatus('online');
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
    }
  };

  const updateUserOnlineStatus = async (status: 'online' | 'offline') => {
    if (currentUserId) {
      try {
        await updateUserStatus(currentUserId, status);
        console.log(`Trạng thái người dùng đã được cập nhật thành ${status}`);
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
      }
    }
  };

  useEffect(() => {
    loadCurrentUserId(); // Gọi hàm để lấy ID người dùng hiện tại
  }, []);

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const user = await account.get();
          setUserID(user.$id); // Lưu userID
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.log("Lỗi khi kiểm tra trạng thái đăng nhập:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentAccount = await account.get();
        const userDocuments = await databases.listDocuments(
          config.databaseId,
          config.userCollectionId,
          [Query.equal("accountID", currentAccount.$id)]
        );

        if (userDocuments.documents.length > 0) {
          const userDocument = userDocuments.documents[0];
          const userInfo = {
            $id: userDocument.$id,
            userId: userDocument.accountID,
            email: userDocument.email,
            avatar: userDocument.avatar,
            name: userDocument.username, // Thêm name
            bio: userDocument.bio || "", // Thêm bio
            followed: userDocument.followed || 0, // Thêm followed
            follower: userDocument.follower || 0, // Thêm follower
            location: userDocument.location || null, // Thêm location
            website: userDocument.website || null, // Thêm website
            postsCount: await getUserPostsCount(userDocument.$id), // Thêm postsCount
          };
          dispatch(setUser(userInfo)); // Cập nhật thông tin người dùng vào Redux
          console.log("Thông tin người dùng mới vào: ", userInfo);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
      }
    };

    fetchUserData();
  }, [dispatch]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('Ứng dụng đã chuyển sang trạng thái active');
        updateUserOnlineStatus('online');
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('Ứng dụng đã chuyển sang trạng thái background');
        updateUserOnlineStatus('offline');
      }
  
      appState.current = nextAppState;
    });
  
    return () => {
      subscription.remove();
    };
  }, [currentUserId]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return ( 
      <BottomSheetProvider>
        <NavigationContainer independent={true}>
          {isLoggedIn ? <MainTabNavigator /> : <SignIn />}
        </NavigationContainer>
      </BottomSheetProvider>
  );
}