import React from 'react';
import PostCard from './PostCard';
import { PostWithDetails } from '@shared/schema';

interface MasonryGridProps {
  posts: PostWithDetails[];
  onPostClick: (post: PostWithDetails) => void;
  onLike: (postId: number) => void;
  onShare: (postId: number) => void;
}

export default function MasonryGrid({ posts, onPostClick, onLike, onShare }: MasonryGridProps) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onClick={() => onPostClick(post)}
          onLike={() => onLike(post.id)}
          onShare={() => onShare(post.id)}
        />
      ))}
    </div>
  );
}
