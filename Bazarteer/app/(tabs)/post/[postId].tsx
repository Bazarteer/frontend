import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ContentItem, { Content } from '@/components/content-item';

export default function PostDetailScreen() {
  const params = useLocalSearchParams();
  
  const postId = params.id as string;
  const location = params.location as string;
  const title = params.title as string;
  const description = params.description as string;
  const price = params.price as string;
  const contentRaw = params.content;
  const creatorId = params.creatorId as string;
  const creatorName = params.creatorName as string;
  const creatorSurname = params.creatorSurname as string;
  const creatorPic = params.creatorPic as string;

  let contentArray: string[] = [];
  try {
    if (typeof contentRaw === 'string') {
      contentArray = JSON.parse(contentRaw);
    } else if (Array.isArray(contentRaw)) {
      contentArray = contentRaw as string[];
    } else if (contentRaw) {
      contentArray = [contentRaw as string];
    }
  } catch (error) {
    console.error('Error parsing content:', error);
    contentArray = [];
  }

  const isVideo = contentArray.length > 0 && 
    (contentArray[0].toLowerCase().endsWith('.mp4') || 
     contentArray[0].toLowerCase().endsWith('.mov') ||
     contentArray[0].toLowerCase().endsWith('.avi'));

  const post: Content = {
    id: parseInt(postId) || 0,
    title: title || '',
    creator: {
      id: creatorId || '1',
      username: '', 
      profilePic: creatorPic || 'https://i.pravatar.cc/150?img=1',
      name: creatorName || '',
      surname: creatorSurname || ''
    },
    likes: 0, 
    comments: 0, 
    shares: 0, 
    price: price || '0',
    location: {
      city: location || 'Unknown',
      country: '' 
    },
    bio: description || '',
    type: isVideo ? 'video' : 'slideshow',
    ...(isVideo 
      ? { videoUrl: contentArray[0] }
      : { images: contentArray }
    )
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <View style={styles.backButtonInner}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Post content */}
      <ContentItem item={post} isActive={true} />
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
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});