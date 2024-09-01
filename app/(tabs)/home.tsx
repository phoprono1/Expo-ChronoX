import { View } from 'react-native';
import React from 'react';
import PostCard from '@/components/cards/PostCard'; // Import component PostCard

const Home = () => {
  return (
    <View className="flex-1 bg-white p-4">
      <PostCard 
        avatar="https://picsum.photos/200" 
        username="Nguyễn Văn A" 
        email="nguyenvana@example.com" 
        mediaUri="https://picsum.photos/200" 
        title="Tiêu đề bài viết" 
        hashtags={['#hashtag1', '#hashtag2']} 
        onLike={() => console.log('Liked!')} 
        onComment={() => console.log('Commented!')} 
      />
    </View>
  );
};

export default Home;