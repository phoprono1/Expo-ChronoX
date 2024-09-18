import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router';

const _layout = () => {
    return (
        <View style={{ flex: 1, backgroundColor: "transparent" }}>
            <Stack screenOptions={{headerShown: false}}>
              <Stack.Screen name="postDetail" options={{ headerShown: false, presentation: "modal" }} />
            </Stack>
        </View>
      );
}

export default _layout