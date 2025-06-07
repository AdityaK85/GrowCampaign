import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

type ViewPostsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
};

const ViewPostsModal: React.FC<ViewPostsModalProps> = ({ isOpen, onClose, userId }) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/my_post?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const deletePost = async (postId: string, userId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        // Set success message and open the dialog
        setSuccessMessage(data.message);
        setShowDialog(true);
        setPosts((prev) => prev.filter((post) => post.id !== postId)); // Remove the deleted post from the list
      } else {
        // If not successful, show error dialog
        setErrorMessage('Failed to delete post');
        setShowDialog(true);
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      setErrorMessage('An error occurred while deleting the post');
      setShowDialog(true);
    } finally {
      setConfirmDeleteId(null); // Reset the delete confirmation state
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPosts();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-5xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4 text-left">Your Posts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {posts.length === 0 ? (
            <p className="text-gray-500 text-center">No posts found.</p>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col md:flex-row gap-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full md:w-40 h-32 object-cover rounded-md"
                  />
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{post.description}</p>
                </div>

                <div className="flex items-start justify-end">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setConfirmDeleteId(post.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* <div className="mt-6 text-right">
          <Button onClick={onClose}>Close</Button>
        </div> */}
      </DialogContent>

      {/* Confirmation Alert Dialog */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently remove your post from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (confirmDeleteId) {
                  deletePost(confirmDeleteId, userId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Message Dialog */}
      {showDialog && (
        <AlertDialog open={showDialog} onOpenChange={() => setShowDialog(false)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{successMessage ? 'Success' : 'Error'}</AlertDialogTitle>
              <AlertDialogDescription>{successMessage || errorMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDialog(false)}>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Dialog>
  );
};

export default ViewPostsModal;
