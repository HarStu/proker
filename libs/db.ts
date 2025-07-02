import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Database schema for call practice attempts
export const callPracticeAttempts = sqliteTable('call_practice_attempts', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  holeCards: text('hole_cards').notNull(),
  boardCards: text('board_cards').notNull(),
  potAmount: real('pot_amount').notNull(),
  callAmount: real('call_amount').notNull(),
  outs: integer('outs').notNull(),
  equity: real('equity').notNull(),
  potOdds: real('pot_odds').notNull(),
  correctDecision: text('correct_decision', { enum: ['call', 'fold'] }).notNull(),
  description: text('description').notNull(),
  outCardsPrimary: text('out_cards_primary').notNull(),
  outCardsSecondary: text('out_cards_secondary').notNull(),
  outCardsTotal: text('out_cards_total').notNull(),
  outBreakdown: text('out_breakdown').notNull(),
  userDecision: text('user_decision', { enum: ['call', 'fold'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
  timeToDecision: integer('time_to_decision'),
  confidenceLevel: integer('confidence_level'),
  notes: text('notes'),
  platform: text('platform'),
  appVersion: text('app_version'),
});

// Initialize database
const sqlite = SQLite.openDatabaseSync('call_practice.db');
export const db = drizzle(sqlite);

// Simple database operations
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
    holeCards: string;
    boardCards: string;
    potAmount: number;
    callAmount: number;
    outs: number;
    equity: number;
    potOdds: number;
    correctDecision: 'call' | 'fold';
    description: string;
    outCardsPrimary: string;
    outCardsSecondary: string;
    outCardsTotal: string;
    outBreakdown: string;
    userDecision: 'call' | 'fold';
    isCorrect: boolean;
    timeToDecision?: number;
    confidenceLevel?: number;
    notes?: string;
    platform?: string;
    appVersion?: string;
  }) {
    console.log('Database: Recording attempt with ID:', attempt.id);
    await this.createTableIfNotExists();

    try {
      const result = await db.insert(callPracticeAttempts).values(attempt);
      console.log('Database: Insert successful for ID:', attempt.id);
      return result;
    } catch (error) {
      console.error('Database: Insert failed for ID:', attempt.id, 'Error:', error);
      throw error;
    }
  },

  // Get all attempts (for statistics)
  async getAllAttempts() {
    console.log('Database: Getting all attempts');
    await this.createTableIfNotExists();

    try {
      const result = await db.select().from(callPracticeAttempts);
      console.log('Database: Retrieved', result.length, 'total attempts');
      return result;
    } catch (error) {
      console.error('Database: Failed to get all attempts:', error);
      return [];
    }
  },

  // Get recent attempts (for history display)
  async getRecentAttempts(limit: number = 10) {
    console.log('Database: Getting recent attempts, limit:', limit);
    await this.createTableIfNotExists();

    try {
      const result = await db
        .select()
        .from(callPracticeAttempts)
        .orderBy(sql`timestamp DESC`)
        .limit(limit);
      console.log('Database: Retrieved', result.length, 'recent attempts');
      return result;
    } catch (error) {
      console.error('Database: Failed to get recent attempts:', error);
      return [];
    }
  },

  // Clear all data
  async clearAllData() {
    console.log('Database: Clearing all data');
    await this.createTableIfNotExists();

    try {
      const result = await db.delete(callPracticeAttempts);
      console.log('Database: All data cleared');
      return result;
    } catch (error) {
      console.error('Database: Failed to clear data:', error);
      throw error;
    }
  },

  // Reset database (drop and recreate table)
  async resetDatabase() {
    console.log('Database: Resetting database');
    try {
      await db.run(sql`DROP TABLE IF EXISTS call_practice_attempts`);
      console.log('Database: Table dropped');
      await this.createTableIfNotExists();
      console.log('Database: Table recreated');
    } catch (error) {
      console.error('Database: Failed to reset database:', error);
      throw error;
    }
  },
};