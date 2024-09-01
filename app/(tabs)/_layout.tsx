import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TouchableOpacity, View } from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome"; // Thêm import cho FontAwesome

import home from "./home";
import search from "./search";
import create from "./create";
import message from "./message";
import profile from "./profile";

const Tab = createBottomTabNavigator();

const CustomTabBarButton = ({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        justifyContent: "center",
        alignItems: "center",
        height: 50,
        width: 65,
        backgroundColor: "transparent",
        borderRadius: 15,
        marginTop: 5,
      }}
    >
      {children}
    </TouchableOpacity>
  );
};

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = "home-outline"; // Gán giá trị mặc định

          if (route.name === "Trang chủ") {
            iconName = focused ? "home-sharp" : "home-outline";
          } else if (route.name === "Tìm kiếm") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "Nhắn tin") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline"; // Sử dụng icon từ FontAwesome
          } else if (route.name === "Thông tin") {
            iconName = focused ? "person" : "person-outline"; // Sử dụng icon từ FontAwesome
          }

          return (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Ionicons
                name={iconName}
                size={size}
                color={color}
                style={{ marginBottom: -30 }}
              />
            </View>
          );
        },
        tabBarActiveTintColor: "tomato",
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          backgroundColor: "transparent",
          height: 60,
          borderTopWidth: 0, // Ví dụ: thêm viền trên
        },
      })}
    >
      <Tab.Screen
        name="Trang chủ"
        component={home}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Tìm kiếm"
        component={search}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Tạo"
        component={create}
        options={{
          headerShown: false,
          // @ts-ignore
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarIcon: ({ focused }) => {
            const iconName = focused ? "add-sharp" : "add-outline"; // Sử dụng icon từ FontAwesome
            const color = focused ? "tomato" : "gray";
            return (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <Ionicons name={iconName} size={30} color={color} />
              </View>
            );
          },
        }}
      />
      <Tab.Screen
        name="Nhắn tin"
        component={message}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Thông tin"
        component={profile}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}
