import { View, Text, TextInput, Button } from "react-native";
import { createUser } from '@/constants/appwriteConfig'; // Import phương thức createUser
import { Link, router } from "expo-router";
import { useState } from "react";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      console.error('Mật khẩu không khớp!');
      return;
    }
    try {
      await createUser(name, email, password); // Gọi phương thức createUser
      router.push('/SignIn');
    } catch (error) {
      console.error('Đăng ký thất bại:', error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-lg mb-4">Đăng ký</Text>
      <TextInput
        placeholder="Tên"
        className="border p-2 mb-4 w-full"
        onChangeText={setName}
      />
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
      <TextInput
        placeholder="Nhập lại mật khẩu"
        secureTextEntry
        className="border p-2 mb-4 w-full"
        onChangeText={setConfirmPassword}
      />
      <Button title="Đăng ký" onPress={handleSignUp} />
      <Link href="/SignIn">
        <Text>Đăng nhập</Text>
      </Link>
    </View>
  );
}