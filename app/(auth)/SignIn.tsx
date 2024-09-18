import { View, Text, TextInput, Button } from "react-native";
import { Link, useRouter } from "expo-router"; // Sử dụng useRouter thay vì useNavigation
import { useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInUser } from "@/constants/AppwriteUser";

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Khởi tạo router

  const handleSignIn = async () => {
    try {
      const jwt = await signInUser(email, password); // Gọi phương thức signInUser
      await AsyncStorage.setItem('token', jwt); // Lưu token vào AsyncStorage
      router.replace('/'); // Chuyển hướng về trang index sau khi đăng nhập thành công
    } catch (error) {
      console.error("Đăng nhập thất bại:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-lg mb-4">Đăng nhập</Text>
      <TextInput
        placeholder="Email"
        className="border p-2 mb-4 w-full"
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Mật khẩu"
        secureTextEntry
        className="border p-2 mb-4 w-full"
        onChangeText={setPassword}
      />
      <Button
        title="Đăng nhập"
        onPress={handleSignIn}
      />
      <Link href="/SignUp">
        <Text>Đăng ký</Text>
      </Link>
    </View>
  );
}
