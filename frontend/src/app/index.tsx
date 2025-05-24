import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, FlatList, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getVisitedStops, markStopVisited, getCurrentAttempt, startAttempt, endAttempt } from "../api";

interface VisitedStop {
  id: string;
  name: string;
  time: string;
  pending: boolean;
}

interface CurrentAttempt {
  id: string;
  started_at: string;
  status: 'active' | 'completed';
}

export default function Page() {
  const [visitedStops, setVisitedStops] = useState<VisitedStop[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState<CurrentAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Load current attempt
      const attempt = await getCurrentAttempt();
      setCurrentAttempt(attempt);

      // Only load visited stops if there's an active attempt
      if (attempt) {
        const stops = await getVisitedStops();
        setVisitedStops(stops);
      } else {
        setVisitedStops([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleStartAttempt() {
    setError(null);
    try {
      const attempt = await startAttempt();
      setCurrentAttempt(attempt);
    } catch (error) {
      console.error('Error starting attempt:', error);
      setError('Failed to start attempt. Please try again.');
    }
  }

  async function handleEndAttempt() {
    setError(null);
    try {
      await endAttempt();
      setCurrentAttempt(null);
    } catch (error) {
      console.error('Error ending attempt:', error);
      setError('Failed to end attempt. Please try again.');
    }
  }

  async function handleMarkStopVisited(stopId: string) {
    setError(null);
    try {
      const visitedAt = new Date().toISOString();
      await markStopVisited(stopId, visitedAt);
      await loadData(); // Refresh data after marking stop
    } catch (error) {
      console.error('Error marking stop visited:', error);
      setError('Failed to mark stop as visited. Please try again.');
    }
  }

  return (
    <View className="flex flex-1">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <Text>Loading...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity 
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={loadData}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Content 
          visitedStops={visitedStops} 
          currentAttempt={currentAttempt}
          onStartAttempt={handleStartAttempt}
          onEndAttempt={handleEndAttempt}
          onMarkStopVisited={handleMarkStopVisited}
        />
      )}
      <Footer />
    </View>
  );
}

function Content({ 
  visitedStops, 
  currentAttempt,
  onStartAttempt,
  onEndAttempt,
  onMarkStopVisited
}: { 
  visitedStops: VisitedStop[];
  currentAttempt: CurrentAttempt | null;
  onStartAttempt: () => Promise<void>;
  onEndAttempt: () => Promise<void>;
  onMarkStopVisited: (stopId: string) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [isVisitedStopsModalVisible, setIsVisitedStopsModalVisible] = useState(false);
  const [isRouteModalVisible, setIsRouteModalVisible] = useState(false);

  // Mock route data - will be replaced with actual API call later
  const mockRoute = {
    journey: {
      segments: [
        {
          start_stop_id: "123A",
          end_stop_id: "456B",
          route_id: "A",
          estimated_time: 300,
          stops_in_segment: ["123A", "124B", "125C", "456B"]
        },
        {
          start_stop_id: "456B",
          end_stop_id: "789C",
          route_id: "B",
          estimated_time: 240,
          stops_in_segment: ["456B", "457C", "458D", "789C"]
        }
      ]
    },
    total_estimated_time: 540,
    remaining_stops: ["456B", "789C", "101D"]
  };

  const renderVisitedStop = ({ item }: { item: VisitedStop }) => (
    <View className="bg-white rounded-xl py-4 px-5 mb-3 flex-row justify-between items-center shadow-sm">
      <Text className="text-base font-semibold text-gray-800 flex-1">
        {item.name}
      </Text>
      <Text className="text-sm text-gray-500 ml-4 min-w-[70px] text-right">
        {item.time}
      </Text>
      {item.pending && (
        <Text className="text-xs text-orange-500 ml-2">Pending Sync</Text>
      )}
    </View>
  );

  const renderRouteSegment = ({ item, index }: { item: any; index: number }) => (
    <View className="mb-4">
      {/* Route line with color */}
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center mr-3">
          <Text className="text-white font-bold">{item.route_id}</Text>
        </View>
        <Text className="text-lg font-semibold text-gray-800">
          {item.stops_in_segment[0]} → {item.stops_in_segment[item.stops_in_segment.length - 1]}
        </Text>
      </View>
      
      {/* Stops in segment */}
      <View className="ml-11">
        {item.stops_in_segment.map((stop: string, stopIndex: number) => (
          <View key={stop} className="flex-row items-center mb-1">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
            <Text className="text-gray-600">{stop}</Text>
          </View>
        ))}
      </View>

      {/* Transfer indicator if not last segment */}
      {index < mockRoute.journey.segments.length - 1 && (
        <View className="ml-11 mt-2 mb-2">
          <View className="flex-row items-center">
            <Ionicons name="swap-horizontal" size={20} color="#6B7280" />
            <Text className="text-gray-500 ml-2">Transfer at {item.end_stop_id}</Text>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <FlatList
        data={[]}
        keyExtractor={item => item.id}
        renderItem={() => null}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20 }}
        ListHeaderComponent={
          <>
            <Text className="text-3xl font-bold mt-4 mb-4 text-gray-800">
              NYC Subway Challenge
            </Text>

            <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
              <Text className="text-lg font-semibold mb-3 text-gray-800">
                {currentAttempt ? 'Trip in Progress' : 'No Active Trip'}
              </Text>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">{visitedStops.length}</Text> Stops Visited
                </Text>
                <Text className="text-gray-600">
                  <Text className="font-bold text-gray-800">470</Text> Stops Left
                </Text>
                {currentAttempt && (
                  <Text className="text-gray-600">
                    <Text className="font-bold text-gray-800">
                      {new Date(currentAttempt.started_at).toLocaleTimeString()}
                    </Text> Started
                  </Text>
                )}
              </View>
              {!currentAttempt ? (
                <TouchableOpacity 
                  className="bg-blue-600 rounded-lg px-4 py-2 mt-4 self-start"
                  onPress={onStartAttempt}
                >
                  <Text className="text-white font-semibold">Start New Trip</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  className="bg-red-600 rounded-lg px-4 py-2 mt-4 self-start"
                  onPress={onEndAttempt}
                >
                  <Text className="text-white font-semibold">End Trip</Text>
                </TouchableOpacity>
              )}
            </View>

            {currentAttempt && (
              <>
                <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-xl font-bold text-gray-800">
                        Next Stop
                      </Text>
                      <Text className="text-gray-600 mt-1">
                        {mockRoute.journey.segments[0].stops_in_segment[0]}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-blue-600 rounded-lg px-4 py-2"
                      onPress={() => onMarkStopVisited(mockRoute.journey.segments[0].stops_in_segment[0])}
                    >
                      <Text className="text-white font-semibold">Visited</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  className="bg-white rounded-xl shadow-sm mb-6 p-4"
                  onPress={() => setIsVisitedStopsModalVisible(true)}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xl font-bold text-gray-800">
                      Visited Stops
                    </Text>
                    <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                  </View>
                  <Text className="text-gray-600 mt-1">
                    {visitedStops.length} stops visited
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="bg-white rounded-xl shadow-sm mb-6 p-4"
                  onPress={() => setIsRouteModalVisible(true)}
                >
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xl font-bold text-gray-800">
                      Route
                    </Text>
                    <Ionicons name="chevron-forward" size={24} color="#6B7280" />
                  </View>
                  <Text className="text-gray-600 mt-1">
                    {mockRoute.journey.segments.length} segments • {Math.round(mockRoute.total_estimated_time / 60)} min
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        }
      />

      {/* Visited Stops Modal */}
      <Modal
        visible={isVisitedStopsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <Text className="text-xl font-bold text-gray-800">Visited Stops</Text>
            <TouchableOpacity onPress={() => setIsVisitedStopsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={visitedStops}
            keyExtractor={item => item.id}
            renderItem={renderVisitedStop}
            contentContainerStyle={{ padding: 16 }}
          />
        </View>
      </Modal>

      {/* Route Modal */}
      <Modal
        visible={isRouteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
            <Text className="text-xl font-bold text-gray-800">Route</Text>
            <TouchableOpacity onPress={() => setIsRouteModalVisible(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={mockRoute.journey.segments}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderRouteSegment}
            contentContainerStyle={{ padding: 16 }}
            ListFooterComponent={
              <View className="mt-4 p-4 bg-blue-50 rounded-xl">
                <Text className="text-blue-800 font-semibold">
                  Total Estimated Time: {Math.round(mockRoute.total_estimated_time / 60)} minutes
                </Text>
                <Text className="text-blue-600 mt-1">
                  {mockRoute.remaining_stops.length} stops remaining
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
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
