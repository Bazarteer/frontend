import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PreviewScreen() {
  const params = useLocalSearchParams();
  const { type, uri, uris } = params;

  const imageUris = typeof uris === 'string' ? uris.split(',') : [];
  const singleUri = typeof uri === 'string' ? uri : '';

  const handleContinue = () => {
    router.push({
      pathname: '/(tabs)/add/details',
      params: {
        type,
        uri: singleUri,
        uris: typeof uris === 'string' ? uris : '',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Top left - Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <View style={styles.iconButton}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Content Preview */}
      <View style={styles.previewContainer}>
        {type === 'video' && singleUri ? (
          <Video
            source={{ uri: singleUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : type === 'photo' && singleUri ? (
          <Image source={{ uri: singleUri }} style={styles.image} resizeMode="contain" />
        ) : type === 'slideshow' && imageUris.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.slideshow}
          >
            {imageUris.map((imgUri, index) => (
              <Image
                key={index}
                source={{ uri: imgUri }}
                style={styles.image}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.errorText}>No content to preview</Text>
        )}
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  slideshow: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  continueButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});