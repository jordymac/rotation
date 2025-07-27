import { Discogs } from 'disconnect';

interface DiscogsConfig {
  consumerKey: string;
  consumerSecret: string;
  userToken?: string;
}

// Config loader that pulls from environment variables
function getDiscogsConfig(userToken?: string): DiscogsConfig {
  const consumerKey = process.env.DISCOGS_CONSUMER_KEY;
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      'Missing Discogs credentials. Please set DISCOGS_CONSUMER_KEY and DISCOGS_CONSUMER_SECRET in your environment variables.'
    );
  }

  return {
    consumerKey,
    consumerSecret,
    userToken,
  };
}

export class DiscogsService {
  private client: any;
  private config: DiscogsConfig;

  constructor(userToken?: string) {
    this.config = getDiscogsConfig(userToken);
    this.client = new Discogs({
      consumerKey: this.config.consumerKey,
      consumerSecret: this.config.consumerSecret,
      userToken: this.config.userToken,
    });
  }

  // OAuth flow methods
  static getAuthUrl(callbackUrl: string): Promise<{ url: string; requestToken: string; requestSecret: string }> {
    const config = getDiscogsConfig();
    const client = new Discogs({
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
    });
    
    return new Promise((resolve, reject) => {
      client.getRequestToken(callbackUrl, (err: any, requestData: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            url: requestData.authorizeUrl,
            requestToken: requestData.token,
            requestSecret: requestData.secret,
          });
        }
      });
    });
  }

  static getAccessToken(
    requestToken: string,
    requestSecret: string,
    verifier: string
  ): Promise<{ token: string; secret: string }> {
    const config = getDiscogsConfig();
    const client = new Discogs({
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
    });

    return new Promise((resolve, reject) => {
      client.getAccessToken(requestToken, requestSecret, verifier, (err: any, accessData: any) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            token: accessData.token,
            secret: accessData.secret,
          });
        }
      });
    });
  }

  // User methods
  async getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.user().getIdentity((err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async getUserInventory(username: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.user().inventory().getReleases(username, options, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  // Wishlist methods
  async addToWishlist(releaseId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.user().wantlist().addRelease(releaseId, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async removeFromWishlist(releaseId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.user().wantlist().removeRelease(releaseId, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async getWishlist(username: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.user().wantlist().getReleases(username, options, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  // Database/Release methods
  async getRelease(releaseId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.database().getRelease(releaseId, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async searchReleases(query: string, options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.database().search(query, options, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  // Marketplace methods (for store inventory management)
  async getMarketplaceListing(listingId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.marketplace().getListing(listingId, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  async updateMarketplaceListing(listingId: number, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.client.marketplace().editListing(listingId, data, (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

// Factory function to create service with environment config
export function createDiscogsService(userToken?: string): DiscogsService {
  return new DiscogsService(userToken);
}