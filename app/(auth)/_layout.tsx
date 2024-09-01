import { Stack } from "expo-router";
import { View } from "react-native";
import { useThemeColor } from '@/hooks/useThemeColor';

export default function AuthLayout() {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SignIn" options={{ title: "Đăng nhập" }} />
        <Stack.Screen name="SignUp" options={{ title: "Đăng ký" }} />
      </Stack>
    </View>
  );
}