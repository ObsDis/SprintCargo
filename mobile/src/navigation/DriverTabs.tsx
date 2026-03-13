import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";

import JobsScreen from "../screens/driver/JobsScreen";
import ActiveDeliveryScreen from "../screens/driver/ActiveDeliveryScreen";
import EarningsScreen from "../screens/driver/EarningsScreen";
import ProfileScreen from "../screens/driver/ProfileScreen";

const Tab = createBottomTabNavigator();
const JobsStack = createNativeStackNavigator();
const ActiveStack = createNativeStackNavigator();
const EarningsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const iconMap: Record<string, string> = {
    Jobs: "B",
    Active: "A",
    Earnings: "$",
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

function JobsStackScreen() {
  return (
    <JobsStack.Navigator screenOptions={{ headerShown: false }}>
      <JobsStack.Screen name="JobsList" component={JobsScreen} />
    </JobsStack.Navigator>
  );
}

function ActiveStackScreen() {
  return (
    <ActiveStack.Navigator screenOptions={{ headerShown: false }}>
      <ActiveStack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </ActiveStack.Navigator>
  );
}

function EarningsStackScreen() {
  return (
    <EarningsStack.Navigator screenOptions={{ headerShown: false }}>
      <EarningsStack.Screen name="EarningsMain" component={EarningsScreen} />
    </EarningsStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function DriverTabs() {
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
        name="Jobs"
        component={JobsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Jobs" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Active"
        component={ActiveStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Active" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsStackScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Earnings" focused={focused} />,
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
