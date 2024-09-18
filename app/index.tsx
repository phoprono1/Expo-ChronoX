import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import MainTabNavigator from './(main)/(tabs)/_layout';
import SignIn from './(auth)/SignIn';
import { BottomSheetProvider } from '@/hooks/BottomSheetProvider';
import { ApolloProvider } from '@apollo/client';
import { account } from '@/constants/AppwriteClient';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userID, setUserID] = useState<string | null>(null); // Thêm state để lưu userID


  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const user = await account.get();
          setUserID(user.$id); // Lưu userID
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.log('Lỗi khi kiểm tra trạng thái đăng nhập:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

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