/**
 * Unit tests for the match service caching system
 */

// Mock external dependencies
jest.mock('../src/lib/redis', () => ({
  getCachedMatch: jest.fn(),
  setCachedMatch: jest.fn(),
  deleteCachedMatch: jest.fn(),
  getCacheStats: jest.fn()
}));

jest.mock('../src/lib/db', () => ({
  getTrackMatch: jest.fn(),
  saveTrackMatch: jest.fn(),
  deleteTrackMatch: jest.fn()
}));

jest.mock('../src/lib/audio-matching-service', () => ({
  AudioMatchingService: {
    findMatches: jest.fn()
  }
}));

const { getCachedMatch, setCachedMatch } = require('../src/lib/redis');
const { getTrackMatch, saveTrackMatch } = require('../src/lib/db');
const { AudioMatchingService } = require('../src/lib/audio-matching-service');
const { getOrComputeMatch, approveMatch, clearMatch } = require('../src/lib/match-service');

describe('Match Service Caching System', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('getOrComputeMatch', () => {
    const testParams = {
      releaseId: 123456,
      trackIndex: 0,
      adminUserId: 'test-admin',
      releaseTitle: 'Test Album',
      releaseArtist: 'Test Artist',
      trackInfo: {
        position: 'A1',
        title: 'Test Track',
        duration: '3:45',
        artists: []
      }
    };

    test('should return cached match when available', async () => {
      // Arrange
      const cachedMatch = {
        platform: 'youtube',
        match_url: 'https://youtube.com/watch?v=test',
        confidence: 0.9,
        approved: true,
        verified_by: 'admin',
        verified_at: '2024-01-01T00:00:00.000Z'
      };
      
      getCachedMatch.mockResolvedValue(cachedMatch);

      // Act
      const result = await getOrComputeMatch(
        testParams.releaseId,
        testParams.trackIndex,
        testParams.adminUserId
      );

      // Assert
      expect(getCachedMatch).toHaveBeenCalledWith(testParams.releaseId, testParams.trackIndex);
      expect(getTrackMatch).not.toHaveBeenCalled();
      expect(AudioMatchingService.findMatches).not.toHaveBeenCalled();
      
      expect(result).toEqual({
        platform: 'youtube',
        match_url: 'https://youtube.com/watch?v=test',
        confidence: 0.9,
        approved: true,
        verified_by: 'admin',
        verified_at: new Date('2024-01-01T00:00:00.000Z'),
        source: 'cache'
      });
    });

    test('should return database match when cache miss', async () => {
      // Arrange
      getCachedMatch.mockResolvedValue(null);
      
      const dbMatch = {
        platform: 'soundcloud',
        match_url: 'https://soundcloud.com/test',
        confidence: 0.85,
        approved: true,
        verified_by: 'admin',
        verified_at: new Date('2024-01-01T00:00:00.000Z')
      };
      
      getTrackMatch.mockResolvedValue(dbMatch);

      // Act
      const result = await getOrComputeMatch(
        testParams.releaseId,
        testParams.trackIndex,
        testParams.adminUserId
      );

      // Assert
      expect(getCachedMatch).toHaveBeenCalledWith(testParams.releaseId, testParams.trackIndex);
      expect(getTrackMatch).toHaveBeenCalledWith(testParams.releaseId, testParams.trackIndex);
      expect(setCachedMatch).toHaveBeenCalled();
      expect(AudioMatchingService.findMatches).not.toHaveBeenCalled();
      
      expect(result.source).toBe('database');
      expect(result.platform).toBe('soundcloud');
    });

    test('should compute fresh match when cache and database miss', async () => {
      // Arrange
      getCachedMatch.mockResolvedValue(null);
      getTrackMatch.mockResolvedValue(null);
      
      const mockMatchResult = {
        matches: [{
          trackIndex: 0,
          matches: [{
            platform: 'youtube',
            url: 'https://youtube.com/watch?v=computed',
            confidence: 0.9
          }]
        }]
      };
      
      AudioMatchingService.findMatches.mockResolvedValue(mockMatchResult);
      saveTrackMatch.mockResolvedValue({
        verified_at: new Date('2024-01-01T00:00:00.000Z')
      });

      // Act
      const result = await getOrComputeMatch(
        testParams.releaseId,
        testParams.trackIndex,
        testParams.adminUserId,
        testParams.releaseTitle,
        testParams.releaseArtist,
        testParams.trackInfo
      );

      // Assert
      expect(getCachedMatch).toHaveBeenCalled();
      expect(getTrackMatch).toHaveBeenCalled();
      expect(AudioMatchingService.findMatches).toHaveBeenCalledWith(
        testParams.releaseId,
        testParams.releaseTitle,
        testParams.releaseArtist,
        [testParams.trackInfo]
      );
      
      expect(result.source).toBe('computed');
      expect(result.platform).toBe('youtube');
      expect(result.confidence).toBe(0.9);
      expect(result.approved).toBe(true); // High confidence auto-approved
    });

    test('should not auto-approve low confidence matches', async () => {
      // Arrange
      getCachedMatch.mockResolvedValue(null);
      getTrackMatch.mockResolvedValue(null);
      
      const mockMatchResult = {
        matches: [{
          trackIndex: 0,
          matches: [{
            platform: 'youtube',
            url: 'https://youtube.com/watch?v=lowconf',
            confidence: 0.5 // Low confidence
          }]
        }]
      };
      
      AudioMatchingService.findMatches.mockResolvedValue(mockMatchResult);

      // Act
      const result = await getOrComputeMatch(
        testParams.releaseId,
        testParams.trackIndex,
        testParams.adminUserId,
        testParams.releaseTitle,
        testParams.releaseArtist,
        testParams.trackInfo
      );

      // Assert
      expect(result.approved).toBe(false);
      expect(result.verified_by).toBeUndefined();
      expect(saveTrackMatch).not.toHaveBeenCalled(); // Should not persist unapproved matches
    });

    test('should handle no matches found', async () => {
      // Arrange
      getCachedMatch.mockResolvedValue(null);
      getTrackMatch.mockResolvedValue(null);
      
      const mockMatchResult = {
        matches: [{
          trackIndex: 0,
          matches: [] // No matches
        }]
      };
      
      AudioMatchingService.findMatches.mockResolvedValue(mockMatchResult);

      // Act
      const result = await getOrComputeMatch(
        testParams.releaseId,
        testParams.trackIndex,
        testParams.adminUserId,
        testParams.releaseTitle,
        testParams.releaseArtist,
        testParams.trackInfo
      );

      // Assert
      expect(result).toEqual({
        platform: 'none',
        match_url: '',
        confidence: 0,
        approved: false,
        source: 'computed'
      });
    });
  });

  describe('approveMatch', () => {
    test('should manually approve and persist a match', async () => {
      // Arrange
      const savedMatch = {
        verified_at: new Date('2024-01-01T00:00:00.000Z')
      };
      saveTrackMatch.mockResolvedValue(savedMatch);

      // Act
      const result = await approveMatch(
        123456,
        0,
        'youtube',
        'https://youtube.com/watch?v=manual',
        0.75,
        'admin'
      );

      // Assert
      expect(saveTrackMatch).toHaveBeenCalledWith({
        release_id: 123456,
        track_index: 0,
        platform: 'youtube',
        match_url: 'https://youtube.com/watch?v=manual',
        confidence: 0.75,
        approved: true,
        verified_by: 'admin'
      });
      
      expect(setCachedMatch).toHaveBeenCalled();
      expect(result.approved).toBe(true);
      expect(result.source).toBe('database');
    });
  });

  describe('clearMatch', () => {
    test('should clear match from both cache and database', async () => {
      // Arrange
      const { deleteCachedMatch } = require('../src/lib/redis');
      const { deleteTrackMatch } = require('../src/lib/db');

      // Act
      await clearMatch(123456, 0);

      // Assert
      expect(deleteCachedMatch).toHaveBeenCalledWith(123456, 0);
      expect(deleteTrackMatch).toHaveBeenCalledWith(123456, 0);
    });
  });

  describe('error handling', () => {
    test('should handle Redis cache errors gracefully', async () => {
      // Arrange
      getCachedMatch.mockRejectedValue(new Error('Redis connection failed'));
      getTrackMatch.mockResolvedValue(null);
      
      // Should not throw and fall back to database/computation
      const mockMatchResult = {
        matches: [{
          trackIndex: 0,
          matches: [{
            platform: 'youtube',
            url: 'https://youtube.com/fallback',
            confidence: 0.9
          }]
        }]
      };
      
      AudioMatchingService.findMatches.mockResolvedValue(mockMatchResult);
      saveTrackMatch.mockResolvedValue({
        verified_at: new Date()
      });

      // Act & Assert
      await expect(getOrComputeMatch(
        123456,
        0,
        'admin',
        'Test Album',
        'Test Artist',
        { position: 'A1', title: 'Test', duration: '3:00', artists: [] }
      )).resolves.toBeTruthy();
    });

    test('should throw error when fresh computation fails', async () => {
      // Arrange
      getCachedMatch.mockResolvedValue(null);
      getTrackMatch.mockResolvedValue(null);
      AudioMatchingService.findMatches.mockRejectedValue(new Error('API failure'));

      // Act & Assert
      await expect(getOrComputeMatch(
        123456,
        0,
        'admin',
        'Test Album',
        'Test Artist',
        { position: 'A1', title: 'Test', duration: '3:00', artists: [] }
      )).rejects.toThrow('API failure');
    });
  });
});