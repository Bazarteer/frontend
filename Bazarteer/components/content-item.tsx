import React from 'react';
import { View } from 'react-native';
import VideoItem from './video-item';
import SlideshowItem from './slideshow-item';

export interface Creator {
  id: string;
  username: string;
  profilePic: string;
  name: string;
  surname: string;
}

export interface BaseContent {
  id: number;
  creator: Creator;
  likes: number;
  comments: number;
  shares: number;
  price: string;
  title: string;
  location: { 
    city: string;
    country: string;
  };
  bio: string;
}

export interface VideoContent extends BaseContent {
  type: 'video';
  videoUrl: string;
}

export interface SlideshowContent extends BaseContent {
  type: 'slideshow';
  images: string[]; 
}

export type Content = VideoContent | SlideshowContent;

interface ContentItemProps {
  item: Content;
  isActive: boolean;
}

const ContentItem: React.FC<ContentItemProps> = ({ item, isActive }) => {
  if (item.type === 'video') {
    return <VideoItem item={item} isActive={isActive} />;
  } else {
    return <SlideshowItem item={item} isActive={isActive} />;
  }
};

export default ContentItem;