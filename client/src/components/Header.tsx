import React, { useState } from 'react';
import { Search, Bell, Plus, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from './ThemeProvider';
import CreatePostModal from './CreatePostModal';

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger search by updating the query in the URL or parent component
    window.dispatchEvent(new CustomEvent('search', { detail: searchQuery }));
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email || 'User';

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-600 dark:bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🌱</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">GrowCampaign</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search for ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-full"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-full"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </Button>

              {/* Create Post Button */}
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <Button
                variant="ghost"
                size="sm"
                className="p-2 rounded-full relative"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 dark:bg-red-500 rounded-full"></span>
              </Button>

              {/* Profile */}
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl}
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {displayName}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
