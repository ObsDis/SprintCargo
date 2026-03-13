import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";

import HomeScreen from "../screens/shipper/HomeScreen";
import CreateScreen from "../screens/shipper/CreateScreen";
import BidsScreen from "../screens/shipper/BidsScreen";
import TrackScreen from "../screens/shipper/TrackScreen";
import ShipperProfileScreen from "../screens/shipper/ShipperProfileScreen";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CreateStack = createNativeStackNavigator();
const BidsStack = createNativeStackNavigator();
const TrackStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const iconMap: Record<string, string> = {
    Home: "H",
    Create: "+",
    Bids: "Q",
    Track: "T",
    Profile: "P",
  };
  return (
    <View style={styles.iconContainer}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: focused ? COLORS.blue : COLORS.gray300 },
        ]}
      >
        <Text style={styles.iconText}>{iconMap[label] || label[0]}</Text>
      </View>
    </View>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function CreateStackScreen() {
  return (
    <CreateStack.Navigator screenOptions={{ headerShown: false }}>
      <CreateStack.Screen name="CreateMain" component={CreateScreen} />
    </CreateStack.Navigator>
  );
}

function BidsStackScreen() {
  return (
    <BidsStack.Navigator screenOptions={{ headerShown: false }}>
      <BidsStack.Screen name="BidsMain" component={BidsScreen} />
    </BidsStack.Navigator>
  );
}

function TrackStackScreen() {
  return (
    <TrackStack.Navigator screenOptions={{ headerShown: false }}>
      <TrackStack.Screen name="TrackMain" component={TrackScreen} />
    </TrackStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ShipperProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function ShipperTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.blue,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray200,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Create" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Bids"
        component={BidsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Bids" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Track"
        component={TrackStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Track" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
