import React from 'react';
import { X, Heart, Share, ExternalLink, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PostWithDetails } from '@shared/schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import CryptoJS from 'crypto-js';

const SECRET_KEY = "7e02195ac239df34b8e6cfe813a2c6ef51de9c6b3b6f5479d82facc0e21319aa";


// Encryption function using CryptoJS
const encryptPostId = (id: string): string => {
  try {
    // This should match your handleShare encryption method
    const key = SECRET_KEY; // Make sure this matches the key used in handleShare
    const encrypted = CryptoJS.AES.encrypt(id, key);
    return encodeURIComponent(encrypted.toString());
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

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

  console.log('--------post detail modal-------')
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('-------share button-post id-------', post.id)
    const encryptedId = encryptPostId(post.id.toString());
    const shareUrl = `${window.location.origin}/shared-post?id=${encryptedId}`;
    navigator.clipboard.writeText(shareUrl);
    onShare();
  };
  
  const handleViewPost = () => {
    console.log('-------handle view post-post id-------', post.id);
    const encryptedId = encryptPostId(post.id.toString());
    const shareUrl = `${window.location.origin}/shared-post?id=${encryptedId}`;
    console.log('Generated URL:', shareUrl); // For debugging
    window.open(shareUrl, '_blank');
  };
  
  const ViewPost = (post_id: number | string): void => {
    console.log('-------view post-post id-------', post_id);
    const encryptedId = encryptPostId(post_id.toString());
    const shareUrl = `${window.location.origin}/shared-post?id=${encryptedId}`;
    console.log('Generated URL:', shareUrl); // For debugging
    window.open(shareUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl max-h-[95vh] p-0 overflow-hidden bg-white dark:bg-gray-900 rounded-xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Image Section */}
          <div className="relative flex-1 bg-black/5 dark:bg-black/20 min-h-[300px] md:min-h-[600px]">
            <img 
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-contain"
              style={{
                maxHeight: '90vh',
                backgroundColor: 'transparent'
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 bg-white/80 dark:bg-gray-800/80 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Content Section */}
          <div className="w-full md:w-[400px] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {post.user.profileImageUrl ? (
                    <img 
                      src={post.user.profileImageUrl}
                      alt="User avatar" 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                        {displayName[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer">
                    {displayName}
                  </p>
                  <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {post.title}
              </h2>
              
              {post.description && (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-6 whitespace-pre-line">
                    {post.description}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between py-3 border-t border-b border-gray-200 dark:border-gray-700 my-6">
              <div className="flex items-center space-x-4">
                {/* <Button
                  onClick={onLike}
                  variant="ghost"
                  size="sm"
                  className={`rounded-full hover:scale-110 transition-transform ${
                    post.isLiked 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                </Button> */}
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="sm"
                  className="rounded-full hover:scale-110 transition-transform text-gray-700 dark:text-gray-300"
                >
                  <Share className="w-6 h-6" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {/* {post.likesCount > 0 && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
                  </span>
                )} */}
                <Button
                  onClick={handleViewPost}
                  variant="outline"
                  size="sm"
                  className="rounded-full border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 group"
                >
                  <span>View Post</span>
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Tags</h3>
                <ScrollArea className="w-full max-h-24">
                  <div className="flex flex-wrap gap-2 pr-4">
                    {hashtags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-6 space-y-4">
              {post.link && (
                <div className="flex items-center justify-between">
                  <a 
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors group"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
                    <span>Visit Source</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
