#!/usr/bin/env node

/**
 * SoundCloud Client ID Tester
 * 
 * This script helps test SoundCloud client IDs to see if they're working.
 * Usage: node scripts/test-soundcloud-client-id.js [client_id]
 */

const https = require('https');

const testClientId = async (clientId) => {
  return new Promise((resolve, reject) => {
    const testUrl = `https://api.soundcloud.com/tracks?q=music&client_id=${clientId}&limit=1`;
    
    console.log(`Testing client ID: ${clientId}`);
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
            console.log('✅ SUCCESS! Client ID is working');
            console.log(`Found ${parsed.length} tracks`);
            if (parsed.length > 0) {
              console.log(`Sample track: "${parsed[0].title}" by ${parsed[0].user.username}`);
            }
            resolve(true);
          } catch (e) {
            console.log('❌ FAILED: Invalid JSON response');
            resolve(false);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ FAILED: 401 Unauthorized - Client ID is invalid or expired');
          resolve(false);
        } else if (res.statusCode === 403) {
          console.log('❌ FAILED: 403 Forbidden - Client ID access restricted');
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

const extractClientIdsFromPage = () => {
  console.log(`
🔍 How to find new SoundCloud client IDs:

1. BROWSER METHOD (Recommended):
   - Go to https://soundcloud.com
   - Open Developer Tools (F12) → Network tab
   - Search for any track or browse music
   - Look for requests to 'api.soundcloud.com' or 'api-v2.soundcloud.com'
   - Find 'client_id' parameter in query strings
   - Example: client_id=abcd1234efgh5678

2. CONSOLE METHOD:
   - Go to https://soundcloud.com
   - Open console (F12) → Console tab
   - Paste this code:

   fetch('https://soundcloud.com')
     .then(r => r.text())
     .then(html => {
       const matches = html.match(/client_id[\\"\\'\\s:=]+([a-zA-Z0-9]{32})/g);
       if (matches) {
         matches.forEach(match => {
           const id = match.match(/([a-zA-Z0-9]{32})/);
           if (id) console.log('Found client ID:', id[1]);
         });
       }
     });

3. MULTIPLE IDs STRATEGY:
   - Extract 3-5 different client IDs
   - Test each one with this script
   - Use the working ones in rotation
`);
};

// Main execution
const main = async () => {
  const clientId = process.argv[2];
  
  if (!clientId) {
    console.log('Usage: node test-soundcloud-client-id.js <client_id>');
    console.log('');
    console.log('Example: node test-soundcloud-client-id.js CCbVVppXByCBrh4OcGmbrgyYhni0SgvL');
    console.log('');
    extractClientIdsFromPage();
    return;
  }
  
  try {
    await testClientId(clientId);
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

if (require.main === module) {
  main();
}

module.exports = { testClientId };