#!/usr/bin/env node

/**
 * YouTube API Tester
 * 
 * This script helps test YouTube API keys and troubleshoot common issues.
 * Usage: node scripts/test-youtube-api.js [api_key]
 */

const https = require('https');

const testYouTubeAPI = async (apiKey) => {
  return new Promise((resolve, reject) => {
    const testUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=music&key=${apiKey}`;
    
    console.log(`Testing YouTube API key: ${apiKey.substring(0, 8)}...`);
    console.log(`URL: ${testUrl}`);
    
    https.get(testUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ SUCCESS! YouTube API is working');
            console.log(`Found ${parsed.items.length} videos`);
            if (parsed.items.length > 0) {
              const video = parsed.items[0];
              console.log(`Sample video: "${video.snippet.title}" by ${video.snippet.channelTitle}`);
              console.log(`Video ID: ${video.id.videoId}`);
            }
            resolve(true);
          } catch (e) {
            console.log('❌ FAILED: Invalid JSON response');
            console.log('Response:', data.substring(0, 500));
            resolve(false);
          }
        } else if (res.statusCode === 400) {
          try {
            const error = JSON.parse(data);
            console.log('❌ FAILED: 400 Bad Request');
            console.log('Error:', error.error.message);
            if (error.error.message.includes('API key')) {
              console.log('💡 FIX: Check if your API key is correct');
            }
          } catch (e) {
            console.log('❌ FAILED: 400 Bad Request - Invalid response format');
          }
          resolve(false);
        } else if (res.statusCode === 403) {
          try {
            const error = JSON.parse(data);
            console.log('❌ FAILED: 403 Forbidden');
            console.log('Error:', error.error.message);
            
            if (error.error.message.includes('disabled')) {
              console.log('💡 FIX: Enable YouTube Data API v3 in Google Cloud Console:');
              console.log('   1. Go to https://console.developers.google.com/');
              console.log('   2. Select your project');
              console.log('   3. Go to "APIs & Services" → "Library"');
              console.log('   4. Search for "YouTube Data API v3"');
              console.log('   5. Click it and press "Enable"');
            } else if (error.error.message.includes('quota')) {
              console.log('💡 FIX: You have exceeded your quota. Wait or request more quota.');
            } else if (error.error.message.includes('referer')) {
              console.log('💡 FIX: API key has HTTP referrer restrictions. Update restrictions in Google Cloud Console.');
            }
          } catch (e) {
            console.log('❌ FAILED: 403 Forbidden - Invalid response format');
            console.log('Response:', data.substring(0, 500));
          }
          resolve(false);
        } else {
          console.log(`❌ FAILED: HTTP ${res.statusCode}`);
          console.log('Response:', data.substring(0, 200));
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log('❌ FAILED: Network error', err.message);
      reject(err);
    });
  });
};

const showSetupInstructions = () => {
  console.log(`
🔧 YouTube API Setup Instructions:

1. CREATE/SELECT PROJECT:
   - Go to https://console.developers.google.com/
   - Create a new project or select existing one

2. ENABLE API:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click it and press "Enable"

3. CREATE API KEY:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated key

4. CONFIGURE KEY (Optional):
   - Click on your API key to configure restrictions
   - For development, you can leave it unrestricted
   - For production, add HTTP referrer restrictions

5. TEST THE KEY:
   - node scripts/test-youtube-api.js YOUR_API_KEY
`);
};

// Main execution
const main = async () => {
  const apiKey = process.argv[2];
  
  if (!apiKey) {
    console.log('Usage: node test-youtube-api.js <api_key>');
    console.log('');
    console.log('Example: node test-youtube-api.js YOUR_YOUTUBE_API_KEY_HERE');
    console.log('');
    showSetupInstructions();
    return;
  }
  
  try {
    await testYouTubeAPI(apiKey);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

if (require.main === module) {
  main();
}

module.exports = { testYouTubeAPI };