import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { VideoContent } from './content-item';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface VideoItemProps {
  item: VideoContent;
  isActive: boolean;
}

const VideoItem: React.FC<VideoItemProps> = ({ item, isActive }) => {
  const [liked, setLiked] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [bioExpanded, setBioExpanded] = useState(false);
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const manageVideo = async () => {
      if (!videoRef.current || !isMountedRef.current) return;

      try {
        if (isActive) {
          if (!isLoaded) {
            await videoRef.current.loadAsync(
              { uri: item.videoUrl },
              { shouldPlay: true, isLooping: true, isMuted: false },
              false
            );
          } else {
            await videoRef.current.playAsync();
          }
        } else {
          if (isLoaded) {
            await videoRef.current.stopAsync();
            await videoRef.current.unloadAsync();
            if (isMountedRef.current) {
              setIsLoaded(false);
            }
          }
        }
      } catch (error) {
        console.error('Video management error:', error);
      }
    };

    manageVideo();
  }, [isActive, isLoaded, item.videoUrl]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(console.error);
        videoRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

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
  };

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

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!isMountedRef.current) return;
    
    if (status.isLoaded) {
      if (!isLoaded) {
        setIsLoaded(true);
      }
      if (status.didJustFinish && !status.isLooping) {
        videoRef.current?.replayAsync();
      }
    } else if (status.error) {
      console.error('Video error:', status.error);
    }
  };

  const onLoad = () => {
    setIsLoaded(true);
  };

  const onError = (error: string) => {
    console.error('Video load error:', error);
  };

  return (
    <View style={styles.container}>
      {/* Full-screen video */}
      <Video
        ref={videoRef}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
        onLoad={onLoad}
        onError={onError}
        progressUpdateIntervalMillis={500}
      />

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

      <View style={styles.sidebar}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/profile/[userId]',
              params: { userId: item.creator.id }
            });
          }}
        >
          <Image
            source={{ uri: item.creator.profilePic }}
            style={styles.profilePic}
          />
        </TouchableOpacity>

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

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={32} color="#FFFFFF" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={32} color="#FFFFFF" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

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
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
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

export default VideoItem;