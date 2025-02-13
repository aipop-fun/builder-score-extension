// Types

enum PlatformType {
  TWITTER = 'twitter',
  GITHUB = 'github',
  FARCASTER = 'farcaster',
  ENS = 'ens',
  LENS = 'lens'
}

interface IdentityQuery {
  provider: string;
  username: string;
}

interface Social {
  source: string;
  location: string | null;
  profile_bio: string;
  profile_url: string;
  disconnected: boolean;
  profile_name: string;
  follower_count: number;
  following_count: number;
  profile_image_url: string;
  profile_display_name: string;
}

interface DataSources {
  profile_bio: string;
  profile_name: string;
  profile_image_url: string;
  profile_display_name: string;
}

interface PassportProfile {
  bio: string;
  display_name: string;
  image_url: string;
  location: string | null;
  name: string;
  tags: string[];
}


interface PassportData {
  passport_id: number;
  activity_score: number;
  identity_score: number;
  skills_score: number;
  score: number;
  human_checkmark: boolean;
  main_wallet: string;
  main_wallet_changed_at: string | null;
  display_name: string;
  profile_name: string;
  bio: string;
  image_url: string;
  location: string | null;
  tags: string[];
  data_sources: DataSources;
  passport_profile?: PassportProfile;
  verified: boolean;
  verified_wallets: string[];
  onchain: boolean;
  merged: boolean;
  pending_kyc: boolean;
  nominations_received_count: number;
  created_at: string;
  last_calculated_at: string;
  socials_calculated_at: string;
  socials: Social[];
  user_id: string;
  user_email: string;
  updated_at: string;
  calculating_score: boolean;
  last_updated: string;
  twitter_username: string;
}

interface APIResponse {
  status: string;
  passports: PassportData[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface BuilderScoreData {
  score: number;
  verified: boolean;
  displayName: string;
  bio: string;
  passport_id: number;
  imageUrl: string;
  socialProfiles: {
    github?: Social;
    twitter?: Social;
    farcaster?: Social;
  };
  skills: {
    activity: number;
    identity: number;
    skills: number;
  };
  lastUpdated: string;
}

interface BuilderScoreResponse {
  success: boolean;
  data?: BuilderScoreData;
  error?: string;
}

interface CacheEntry {
  data: BuilderScoreResponse;
  timestamp: number;
}

// Configuration
const API_CONFIG = {
  BASE_URL: 'https://talent.aipop.fun/api/passport',
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  RATE_LIMIT: {
    DELAY: 5000, // 5 seconds between requests
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000 // 2 seconds between retries
  },
  CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour
} as const;


class BackgroundPlatformService {
  getIdentityQuery(platform: string, username: string): IdentityQuery {
    switch (platform) {
      case 'twitter':
        return { provider: 'twitter', username };
      case 'github':
        return { provider: 'github', username };
      case 'farcaster':
        return { provider: 'farcaster', username };
      default:
        return { provider: 'twitter', username }; // default fallback
    }
  }
}

// HTTP Client
class HTTPClient {
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue: boolean = false;


  private async getRateLimitDelay(): Promise<void> {
    const now = Date.now();
    const timeToWait = Math.max(0, this.lastRequestTime + API_CONFIG.RATE_LIMIT.DELAY - now);
    if (timeToWait > 0) {
      await new Promise(resolve => setTimeout(resolve, timeToWait));
    }
  }


  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        await request();
        await this.getRateLimitDelay();
      }
    }

    this.isProcessingQueue = false;
  }

  async fetchWithRetry(url: string, options: RequestInit, retries = API_CONFIG.RATE_LIMIT.MAX_RETRIES): Promise<Response> {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          };

          const response = await fetch(url, {
            ...options,
            headers,
            mode: 'cors' 
          });
          this.lastRequestTime = Date.now();

          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            throw new Error('Rate limited');
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          resolve(response);
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await new Promise(resolve =>
              setTimeout(resolve, API_CONFIG.RATE_LIMIT.RETRY_DELAY)
            );
            this.requestQueue.push(() =>
              this.fetchWithRetry(url, options, retries - 1)
                .then(resolve)
                .catch(reject)
            );
          } else {
            reject(error);
          }
        }
      };

      this.requestQueue.push(executeRequest);
      this.processQueue();
    });
  }
}

// Cache Manager
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    this.setupCleanupInterval();
  }

  private setupCleanupInterval(): void {
    setInterval(() => this.cleanup(), API_CONFIG.CLEANUP_INTERVAL);
  }

  get(key: string): BuilderScoreResponse | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < API_CONFIG.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  set(key: string, data: BuilderScoreResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > API_CONFIG.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }
}

