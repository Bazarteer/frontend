import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SlideshowContent } from './content-item';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface SlideshowItemProps {
  item: SlideshowContent;
  isActive: boolean;
}

const SlideshowItem: React.FC<SlideshowItemProps> = ({ item, isActive }) => {
  const [liked, setLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [bioExpanded, setBioExpanded] = useState(false);


  const handleLike = () => {
    setLiked(!liked);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

    const handleBuy = () => {
          router.push({
            pathname: '/(tabs)/order',
            params: {
              productTitle: item.title,
              productPrice: item.price,
              creatorName: item.creator.name,
              creatorSurname: item.creator.surname,
              creatorId: item.creator.id,
              productId: item.id,
              productLocation: item.location.city + ", " + item.location.country,
              productBio: item.bio
            },
          });
    }
  

  return (
    <View style={styles.container}>
      {/* Horizontal ScrollView for images */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {item.images.map((imageUrl, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {item.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentImageIndex === index && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <View style={styles.contentInfo}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Creator and Location row */}
        <View style={styles.creatorLocationRow}>
          <Text style={styles.creatorName}>
            {item.creator.name} {item.creator.surname}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#CCCCCC" />
            <Text style={styles.locationText}>
              {item.location.city}, {item.location.country}
            </Text>
          </View>
        </View>

        {/* Bio section */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>
            {bioExpanded ? item.bio : (item.bio.length > 80 ? item.bio.substring(0, 80) + '...' : item.bio)}
          </Text>
          {item.bio.length > 80 && (
            <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)}>
              <Text style={styles.moreText}>
                {bioExpanded ? 'less' : 'more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* Side action buttons */}
      <View style={styles.sidebar}>
        {/* Creator profile */}
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => router.push(`/(tabs)/profile/${item.creator.id}`)}
        >
          <Image
            source={{ uri: item.creator.profilePic }}
            style={styles.profilePic}
          />
        </TouchableOpacity>

        {/* Like button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={32}
              color={liked ? '#FF0050' : '#FFFFFF'}
            />
          </Animated.View>
          <Text style={styles.actionText}>
            {item.likes + (liked ? 1 : 0)}
          </Text>
        </TouchableOpacity>

        {/* Comments button */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        {/* Share button */}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={32} color="#FFFFFF" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

        {/* Price tag */}
        <TouchableOpacity style={styles.priceContainer} onPress={handleBuy}>
          <Ionicons name="pricetag" size={32} color="#FFFFFF" />
          <Text style={styles.priceText}>€{item.price}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.45, // Below middle of screen
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sidebar: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
  },
  profileContainer: {
    marginBottom: 20,
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contentInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 80,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  creatorLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  bioContainer: {
    marginTop: 4,
  },
  bioText: {
    fontSize: 13,
    color: '#E0E0E0',
    lineHeight: 18,
  },
  moreText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '600',
    marginTop: 2,
  }
});

export default SlideshowItem;