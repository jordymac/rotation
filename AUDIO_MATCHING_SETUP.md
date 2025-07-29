# Audio Matching API Setup Guide

This guide explains how to set up the YouTube and SoundCloud APIs for the audio matching feature.

## YouTube API Setup

1. **Get a YouTube API Key:**
   - Go to [Google Cloud Console](https://console.developers.google.com/)
   - Create a new project or select an existing one
   - Enable the **YouTube Data API v3**
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key

2. **Add to Environment:**
   ```bash
   NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
   ```

## SoundCloud API Setup

Since SoundCloud closed new developer app registrations, you need to extract a client ID from their website:

### Method 1: Extract from Network Requests

1. **Open SoundCloud in Browser:**
   - Go to [soundcloud.com](https://soundcloud.com)
   - Open Developer Tools (F12)
   - Go to the **Network** tab

2. **Find API Requests:**
   - Search for any track or browse music
   - Look for requests to `api-v2.soundcloud.com` or `api.soundcloud.com`
   - Find the `client_id` parameter in the query string
   - Example: `https://api-v2.soundcloud.com/search/tracks?q=music&client_id=YOUR_CLIENT_ID_HERE`

3. **Copy the Client ID:**
   - The client ID is usually a long alphanumeric string
   - Example: `a3e059563d7fd3372b49b37f00a00bcf`

### Method 2: Extract from Page Source

1. **View Page Source:**
   - Go to any SoundCloud page
   - View source (Ctrl+U)
   - Search for `client_id` or `clientId`
   - Look for JavaScript variables containing the client ID

### Method 3: Use Browser Console

1. **Open Browser Console:**
   - Go to [soundcloud.com](https://soundcloud.com)
   - Open Developer Tools (F12) → Console tab
   - Run this JavaScript:
   ```javascript
   // Look for client ID in page scripts
   Array.from(document.scripts)
     .map(s => s.src)
     .filter(src => src.includes('soundcloud'))
     .forEach(src => {
       fetch(src)
         .then(r => r.text())
         .then(text => {
           const matches = text.match(/client_id[\"']?:\\s*[\"']([a-zA-Z0-9]+)[\"']/g);
           if (matches) console.log('Found client IDs:', matches);
         });
     });
   ```

## Environment Configuration

Add both API credentials to your `.env.local` file:

```bash
# YouTube API
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here

# SoundCloud API (extracted client ID)
NEXT_PUBLIC_SOUNDCLOUD_CLIENT_ID=your_extracted_client_id_here
```

## Testing the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test audio matching:**
   - Go to a release page
   - Click "Verify Audio Matches"
   - Check the browser console for API logs

3. **Expected behavior:**
   - YouTube: Should show real video results with embeds
   - SoundCloud: Should show real tracks with playable audio
   - Fallback: If APIs fail, mock data will be used

## Troubleshooting

### YouTube API Issues:
- **403 Forbidden**: Check if YouTube Data API v3 is enabled
- **400 Bad Request**: Verify your API key is correct
- **Quota Exceeded**: YouTube has daily quotas; wait or get a higher quota

### SoundCloud API Issues:
- **401 Unauthorized**: Your client ID may be expired/invalid
- **No audio playback**: The client ID might not have access to transcodings
- **Rate limiting**: SoundCloud may limit requests; implement delays if needed

### Getting Fresh Client IDs:
- SoundCloud client IDs can expire or change
- Repeat the extraction process if you get 401 errors
- Consider rotating between multiple client IDs for higher availability

## API Usage Notes

- **YouTube**: 100 quota units per search (10,000 units free per day)
- **SoundCloud**: No official rate limits documented, but be respectful
- **Caching**: Consider implementing response caching to reduce API calls
- **Fallbacks**: The system gracefully falls back to mock data if APIs fail

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** for all sensitive credentials
- **Client-side exposure**: `NEXT_PUBLIC_*` variables are exposed to browsers
- **Consider server-side proxying** for production to hide credentials

## Testing SoundCloud Client IDs

We've included a helper script to test client IDs:

```bash
# Test a specific client ID
node scripts/test-soundcloud-client-id.js CCbVVppXByCBrh4OcGmbrgyYhni0SgvL

# Get help finding new client IDs  
node scripts/test-soundcloud-client-id.js
```

### Client ID Management Strategy:

1. **Extract Multiple IDs**: Get 3-5 different client IDs from SoundCloud
2. **Test Each One**: Use the test script to verify they work
3. **Implement Rotation**: Use working IDs as fallbacks
4. **Monitor Expiration**: Watch for 401/403 errors indicating expired IDs

### Current Status:
- The client ID `CCbVVppXByCBrh4OcGmbrgyYhni0SgvL` may need refresh
- SoundCloud client IDs expire frequently and need regular updates
- Use the extraction methods above to find fresh, working client IDs