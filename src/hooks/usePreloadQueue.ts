'use client';

import { useCallback, useRef, useEffect } from 'react';

interface PreloadTask {
  id: string;
  priority: 'high' | 'medium' | 'low';
  execute: () => Promise<void>;
  type: 'image' | 'audio' | 'data';
}

interface UsePreloadQueueOptions {
  maxConcurrent?: number;
  enabled?: boolean;
}

export function usePreloadQueue({
  maxConcurrent = 3,
  enabled = true
}: UsePreloadQueueOptions = {}) {
  const queueRef = useRef<PreloadTask[]>([]);
  const runningRef = useRef<Set<string>>(new Set());
  const completedRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  console.log('🎯 usePreloadQueue initialized:', { maxConcurrent, enabled });

  // Process the queue
  const processQueue = useCallback(async () => {
    if (!enabled || runningRef.current.size >= maxConcurrent) {
      return;
    }

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    queueRef.current.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // Find next task to execute
    const nextTask = queueRef.current.find(task => 
      !runningRef.current.has(task.id) && 
      !completedRef.current.has(task.id)
    );

    if (!nextTask) {
      return;
    }

    // Start executing the task
    runningRef.current.add(nextTask.id);
    
    console.log('🚀 Starting preload task:', {
      id: nextTask.id,
      type: nextTask.type,
      priority: nextTask.priority,
      running: runningRef.current.size,
      queued: queueRef.current.length
    });

    try {
      await nextTask.execute();
      completedRef.current.add(nextTask.id);
      
      console.log('✅ Completed preload task:', nextTask.id);
    } catch (error) {
      console.warn('❌ Failed preload task:', nextTask.id, error);
    } finally {
      runningRef.current.delete(nextTask.id);
      
      // Remove completed task from queue
      queueRef.current = queueRef.current.filter(task => task.id !== nextTask.id);
      
      // Process next task if queue is not empty
      if (queueRef.current.length > 0) {
        setTimeout(processQueue, 0);
      }
    }
  }, [enabled, maxConcurrent]);

  // Add task to queue
  const addTask = useCallback((task: PreloadTask) => {
    if (!enabled || completedRef.current.has(task.id)) {
      return;
    }

    // Remove existing task with same ID if it exists
    queueRef.current = queueRef.current.filter(t => t.id !== task.id);
    
    // Add new task
    queueRef.current.push(task);
    
    console.log('📋 Added preload task:', {
      id: task.id,
      type: task.type,
      priority: task.priority,
      queueLength: queueRef.current.length
    });

    // Start processing
    processQueue();
  }, [enabled, processQueue]);

  // Preload image
  const preloadImage = useCallback((url: string, priority: PreloadTask['priority'] = 'medium') => {
    addTask({
      id: `image:${url}`,
      type: 'image',
      priority,
      execute: async () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
          img.src = url;
        });
      }
    });
  }, [addTask]);

  // Preload audio (YouTube warm-up)
  const preloadAudio = useCallback((videoId: string, priority: PreloadTask['priority'] = 'medium') => {
    addTask({
      id: `audio:${videoId}`,
      type: 'audio',
      priority,
      execute: async () => {
        // Create invisible iframe to warm up YouTube embed
        return new Promise((resolve) => {
          const iframe = document.createElement('iframe');
          iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&showinfo=0`;
          iframe.style.display = 'none';
          iframe.style.width = '1px';
          iframe.style.height = '1px';
          
          iframe.onload = () => {
            // Remove after a short delay to allow YouTube to initialize
            setTimeout(() => {
              document.body.removeChild(iframe);
              resolve();
            }, 1000);
          };
          
          document.body.appendChild(iframe);
        });
      }
    });
  }, [addTask]);

  // Preload data
  const preloadData = useCallback((url: string, priority: PreloadTask['priority'] = 'low') => {
    addTask({
      id: `data:${url}`,
      type: 'data',
      priority,
      execute: async () => {
        const response = await fetch(url, {
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Read the response to cache it
        await response.text();
      }
    });
  }, [addTask]);

  // Clear queue
  const clearQueue = useCallback(() => {
    queueRef.current = [];
    runningRef.current.clear();
    console.log('🗑️ Preload queue cleared');
  }, []);

  // Get queue stats
  const getStats = useCallback(() => {
    return {
      queued: queueRef.current.length,
      running: runningRef.current.size,
      completed: completedRef.current.size,
      total: queueRef.current.length + runningRef.current.size + completedRef.current.size
    };
  }, []);

  // Setup abort controller for cleanup
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    return () => {
      abortControllerRef.current?.abort();
      clearQueue();
    };
  }, [clearQueue]);

  return {
    // Core methods
    addTask,
    preloadImage,
    preloadAudio,
    preloadData,
    
    // Queue management
    clearQueue,
    getStats,
    
    // State checks
    isRunning: () => runningRef.current.size > 0,
    isCompleted: (id: string) => completedRef.current.has(id),
    
    // Configuration
    maxConcurrent,
    enabled
  };
}