import 'expo-router/entry';

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';

const visitedStops = [
  { id: '1', name: 'Times Sq - 42 St', time: '10:05 AM' },
  { id: '2', name: 'Grand Central - 42 St', time: '10:15 AM' },
  { id: '3', name: '34 St - Herald Sq', time: '10:25 AM' },
  { id: '4', name: '14 St - Union Sq', time: '10:35 AM' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={visitedStops}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={
          <>
            {/* Title */}
            <Text style={styles.title}>NYC Subway Challenge</Text>

            {/* Trip Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>Trip in Progress</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryStat}><Text style={styles.statNumber}>{visitedStops.length}</Text> Stops Visited</Text>
                <Text style={styles.summaryStat}><Text style={styles.statNumber}>470</Text> Stops Left</Text>
                <Text style={styles.summaryStat}><Text style={styles.statNumber}>00:12</Text> Elapsed</Text>
              </View>
            </View>

            {/* Visited Stops */}
            <Text style={styles.sectionTitle}>Visited Stops</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.stopCard}>
            <Text style={styles.stopName}>{item.name}</Text>
            <Text style={styles.stopTime}>{item.time}</Text>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.routeButton}>
            <Text style={styles.routeButtonText}>Generate Remaining Route</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 16,
    color: '#222',
    alignSelf: 'flex-start',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  summaryStat: {
    fontSize: 14,
    color: '#555',
    marginRight: 12,
  },
  statNumber: {
    fontWeight: '700',
    color: '#222',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  stopCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    flex: 1,
  },
  stopTime: {
    fontSize: 14,
    color: '#888',
    marginLeft: 16,
    minWidth: 70,
    textAlign: 'right',
  },
  routeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    marginTop: 24,
    paddingVertical: 18,
    alignItems: 'center',
    marginHorizontal: 0,
    elevation: 2,
  },
  routeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
