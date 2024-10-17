import { account, databases } from "@/constants/AppwriteClient";
import { getUserPostsCount } from "@/constants/AppwritePost";
import { config } from "@/constants/Config";
import { setUser } from "@/store/currentUser";
import store from "@/store/store";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { LogBox, View } from "react-native";
import { Query } from "react-native-appwrite";
import { Provider, useDispatch } from "react-redux";

export default function Layout() {
  LogBox.ignoreLogs([
    "Warning: TRenderEngineProvider",
    "Warning: MemoizedTNodeRenderer",
    "Warning: TNodeChildrenRenderer",
  ]);

  return (
    <Provider store={store}>
      <View style={{ flex: 1, backgroundColor: "transparent" }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </View>
    </Provider>
  );
}
