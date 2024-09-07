import { Stack } from "expo-router";
import { LogBox, View } from "react-native";

export default function Layout() {
  LogBox.ignoreLogs(['Warning: TRenderEngineProvider', 'Warning: MemoizedTNodeRenderer', 'Warning: TNodeChildrenRenderer']);

  return (
    <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
    </View>
  );
}
