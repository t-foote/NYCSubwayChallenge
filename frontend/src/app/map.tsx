import { View, StyleSheet, Alert, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { useEffect, useState } from "react";
import * as Location from "expo-location";


const LATITUDE = 40.7249;
const LONGITUDE = -73.9240;
const LATITUDE_DELTA = 0.461;
const LONGITUDE_DELTA = 0.211;

export default function MapScreen() {
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationGranted(status === 'granted');
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: LATITUDE,
          longitude: LONGITUDE,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation={locationGranted}
      >
        {/* <Marker
          coordinate={{ latitude: LATITUDE, longitude: LONGITUDE }}
          title="Marker Title"
          description="Marker description"
        /> */}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
