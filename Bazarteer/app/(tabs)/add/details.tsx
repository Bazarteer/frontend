import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function DetailsScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const handlePost = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!price.trim() || isNaN(Number(price))) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('type', params.type as string);
      formData.append('userId', user?.id || '');

      if (params.type === 'slideshow' && params.uris) {
        const uris = (params.uris as string).split(',');
        uris.forEach((uri, index) => {
          formData.append('images', {
            uri,
            type: 'image/jpeg',
            name: `image_${index}.jpg`,
          } as any);
        });
      } else if (params.uri) {
        const fileType = params.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const fileName = params.type === 'video' ? 'video.mp4' : 'photo.jpg';

        formData.append('media', {
          uri: params.uri as string,
          type: fileType,
          name: fileName,
        } as any);
      }

      try {
        const body = {
          name: title,
          description: description,
          condition: "NEW", 
          location: "Ljubljana", 
          price: Number(price),
          stock: 1,
          content_urls: params.uris
            ? (params.uris as string).split(',')
            : params.uri
              ? [params.uri as string]
              : [],
        };
        const response = await fetch('http://74.248.81.121/product/publish', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.jwt.trim().replace(/^"+|"+$/g, '')}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Napaka pri naročilu");
        }
      }
      catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Napaka pri prijavi2");
      }
      console.log('Posting content:', { title, description, price, type: params.type });

      Alert.alert('Success', 'Content posted successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Error posting content:', error);
      Alert.alert('Error', 'Failed to post content');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Top left - Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <View style={styles.iconButton}>
            <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.heading}>Add Details</Text>

          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter title"
              placeholderTextColor="#666666"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter description (optional)"
              placeholderTextColor="#666666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* Price Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#666666"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </ScrollView>

      {/* Post Button */}
      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 110,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  postButton: {
    backgroundColor: '#6366F1',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});