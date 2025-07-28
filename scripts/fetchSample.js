const Discogs = require('disconnect').Client;
require('dotenv').config({ path: '.env.local' });

async function fetchSampleData() {
  try {
    // Initialize Discogs client
    const client = new Discogs({
      consumerKey: process.env.DISCOGS_CONSUMER_KEY,
      consumerSecret: process.env.DISCOGS_CONSUMER_SECRET
    });

    console.log('Fetching listings from fanatico_records...\n');

    // Get seller inventory using direct API call
    // Use the REST client to call the inventory endpoint directly
    const response = await client.get('/users/fanatico_records/inventory', {
      status: 'For Sale',
      per_page: 5,
      page: 1
    });

    console.log(`Found ${response.listings ? response.listings.length : 0} listings:\n`);

    // Log each release
    const listings = response.listings || [];
    listings.forEach((listing, index) => {
      const release = listing.release;
      console.log(`${index + 1}. ${release.title} - ${release.artist}`);
      console.log(`   Price: ${listing.price ? `${listing.price.currency} ${listing.price.value}` : 'Not listed'}`);
      console.log(`   Year: ${release.year || 'Unknown'}`);
      console.log(`   Format: ${Array.isArray(release.format) ? release.format.join(', ') : (release.format || 'Unknown')}`);
      console.log(`   Genre: ${Array.isArray(release.genre) ? release.genre.join(', ') : (release.genre || 'Unknown')}`);
      console.log(`   Condition: ${listing.condition || 'Unknown'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error fetching data:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\nMake sure your DISCOGS_KEY and DISCOGS_SECRET are set in .env');
    }
  }
}

fetchSampleData();