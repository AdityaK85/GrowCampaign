import React , {useState}  from 'react';
import { Heart, Share } from 'lucide-react';
import { PostWithDetails } from '@shared/schema';

interface PostCardProps {
  post: PostWithDetails;
  onClick: () => void;
  onLike: () => void;
  onShare: () => void;
}

export default function PostCard({ post, onClick, onLike, onShare }: PostCardProps) {
  const hashtags = post.hashtags ? post.hashtags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const displayName = post.user.firstName && post.user.lastName 
    ? `${post.user.firstName} ${post.user.lastName}`
    : post.user.email || 'Anonymous';

  // const handleLike = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   onLike();
  // };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onLike(); // no args
      setIsLiked(prev => !prev);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (err) {
      console.error("Error handling like:", err);
    }
  };

  // const handleShare = (e: React.MouseEvent) => {
  //   // e.stopPropagation();
  //   // onShare();
  //   e.stopPropagation();
  //   const shareUrl = `${window.location.origin}/shared-post?id=${post.id}`;
  //   navigator.clipboard.writeText(shareUrl);
  //   // alert('Link copied to clipboard!');
  //   onShare();
  // };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // const shareUrl = `${window.location.origin}/shared-post?id=${post.id}`;
    // console.log('--------------share url------------', shareUrl)
    // navigator.clipboard.writeText(shareUrl);
    onShare();
  };

  return (
    <div 
      className="break-inside-avoid bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={post.imageUrl} 
        alt={post.title}
        className="w-full rounded-t-xl object-cover"
        loading="lazy"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{post.title}</h3>
        {post.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{post.description}</p>
        )}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hashtags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full text-gray-600 dark:text-gray-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between" style={{gap:'12px'}} >
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{likesCount}</span>
            </button>
            <button 
              onClick={handleShare}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <Share className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
          </div>
          <div className="flex items-center space-x-1">
            {post.user.profileImageUrl && (
              <img 
                src={post.user.profileImageUrl}
                alt="User avatar" 
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <span className="text-xs text-gray-500">{displayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