// Data Processor
class DataProcessor {
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  }


  private findSocialProfile(socials: Social[], source: string): Social | undefined {
    return socials.find(social =>
      social.source.toLowerCase() === source.toLowerCase() &&
      !social.disconnected
    );
  }

  private getProfileData(passport: PassportData): {
    bio: string;
    displayName: string;
    imageUrl: string;
  } {
    // Try to get data from passport_profile first
    if (passport.passport_profile) {
      return {
        bio: passport.passport_profile.bio || '',
        displayName: passport.passport_profile.display_name || passport.passport_profile.name || '',
        imageUrl: passport.passport_profile.image_url || ''
      };
    }

    // Fallback to original fields
    return {
      bio: passport.bio || '',
      displayName: passport.display_name || passport.profile_name || '',
      imageUrl: passport.image_url || ''
    };
  }

  processPassportData(apiResponse: APIResponse): BuilderScoreResponse {
    try {
      if (!apiResponse?.passports?.[0]) {
        return {
          success: false,
          error: 'No passport data found'
        };
      }

      const passport = apiResponse.passports[0];
      const socialProfiles: BuilderScoreData['socialProfiles'] = {};

      // Extract social profiles with error handling
      try {
        const github = this.findSocialProfile(passport.socials || [], 'github');
        const twitter = this.findSocialProfile(passport.socials || [], 'twitter');
        const farcaster = this.findSocialProfile(passport.socials || [], 'farcaster');

        if (github) socialProfiles.github = github;
        if (twitter) socialProfiles.twitter = twitter;
        if (farcaster) socialProfiles.farcaster = farcaster;
      } catch (error) {
        console.error('Error processing social profiles:', error);
      }

      // Normalize and validate scores
      const normalizeScore = (score: number): number => {
        if (typeof score !== 'number' || isNaN(score)) return 0;
        return Math.min(Math.max(Math.round(score), 0), 100);
      };

      const profileData = this.getProfileData(passport);

      return {
        success: true,
        data: {
          score: normalizeScore(passport.score),
          verified: Boolean(passport.verified || passport.human_checkmark),
          displayName: profileData.displayName,
          bio: profileData.bio,
          imageUrl: profileData.imageUrl,
          passport_id: passport.passport_id,
          socialProfiles,
          skills: {
            activity: normalizeScore(passport.activity_score),
            identity: normalizeScore(passport.identity_score),
            skills: normalizeScore(passport.skills_score)
          },
          lastUpdated: this.formatDate(passport.last_updated || passport.updated_at || new Date().toISOString())
        }
      };
    } catch (error) {
      console.error('Error processing passport data:', error);
      return {
        success: false,
        error: 'Error processing data'
      };
    }
  }
}

// Background Service
class BackgroundService {
  private httpClient: HTTPClient;
  private cacheManager: CacheManager;
  private dataProcessor: DataProcessor;
  private pendingRequests: Map<string, Promise<BuilderScoreResponse>>;
  private platformService: BackgroundPlatformService;

  constructor() {
    this.httpClient = new HTTPClient();
    this.cacheManager = new CacheManager();
    this.dataProcessor = new DataProcessor();
    this.pendingRequests = new Map(); 
    this.platformService = new BackgroundPlatformService();   
  }

  async getPassportData(request: { username: string; platform: string }): Promise<BuilderScoreResponse> {
    try {
      const { username, platform } = request;

      // Check for pending request
      const pending = this.pendingRequests.get(username);
      if (pending) {
        return pending;
      }

      // Check cache
      const cached = this.cacheManager.get(username);
      if (cached) {
        return cached;
      }

      // Create new request
      const requestPromise = this.fetchPassportData(username, platform);
      this.pendingRequests.set(username, requestPromise);

      const response = await requestPromise;
      this.pendingRequests.delete(username);

      if (response.success && response.data) {
        this.cacheManager.set(username, response);
      }

      return response;

    } catch (error) {
      this.pendingRequests.delete(request.username);
      console.error('Error in getPassportData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async fetchPassportData(username: string, platform: string): Promise<BuilderScoreResponse> {
    try {

      const identityQuery = this.platformService.getIdentityQuery(platform, username);
      const response = await this.httpClient.fetchWithRetry(
        `${API_CONFIG.BASE_URL}/${encodeURIComponent(username)}?provider=${identityQuery.provider}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      const apiResponse: APIResponse = await response.json();
      const processedResponse = this.dataProcessor.processPassportData(apiResponse);

      if (processedResponse.success) {
        this.cacheManager.set(username, processedResponse);
      }

      return processedResponse;

    } catch (error) {
      console.error('Error fetching passport data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Chrome extension message listener
chrome.runtime.onMessage.addListener((
  request: { type: string; username: string; platform: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: BuilderScoreResponse) => void
) => {
  if (request.type === 'GET_PASSPORT_DATA') {
    backgroundService.getPassportData({
        username: request.username, 
        platform: request.platform
      })
      .then(response => {
        console.log('Sending response:', response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error in background:', error);
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      });
    return true; // Keep message channel open for async response
  }
  return false;
});