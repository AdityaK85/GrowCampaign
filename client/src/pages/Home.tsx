import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/authUtils';
import Header from '@/components/Header';
import MasonryGrid from '@/components/MasonryGrid';
import PostDetailModal from '@/components/PostDetailModal';
import CreatePostModal from '@/components/CreatePostModal';
import { PostWithDetails } from '@shared/schema';

export default function Home() {
  const [selectedPost, setSelectedPost] = useState<PostWithDetails | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch posts
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/posts'],
    retry: false,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest('POST', `/api/posts/${postId}/like`);
      return response.json();
    },
    onSuccess: (data, postId) => {
      // Update posts in cache
      queryClient.setQueryData(['/api/posts'], (oldPosts: PostWithDetails[] = []) =>
        oldPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: data.isLiked, likesCount: data.likesCount }
            : post
        )
      );
      
      // Update selected post if it's the same one
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          isLiked: data.isLiked,
          likesCount: data.likesCount
        } : null);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: async (postId: number) => {
      const response = await apiRequest('POST', `/api/posts/${postId}/share`, {
        shareType: 'copy_link',
        referrer: window.location.href,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Success",
          description: "Link copied to clipboard!",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to copy link to clipboard.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate share link.",
        variant: "destructive",
      });
    },
  });

  const handlePostClick = (post: PostWithDetails) => {
    setSelectedPost(post);
  };

  const handleLike = (postId: number) => {
    likeMutation.mutate(postId);
  };

  const handleShare = (postId: number) => {
    shareMutation.mutate(postId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="break-inside-avoid bg-white dark:bg-gray-800 rounded-xl shadow-sm animate-pulse"
              >
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Be the first to share something inspiring!
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          <MasonryGrid
            posts={posts}
            onPostClick={handlePostClick}
            onLike={handleLike}
            onShare={handleShare}
          />
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-40"
        size="lg"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
      <PostDetailModal
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        post={selectedPost}
        onLike={() => selectedPost && handleLike(selectedPost.id)}
        onShare={() => selectedPost && handleShare(selectedPost.id)}
      />

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
