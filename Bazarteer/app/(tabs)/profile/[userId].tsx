import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/navbar';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - 6) / 3;

interface UserProfile {
  id: string;
  username: string;
  name: string;
  surname: string;
  bio: string;
  profilePic: string;
  sales: number;
  posts: number;
}

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

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const userId = params.userId as string;
  const isOwnProfile = userId === "0";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Product[]>([]);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedSurname, setEditedSurname] = useState('');

  const getUserProfile = async () => {
    try {
      const profileUserId = isOwnProfile ? '0' : userId;
      console.log(profileUserId)
      if (!profileUserId) {
        return null;
      }

      const response = await fetch(
        `http://74.248.81.121/user/getById?userId=${profileUserId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.jwt.trim().replace(/^"+|"+$/g, '')}`
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching user profile");
      }
      
      const userData = await response.json();
      return userData;
    } catch (e) {
      console.error('Error fetching user profile:', e);
      return null;
    }
  };

  const getUserPosts = async () => {
    try {
      const profileUserId = isOwnProfile ? '0' : userId;
      console.log(profileUserId)
      if (!profileUserId) {
        return null;
      }
      
      const response = await fetch(
        `http://74.248.81.121/product/getProductsByOwner?userId=${profileUserId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.jwt.trim().replace(/^"+|"+$/g, '')}`
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error fetching products");
      }
      
      const products = await response.json();
      return products;
    } catch (e) {
      console.error('Error fetching user posts:', e);
      return null;
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      setLoading(true);
      
      const userData = await getUserProfile();
      if (userData) {
        setProfile({
          id: userData.id || userId,
          username: userData.username || '',
          name: userData.name || '',
          surname: userData.surname || '',
          bio: userData.bio || '',
          profilePic: userData.profilePic || `https://i.pravatar.cc/150?img=${userId || 1}`,
          sales: userData.num_sales,
          posts: 0,
        });
        setEditedBio(userData.bio || '');
        setEditedName(userData.name || '');
        setEditedSurname(userData.surname || '');
      }

      const products = await getUserPosts();
      if (products && Array.isArray(products)) {
        setPosts(products);
        setProfile(prev => prev ? { 
          ...prev, 
          posts: products.length,
          sales: prev.sales 
        } : null);
      }
      
      setLoading(false);
    }
    
    fetchProfileData();
  }, [userId, isOwnProfile]);

  const handleProfilePicChange = async () => {
    if (!isOwnProfile || !profile) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant gallery access');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfile(prev => prev ? { ...prev, profilePic: result.assets[0].uri } : null);
    }
  };

  const handleSaveBio = () => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, bio: editedBio } : null);
      setIsEditingBio(false);
    }
  };

  const handleSaveName = () => {
    if (profile) {
      setProfile(prev => prev ? { ...prev, name: editedName, surname: editedSurname } : null);
      setIsEditingName(false);
    }
  };

  const handlePostPress = (product: Product) => {
    router.push({
      pathname: '/(tabs)/post/[postId]',
      params: { 
        id: product.id, 
        location: product.location, 
        title: product.name,
        description: product.description, 
        price: product.price.toString(), 
        content: JSON.stringify(product.content), 
        creatorId: profile?.id || '', 
        creatorName: profile?.name || '', 
        creatorSurname: profile?.surname || '', 
        creatorPic: profile?.profilePic || '' 
      },
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (loading || !profile) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <Navbar activeTab="profile" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Logout Button */}
        <View style={styles.header}>
          {/* Logout Button - Only visible on own profile */}
          {isOwnProfile && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Profile Picture */}
          <TouchableOpacity
            onPress={handleProfilePicChange}
            disabled={!isOwnProfile}
            style={styles.profilePicContainer}
          >
            <Image source={{ uri: profile.profilePic }} style={styles.profilePic} />
            {isOwnProfile && (
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          {isEditingName && isOwnProfile ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="First name"
                placeholderTextColor="#666666"
              />
              <TextInput
                style={styles.nameInput}
                value={editedSurname}
                onChangeText={setEditedSurname}
                placeholder="Last name"
                placeholderTextColor="#666666"
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditedName(profile.name);
                    setEditedSurname(profile.surname);
                    setIsEditingName(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => isOwnProfile && setIsEditingName(true)}
              disabled={!isOwnProfile}
            >
              <Text style={styles.name}>
                {profile.name} {profile.surname}
              </Text>
            </TouchableOpacity>
          )}

          {/* Username */}
          <Text style={styles.username}>@{profile.username}</Text>

          {/* Bio */}
          {isEditingBio && isOwnProfile ? (
            <View style={styles.bioEditContainer}>
              <TextInput
                style={styles.bioInput}
                value={editedBio}
                onChangeText={setEditedBio}
                placeholder="Add a bio..."
                placeholderTextColor="#666666"
                multiline
                maxLength={150}
              />
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditedBio(profile.bio);
                    setIsEditingBio(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveBio}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => isOwnProfile && setIsEditingBio(true)}
              disabled={!isOwnProfile}
            >
              <Text style={styles.bio}>{profile.bio}</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.sales}</Text>
              <Text style={styles.statLabel}>Sales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{profile.posts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        {/* Posts Grid */}
        <View style={styles.postsGrid}>
          {posts.map((product) => {
            const hasMultipleItems = product.content && product.content.length > 1;
            const firstContentUrl = product.content && product.content.length > 0 
              ? product.content[0] 
              : '';
            const isVideo = firstContentUrl && isVideoUrl(firstContentUrl);

            return (
              <TouchableOpacity
                key={product.id}
                style={styles.gridItem}
                onPress={() => handlePostPress(product)}
              >
                {isVideo ? (
                  <View style={styles.videoContainer}>
                    <Video
                      source={{ uri: firstContentUrl }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                      shouldPlay={false}
                      isMuted={true}
                      positionMillis={0}
                    />
                    <View style={styles.videoOverlay}>
                      <Ionicons name="play-circle" size={40} color="rgba(255, 255, 255, 0.9)" />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: firstContentUrl || 'https://via.placeholder.com/400x600' }}
                    style={styles.thumbnail}
                  />
                )}
                
                {hasMultipleItems && (
                  <View style={styles.slideshowIndicator}>
                    <Ionicons name={isVideo ? "videocam" : "images"} size={16} color="#FFFFFF" />
                    <Text style={styles.slideshowCount}>{product.content.length}</Text>
                  </View>
                )}
                
                <View style={styles.thumbnailPrice}>
                  <Text style={styles.thumbnailPriceText}>€{product.price}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Navbar activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  profilePicContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  nameEditContainer: {
    width: '100%',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bioEditContainer: {
    width: '100%',
    marginBottom: 12,
  },
  bioInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#6366F1',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#333333',
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    paddingBottom: 100,
  },
  gridItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH * 1.5,
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  slideshowIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slideshowCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailPrice: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  thumbnailPriceText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});