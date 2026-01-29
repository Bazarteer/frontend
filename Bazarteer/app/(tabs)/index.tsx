import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/navbar';
import ContentItem, { Content } from '@/components/content-item';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description: string;
  condition: string;
  ownerId: string;
  ownerUsername: string;
  location: string;
  price: number;
  stock: number;
  content: string[];
  createdAt: string;
}

interface ProductsResponse {
  products: Product[];
}

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

const transformProductToContent = (product: Product, index: number): Content => {
  const hasVideo = product.content.some(url => isVideoUrl(url));

  const baseContent = {
    id: parseInt(product.id) || 0,
    _key: `${product.id}-${Date.now()}-${index}`,
    title: product.name,
    creator: {
      id: product.ownerId,
      username: product.ownerUsername || 'Unknown User',
      profilePic: `https://i.pravatar.cc/150?img=${parseInt(product.id) % 70}`,
      name: product.ownerUsername || 'Unknown',
      surname: '',
    },
    likes: Math.floor(Math.random() * 10000) + 100,
    comments: Math.floor(Math.random() * 1000) + 10,
    shares: Math.floor(Math.random() * 500) + 5,
    price: product.price.toFixed(2),
    location: {
      city: product.location,
      country: "Slovenija",
    },
    bio: product.description,
  };

  if (hasVideo) {
    const videoUrl = product.content.find(url => isVideoUrl(url)) || product.content[0];
    return {
      ...baseContent,
      type: 'video',
      videoUrl: videoUrl,
    };
  } else {
    return {
      ...baseContent,
      type: 'slideshow',
      images: product.content,
    };
  }
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [content, setContent] = useState<Content[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async (append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://74.248.81.121/product/getRecommended', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.jwt.trim().replace(/^"+|"+$/g, '')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProductsResponse = await response.json();

      if (!data.products || data.products.length === 0) {
        setError('No products available');
        return;
      }

      const transformedContent = data.products.map(transformProductToContent);
      setContent(prev => (append ? [...prev, ...transformedContent] : transformedContent));
    } catch (error) {
      console.error('Error fetching content:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch content');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setCurrentIndex(index);

      if (index >= content.length - 3 && !isFetchingRef.current) {
        fetchContent(true);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(({ item, index }: { item: Content; index: number }) => (
    <ContentItem item={item} isActive={index === currentIndex} />
  ), [currentIndex]);

  const keyExtractor = useCallback((item: Content & {_key?: string}) => item._key ?? item.id.toString(), []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), []);

  if (error && content.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchContent()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <Navbar activeTab="home" />
      </View>
    );
  }

  if (isLoading && content.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading...</Text>
        <Navbar activeTab="home" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={content}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        windowSize={3}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={100}
      />
      <Navbar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});