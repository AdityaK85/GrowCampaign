import React, { useEffect, useState } from "react";
import CryptoJS from "crypto-js";

const SECRET_KEY = "7e02195ac239df34b8e6cfe813a2c6ef51de9c6b3b6f5479d82facc0e21319aa";

function decryptPostId(encryptedId: string): number | null {
  try {
    const bytes = CryptoJS.AES.decrypt(decodeURIComponent(encryptedId), SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return parseInt(decrypted, 10);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null;
  }
}

export default function SharedPostModal() {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);

  const searchParams = new URLSearchParams(window.location.search);
//   const postId = decryptPostId(searchParams.get('id')) ;
  const encryptedId = searchParams.get('id');
  const postId = encryptedId ? decryptPostId(encryptedId) : null;
  useEffect(() => {
    if (postId) {
      fetch(`/api/posts/${postId}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Post not found");
          }
          return res.json();
        })
        .then((data) => setPost(data))
        .catch((err) => setError(err.message)); // Catch error if post is not found
    }
  }, [postId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl text-center">
          <div className="text-red-600 text-4xl mb-4">🚨</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Post Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="loading-container text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
          <div className="loading-icon animate-pulse text-4xl mb-4">🚀</div>
          <div className="loading-text text-lg text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Left Side: Image */}
            <div className="lg:w-1/2 h-[300px] lg:h-[600px] relative">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-contain bg-gray-100 dark:bg-gray-900"
              />
            </div>

            {/* Right Side: Post Details */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {/* Author Info */}
                <div className="flex items-center mb-6 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex-shrink-0">
                    <img
                      src={post.user.profileImageUrl || "/default-avatar.png"}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900 dark:text-white">{post.user.firstName} {post.user.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Title */}
                <h1 className="font-bold text-2xl sm:text-3xl text-gray-900 dark:text-white mb-4">
                  {post.title}
                </h1>
                
                {/* Description */}
                {post.description && (
                  <div className="prose dark:prose-invert max-w-none mb-6">
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {post.hashtags && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.hashtags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-sm rounded-full text-blue-600 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} GrowCampaign. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
