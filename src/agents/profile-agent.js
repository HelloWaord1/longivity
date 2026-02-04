/**
 * Longivity Profile Agent
 * Handles user health data input and profile management
 * Stores profiles, biomarkers, and wearable data for personalized recommendations
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export class ProfileAgent {
  constructor() {
    this.profilesDir = join(process.cwd(), 'knowledge-base', 'profiles');
    this.biomarkersDir = join(this.profilesDir, 'biomarkers');
    this.wearablesDir = join(this.profilesDir, 'wearables');
  }

  /**
   * Initialize profile storage directories
   */
  async init() {
    await mkdir(this.profilesDir, { recursive: true });
    await mkdir(this.biomarkersDir, { recursive: true });
    await mkdir(this.wearablesDir, { recursive: true });
    console.log('[ProfileAgent] Initialized profile storage');
  }

  /**
   * Create or update user profile
   * @param {string} userId - User identifier
   * @param {object} profileData - Profile data (age, sex, weight, height, goals, conditions, allergies)
   * @returns {object} Updated profile
   */
  async createOrUpdateProfile(userId, profileData) {
    const profilePath = join(this.profilesDir, `${userId}.json`);
    
    let existingProfile = {};
    if (existsSync(profilePath)) {
      try {
        const data = await readFile(profilePath, 'utf-8');
        existingProfile = JSON.parse(data);
      } catch (e) {
        console.error(`[ProfileAgent] Failed to read existing profile for ${userId}:`, e.message);
      }
    }

    const profile = {
      ...existingProfile,
      userId,
      ...profileData,
      updatedAt: new Date().toISOString(),
      createdAt: existingProfile.createdAt || new Date().toISOString(),
    };

    // Validate required fields
    this.validateProfile(profile);

    await writeFile(profilePath, JSON.stringify(profile, null, 2), 'utf-8');
    console.log(`[ProfileAgent] Updated profile for user ${userId}`);
    
    return profile;
  }

  /**
   * Get user profile
   * @param {string} userId - User identifier
   * @returns {object|null} User profile or null if not found
   */
  async getProfile(userId) {
    const profilePath = join(this.profilesDir, `${userId}.json`);
    
    if (!existsSync(profilePath)) {
      return null;
    }

    try {
      const data = await readFile(profilePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error(`[ProfileAgent] Failed to read profile for ${userId}:`, e.message);
      return null;
    }
  }

  /**
   * Add biomarker data (blood test results)
   * @param {string} userId - User identifier
   * @param {object} biomarkerData - Biomarker data with key-value pairs, date, reference ranges
   * @returns {object} Added biomarker entry
   */
  async addBiomarkers(userId, biomarkerData) {
    const biomarkersPath = join(this.biomarkersDir, `${userId}.json`);
    
    let biomarkerHistory = [];
    if (existsSync(biomarkersPath)) {
      try {
        const data = await readFile(biomarkersPath, 'utf-8');
        biomarkerHistory = JSON.parse(data);
      } catch (e) {
        console.error(`[ProfileAgent] Failed to read biomarkers for ${userId}:`, e.message);
      }
    }

    const biomarkerEntry = {
      id: `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: biomarkerData.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      values: biomarkerData.values || {}, // key-value pairs of biomarker results
      referenceRanges: biomarkerData.referenceRanges || {},
      notes: biomarkerData.notes || '',
      source: biomarkerData.source || 'user_input', // lab, device, user_input
      createdAt: new Date().toISOString(),
    };

    biomarkerHistory.push(biomarkerEntry);
    
    // Sort by date (newest first)
    biomarkerHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    await writeFile(biomarkersPath, JSON.stringify(biomarkerHistory, null, 2), 'utf-8');
    console.log(`[ProfileAgent] Added biomarkers for user ${userId} on ${biomarkerEntry.date}`);
    
    return biomarkerEntry;
  }

  /**
   * Get biomarker history for user
   * @param {string} userId - User identifier
   * @param {number} limit - Maximum number of entries to return
   * @returns {array} Biomarker history
   */
  async getBiomarkers(userId, limit = 50) {
    const biomarkersPath = join(this.biomarkersDir, `${userId}.json`);
    
    if (!existsSync(biomarkersPath)) {
      return [];
    }

    try {
      const data = await readFile(biomarkersPath, 'utf-8');
      const biomarkerHistory = JSON.parse(data);
      return biomarkerHistory.slice(0, limit);
    } catch (e) {
      console.error(`[ProfileAgent] Failed to read biomarkers for ${userId}:`, e.message);
      return [];
    }
  }

  /**
   * Add wearable data (sleep, HRV, steps, resting HR)
   * @param {string} userId - User identifier
   * @param {object} wearableData - Wearable data
   * @returns {object} Added wearable entry
   */
  async addWearableData(userId, wearableData) {
    const wearablesPath = join(this.wearablesDir, `${userId}.json`);
    
    let wearableHistory = [];
    if (existsSync(wearablesPath)) {
      try {
        const data = await readFile(wearablesPath, 'utf-8');
        wearableHistory = JSON.parse(data);
      } catch (e) {
        console.error(`[ProfileAgent] Failed to read wearables for ${userId}:`, e.message);
      }
    }

    const wearableEntry = {
      id: `wear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: wearableData.date || new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      sleep: wearableData.sleep || {}, // duration, efficiency, deep, rem, etc.
      hrv: wearableData.hrv || null, // heart rate variability in ms
      steps: wearableData.steps || null,
      restingHR: wearableData.restingHR || null,
      activeCalories: wearableData.activeCalories || null,
      workouts: wearableData.workouts || [],
      deviceType: wearableData.deviceType || 'unknown', // apple_watch, fitbit, oura, etc.
      notes: wearableData.notes || '',
      createdAt: new Date().toISOString(),
    };

    wearableHistory.push(wearableEntry);
    
    // Sort by date (newest first)
    wearableHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Keep only last 365 days of data to manage storage
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    wearableHistory = wearableHistory.filter(entry => 
      new Date(entry.date) > oneYearAgo
    );

    await writeFile(wearablesPath, JSON.stringify(wearableHistory, null, 2), 'utf-8');
    console.log(`[ProfileAgent] Added wearable data for user ${userId} on ${wearableEntry.date}`);
    
    return wearableEntry;
  }

  /**
   * Get wearable data history for user
   * @param {string} userId - User identifier
   * @param {number} days - Number of days to retrieve (default 30)
   * @returns {array} Wearable data history
   */
  async getWearableData(userId, days = 30) {
    const wearablesPath = join(this.wearablesDir, `${userId}.json`);
    
    if (!existsSync(wearablesPath)) {
      return [];
    }

    try {
      const data = await readFile(wearablesPath, 'utf-8');
      const wearableHistory = JSON.parse(data);
      
      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return wearableHistory.filter(entry => 
        new Date(entry.date) >= cutoffDate
      );
    } catch (e) {
      console.error(`[ProfileAgent] Failed to read wearables for ${userId}:`, e.message);
      return [];
    }
  }

  /**
   * Get comprehensive health summary for personalization
   * @param {string} userId - User identifier
   * @returns {object} Health summary including profile, recent biomarkers, and wearables
   */
  async getHealthSummary(userId) {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return null;
    }

    const recentBiomarkers = await this.getBiomarkers(userId, 5); // Last 5 tests
    const recentWearables = await this.getWearableData(userId, 7); // Last 7 days

    return {
      profile,
      recentBiomarkers,
      recentWearables,
      summary: this.generateHealthInsights(profile, recentBiomarkers, recentWearables)
    };
  }

  /**
   * Generate health insights for AI context
   * @private
   */
  generateHealthInsights(profile, biomarkers, wearables) {
    const insights = [];
    
    // Basic demographics
    if (profile.age && profile.sex) {
      insights.push(`${profile.age}-year-old ${profile.sex}`);
    }
    
    // Health goals
    if (profile.healthGoals && profile.healthGoals.length > 0) {
      insights.push(`Goals: ${profile.healthGoals.join(', ')}`);
    }
    
    // Health conditions
    if (profile.conditions && profile.conditions.length > 0) {
      insights.push(`Conditions: ${profile.conditions.join(', ')}`);
    }
    
    // Recent biomarker trends
    if (biomarkers.length > 1) {
      const latest = biomarkers[0];
      const previous = biomarkers[1];
      
      // Basic trend analysis for common markers
      const trends = [];
      ['cholesterol', 'glucose', 'hba1c', 'vitamin_d'].forEach(marker => {
        if (latest.values[marker] && previous.values[marker]) {
          const change = latest.values[marker] - previous.values[marker];
          if (Math.abs(change) > 0.1) {
            trends.push(`${marker}: ${change > 0 ? 'increased' : 'decreased'}`);
          }
        }
      });
      
      if (trends.length > 0) {
        insights.push(`Recent trends: ${trends.join(', ')}`);
      }
    }
    
    // Wearable averages
    if (wearables.length > 0) {
      const avgSleep = wearables
        .filter(w => w.sleep && w.sleep.duration)
        .reduce((sum, w) => sum + w.sleep.duration, 0) / wearables.length;
      
      const avgHRV = wearables
        .filter(w => w.hrv)
        .reduce((sum, w) => sum + w.hrv, 0) / wearables.filter(w => w.hrv).length;
        
      if (avgSleep) {
        insights.push(`Avg sleep: ${(avgSleep / 60).toFixed(1)}h/night`);
      }
      if (avgHRV) {
        insights.push(`Avg HRV: ${avgHRV.toFixed(0)}ms`);
      }
    }
    
    return insights;
  }

  /**
   * Validate profile data
   * @private
   */
  validateProfile(profile) {
    if (profile.age && (profile.age < 0 || profile.age > 150)) {
      throw new Error('Age must be between 0 and 150');
    }
    
    if (profile.weight && (profile.weight < 20 || profile.weight > 500)) {
      throw new Error('Weight must be between 20 and 500 kg');
    }
    
    if (profile.height && (profile.height < 50 || profile.height > 250)) {
      throw new Error('Height must be between 50 and 250 cm');
    }
    
    if (profile.sex && !['male', 'female', 'other'].includes(profile.sex.toLowerCase())) {
      throw new Error('Sex must be male, female, or other');
    }
  }

  /**
   * List all user profiles (for admin purposes)
   * @returns {array} List of user IDs with profiles
   */
  async listProfiles() {
    if (!existsSync(this.profilesDir)) {
      return [];
    }

    try {
      const files = await readdir(this.profilesDir);
      return files
        .filter(file => file.endsWith('.json') && !file.includes('/'))
        .map(file => file.replace('.json', ''));
    } catch (e) {
      console.error('[ProfileAgent] Failed to list profiles:', e.message);
      return [];
    }
  }
}

// Export singleton instance
export const profileAgent = new ProfileAgent();