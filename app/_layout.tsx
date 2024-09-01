import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from '@/hooks/useThemeColor';

export default function Layout() {
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaView>
    </View>
  );
}
