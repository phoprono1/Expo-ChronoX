import { View, Text } from "react-native";
import React from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import store from "@/store/store";
import { BottomSheetProvider } from "@/hooks/BottomSheetProvider";

const _layout = () => {
  return (
    <Provider store={store}>
      <BottomSheetProvider>
        <View style={{ flex: 1, backgroundColor: "transparent" }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="userInfo/[userInfo]"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="chat/[chat]" options={{ headerShown: false }} />
          </Stack>
        </View>
      </BottomSheetProvider>
    </Provider>
  );
};

export default _layout;
