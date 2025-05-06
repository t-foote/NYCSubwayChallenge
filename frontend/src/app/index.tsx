import { Link } from "expo-router";
import React from "react";
import { Text, View, TouchableOpacity, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const visitedStops = [
  { id: '1', name: 'Times Sq - 42 St', time: '10:05 AM' },
  { id: '2', name: 'Grand Central - 42 St', time: '10:15 AM' },
  { id: '3', name: '34 St - Herald Sq', time: '10:25 AM' },
  { id: '4', name: '14 St - Union Sq', time: '10:35 AM' },
];

export default function Page() {
  return (
    <View className="flex flex-1">
      <Content />
      <Footer />
    </View>
  );
}

function Content() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={visitedStops}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        ListHeaderComponent={
          <>
            <Text className="text-3xl font-bold mt-4 mb-4 text-gray-800">
              NYC Subway Challenge
            </Text>

            <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
              <Text className="text-lg font-semibold mb-3 text-gray-800">
                Trip in Progress
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">{visitedStops.length}</Text> Stops Visited
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">470</Text> Stops Left
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">00:12</Text> Elapsed
                </Text>
              </View>
            </View>

            <Text className="text-xl font-bold mb-2 text-gray-800">
              Visited Stops
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-xl py-4 px-5 mb-3 flex-row justify-between items-center shadow-sm">
            <Text className="text-base font-semibold text-gray-800 flex-1">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-500 ml-4 min-w-[70px] text-right">
              {item.time}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity className="bg-blue-600 rounded-2xl mt-6 py-[18px] items-center">
            <Text className="text-lg font-bold text-white tracking-wide">
              Generate Remaining Route
            </Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}

function Footer() {
  const { bottom } = useSafeAreaInsets();
  return (
    <View
      className="flex shrink-0 bg-gray-100 native:hidden"
      style={{ paddingBottom: bottom }}
    >
      <View className="py-6 flex-1 items-start px-4 md:px-6">
        <Text className={"text-center text-gray-700"}>
          © {new Date().getFullYear()} NYC Subway Challenge
        </Text>
      </View>
    </View>
  );
}
