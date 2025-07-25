'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

import Header from '@/components/Header';

export default function ProfilePage() {
  const { user } = useUser();
  const [discogsUsername, setDiscogsUsername] = useState('');
  const [savedUsername, setSavedUsername] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSavedUsername = async () => {
      try {
        const response = await fetch('/api/user/discogs-username');
        if (response.ok) {
          const data = await response.json();
          setSavedUsername(data.discogsUsername || '');
          setDiscogsUsername(data.discogsUsername || '');
        }
      } catch (error) {
        console.error('Failed to load saved username:', error);
      }
    };

    if (user) {
      loadSavedUsername();
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/discogs-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ discogsUsername }),
      });

      if (response.ok) {
        setSavedUsername(discogsUsername);
      } else {
        throw new Error('Failed to save username');
      }
    } catch (error) {
      console.error('Failed to save username:', error);
      alert('Failed to save username. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Profile Settings
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>

          <div className="mb-6">
            <label 
              htmlFor="discogs-username" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Discogs Store Username
            </label>
            <input
              id="discogs-username"
              type="text"
              value={discogsUsername}
              onChange={(e) => setDiscogsUsername(e.target.value)}
              placeholder="Enter your Discogs store username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              This will display your store's inventory in a scrollable feed for customers to browse and purchase.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || discogsUsername === savedUsername}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Username'}
          </button>

          {savedUsername && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                ✅ Store connected: <strong>{savedUsername}</strong>
              </p>
              <p className="text-green-700 text-xs mt-1">
                Your store inventory is now live on Rotation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}