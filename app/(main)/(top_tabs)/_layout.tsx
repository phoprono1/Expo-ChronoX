import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Index from "./index"; // Import component index
import Likes from "./likes"; // Import component likes
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { View, Text } from "react-native";
import React from "react";

const Tab = createMaterialTopTabNavigator();

const TopTabs = () => {

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Index"
        component={Index}
        options={{
          tabBarLabel: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="view-timeline" size={24} color="black" />
              <Text style={{ marginLeft: 5 }}>Dòng thời gian</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Likes"
        component={Likes}
        options={{
          tabBarLabel: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons name="heart" size={24} color="black" />
              <Text style={{ marginLeft: 5 }}>Yêu thích</Text>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TopTabs;
