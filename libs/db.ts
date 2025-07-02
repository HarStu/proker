import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Database schema for call practice attempts
export const callPracticeAttempts = sqliteTable('call_practice_attempts', {
  id: text('id').primaryKey(), // UUID for unique identification
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(), // Unix timestamp when attempt was made

  // Scenario data (stored as JSON strings)
  holeCards: text('hole_cards').notNull(), // JSON array of 2 Card objects
  boardCards: text('board_cards').notNull(), // JSON array of 3-4 Card objects
  potAmount: real('pot_amount').notNull(), // Pot size in dollars
  callAmount: real('call_amount').notNull(), // Call amount in dollars
  outs: integer('outs').notNull(), // Total number of outs
  equity: real('equity').notNull(), // Equity percentage (0-100)
  potOdds: real('pot_odds').notNull(), // Pot odds percentage (0-100)
  correctDecision: text('correct_decision', { enum: ['call', 'fold'] }).notNull(),
  description: text('description').notNull(), // Human-readable scenario description

  // Out cards breakdown (stored as JSON)
  outCardsPrimary: text('out_cards_primary').notNull(), // JSON array of primary out cards
  outCardsSecondary: text('out_cards_secondary').notNull(), // JSON array of secondary out cards
  outCardsTotal: text('out_cards_total').notNull(), // JSON array of all out cards
  outBreakdown: text('out_breakdown').notNull(), // JSON object with out type breakdown

  // User response
  userDecision: text('user_decision', { enum: ['call', 'fold'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),

  // Optional metadata
  timeToDecision: integer('time_to_decision'), // Decision time in milliseconds
  confidenceLevel: integer('confidence_level'), // User confidence 1-5 scale
  notes: text('notes'), // User notes
  platform: text('platform'), // Device/platform info
  appVersion: text('app_version'), // App version
});

// Export schema for migrations
export const schema = {
  callPracticeAttempts,
};

// Initialize database
const sqlite = SQLite.openDatabaseSync('call_practice.db');
export const db = drizzle(sqlite, { schema });

// Simple cache for practice history
let practiceHistoryCache: any[] = [];
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache management functions
const isCacheValid = () => {
  return Date.now() - cacheTimestamp < CACHE_DURATION;
};

const updateCache = (data: any[]) => {
  practiceHistoryCache = data;
  cacheTimestamp = Date.now();
};

const invalidateCache = () => {
  practiceHistoryCache = [];
  cacheTimestamp = 0;
};

// Database operations
export const dbOperations = {
  // Create table if it doesn't exist
  async createTableIfNotExists() {
    try {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS call_practice_attempts (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          hole_cards TEXT NOT NULL,
          board_cards TEXT NOT NULL,
          pot_amount REAL NOT NULL,
          call_amount REAL NOT NULL,
          outs INTEGER NOT NULL,
          equity REAL NOT NULL,
          pot_odds REAL NOT NULL,
          correct_decision TEXT NOT NULL,
          description TEXT NOT NULL,
          out_cards_primary TEXT NOT NULL,
          out_cards_secondary TEXT NOT NULL,
          out_cards_total TEXT NOT NULL,
          out_breakdown TEXT NOT NULL,
          user_decision TEXT NOT NULL,
          is_correct INTEGER NOT NULL,
          time_to_decision INTEGER,
          confidence_level INTEGER,
          notes TEXT,
          platform TEXT,
          app_version TEXT
        )
      `);
      console.log("Database table created/verified successfully");
    } catch (error) {
      console.error("Failed to create database table:", error);
      throw error;
    }
  },
  // Record a new practice attempt
  async recordAttempt(attempt: {
    id: string;
    timestamp: Date;
    holeCards: string; // JSON string
    boardCards: string; // JSON string
    potAmount: number;
    callAmount: number;
    outs: number;
    equity: number;
    potOdds: number;
    correctDecision: 'call' | 'fold';
    description: string;
    outCardsPrimary: string; // JSON string
    outCardsSecondary: string; // JSON string
    outCardsTotal: string; // JSON string
    outBreakdown: string; // JSON string
    userDecision: 'call' | 'fold';
    isCorrect: boolean;
    timeToDecision?: number;
    confidenceLevel?: number;
    notes?: string;
    platform?: string;
    appVersion?: string;
  }) {
    console.log('Database: Recording attempt with ID:', attempt.id);
    // Ensure table exists before inserting
    await this.createTableIfNotExists();
    const result = await db.insert(callPracticeAttempts).values(attempt);
    console.log('Database: Insert result:', result);



    return result;
  },

  // Get practice history with pagination (with caching)
  async getHistory(limit: number = 50, offset: number = 0) {
    console.log('Database: Getting history with limit:', limit, 'offset:', offset);

    // Always query fresh data for now (disable caching temporarily)
    await this.createTableIfNotExists();
    const result = await db
      .select()
      .from(callPracticeAttempts)
      .orderBy(sql`timestamp DESC`)
      .limit(limit)
      .offset(offset);
    console.log('Database: History query result:', result.length, 'records');

    return result;
  },

  // Get all attempts (for statistics)
  async getAllAttempts() {
    // Ensure table exists before querying
    await this.createTableIfNotExists();
    return await db.select().from(callPracticeAttempts);
  },

  // Get attempts by date range
  async getAttemptsByDateRange(startDate: Date, endDate: Date) {
    // Ensure table exists before querying
    await this.createTableIfNotExists();
    return await db
      .select()
      .from(callPracticeAttempts)
      .where(
        sql`timestamp >= ${startDate.getTime()} AND timestamp <= ${endDate.getTime()}`
      )
      .orderBy(sql`timestamp DESC`);
  },

  // Get recent attempts (last N days)
  async getRecentAttempts(days: number = 7) {
    // Ensure table exists before querying
    await this.createTableIfNotExists();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await db
      .select()
      .from(callPracticeAttempts)
      .where(sql`timestamp >= ${cutoffDate.getTime()}`)
      .orderBy(sql`timestamp DESC`);
  },



  // Clear all data (for privacy/reset)
  async clearAllData() {
    // Ensure table exists before deleting
    await this.createTableIfNotExists();
    const result = await db.delete(callPracticeAttempts);



    return result;
  },

  // Pre-cache the latest practice history (call this after recording an attempt)
  async preCacheHistory() {
    console.log('Database: Pre-caching practice history');
    try {
      await this.createTableIfNotExists();
      const result = await db
        .select()
        .from(callPracticeAttempts)
        .orderBy(sql`timestamp DESC`)
        .limit(50);

      updateCache(result);
      console.log('Database: Pre-cached', result.length, 'records');
      return result;
    } catch (error) {
      console.warn('Database: Failed to pre-cache history:', error);
      return [];
    }
  },
};