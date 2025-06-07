import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const handleLogin = () => {
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=734802701574-fidqs45jr50pj35mmvsps46e50uitqll.apps.googleusercontent.com&redirect_uri=http://localhost:5000/api/callback&scope=openid%20email%20profile&access_type=offline&prompt=consent';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">🌱</span>
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                GrowCampaign
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and share ideas that inspire
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <span>Create beautiful visual posts</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <span>Share ideas with the community</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                <span>Discover trending content</span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              Get Started
            </Button>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Join thousands of creators sharing their inspiration
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
