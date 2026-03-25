import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Button, Loading } from '@components/ui';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius } from '@constants/theme';
import { api } from '@services/api';

const { width } = Dimensions.get('window');

export default function ServiceAreaScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission refusée',
        'Nous avons besoin de votre position pour définir votre zone d\'intervention'
      );
      setIsLoading(false);
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    });
    setIsLoading(false);
  };

  const handleMapPress = (event: any) => {
    setLocation(event.nativeEvent.coordinate);
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Erreur', 'Veuillez sélectionner votre zone d\'intervention');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.professional.addServiceArea({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm,
        name: 'Zone principale',
      });

      router.push('/(onboarding)/pending');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Loading fullScreen text="Récupération de votre position..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zone d'intervention</Text>
        <Text style={styles.subtitle}>
          Définissez le rayon autour duquel vous souhaitez recevoir des missions
        </Text>
      </View>

      <View style={styles.mapContainer}>
        {location && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: radiusKm / 50,
              longitudeDelta: radiusKm / 50,
            }}
            onPress={handleMapPress}
          >
            <Marker coordinate={location} draggable onDragEnd={handleMapPress}>
              <View style={styles.marker}>
                <View style={styles.markerDot} />
              </View>
            </Marker>
            <Circle
              center={location}
              radius={radiusKm * 1000}
              fillColor={Colors.light.primary + '20'}
              strokeColor={Colors.light.primary}
              strokeWidth={2}
            />
          </MapView>
        )}
      </View>

      <View style={styles.controls}>
        <View style={styles.radiusControl}>
          <Text style={styles.radiusLabel}>Rayon d'intervention</Text>
          <Text style={styles.radiusValue}>{radiusKm} km</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={50}
          step={5}
          value={radiusKm}
          onValueChange={setRadiusKm}
          minimumTrackTintColor={Colors.light.primary}
          maximumTrackTintColor={Colors.light.border}
          thumbTintColor={Colors.light.primary}
        />

        <Text style={styles.hint}>
          Appuyez sur la carte pour déplacer le centre de votre zone
        </Text>

        <Button
          title="Valider ma zone"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  mapContainer: {
    flex: 1,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.light.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: Colors.light.white,
  },
  controls: {
    padding: Spacing.lg,
  },
  radiusControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  radiusLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.light.text,
  },
  radiusValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.light.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  hint: {
    fontSize: FontSizes.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  submitButton: {},
});
