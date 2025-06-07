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
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden flex">
        
        {/* Left Side: Image */}
        <div className="w-1/2">
          <img
            src={post.imageUrl}
            alt={post.title}
            className="w-full h-full object-cover rounded-l-lg"
          />
        </div>

        {/* Right Side: Post Details */}
        <div className="w-1/2 p-8 flex flex-col justify-between">
          <div>
            {/* Title */}
            <h3 className="font-bold text-3xl text-gray-900 dark:text-white mb-4">{post.title}</h3>
            
            {/* Description */}
            {post.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">{post.description}</p>
            )}

            {/* Author Info */}
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                <img
                  src={post.user.profileImageUrl || "/default-avatar.png"}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3">
                <p className="font-semibold text-gray-900 dark:text-white">{post.user.firstName} {post.user.lastName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Hashtags */}
            {post.hashtags && (
              <div className="flex flex-wrap gap-3 mb-6">
                {post.hashtags.split(',').map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-200 dark:bg-gray-700 text-sm rounded-full text-blue-600 dark:text-gray-300"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Button */}
          {/* <button
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-300"
            onClick={() => alert("Share action")}
            style={{width:'fit-content'}}
          >
            Share
          </button> */}
        </div>
      </div>
      <div className="absolute bottom-4 text-center w-full text-sm text-gray-500 dark:text-gray-400">
      © {new Date().getFullYear()} GrowCampaign. All rights reserved.
    </div>
    </div>
  );
}
