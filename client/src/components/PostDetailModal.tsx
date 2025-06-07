import React from 'react';
import { X, Heart, Share, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostWithDetails } from '@shared/schema';

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostWithDetails | null;
  onLike: () => void;
  onShare: () => void;
}

export default function PostDetailModal({ 
  isOpen, 
  onClose, 
  post, 
  onLike, 
  onShare 
}: PostDetailModalProps) {
  if (!post) return null;

  const hashtags = post.hashtags ? post.hashtags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  const displayName = post.user.firstName && post.user.lastName 
    ? `${post.user.firstName} ${post.user.lastName}`
    : post.user.email || 'Anonymous';

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      // const shareUrl = `${window.location.origin}/shared-post?id=${post.id}`;
      // navigator.clipboard.writeText(shareUrl);
      onShare();
    };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1">
            <img 
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content Section */}
          <div className="w-96 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {post.user.profileImageUrl && (
                  <img 
                    src={post.user.profileImageUrl}
                    alt="User avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </div>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button> */}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{post.title}</h2>
            
            {post.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{post.description}</p>
            )}

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {hashtags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full text-gray-600 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mb-6">
              {/* <Button
                onClick={onLike}
                variant={post.isLiked ? "default" : "outline"}
                className={`flex items-center space-x-2 ${
                  post.isLiked 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                <span>{post.likesCount}</span>
              </Button> */}
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Share className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>

            {/* Link */}
            {post.link && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <a 
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-red-600 dark:text-red-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Source</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
