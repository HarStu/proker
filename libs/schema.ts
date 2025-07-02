import { Card } from './poker';
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Schema for tracking call practice questions and user responses
export interface CallPracticeAttempt {
  // Unique identifier for this attempt
  id: string;

  // Timestamp when the attempt was made
  timestamp: Date;

  // Scenario details
  scenario: {
    holeCards: Card[];
    boardCards: Card[];
    potAmount: number;
    callAmount: number;
    outs: number;
    equity: number;
    potOdds: number;
    correctDecision: 'call' | 'fold';
    description: string;
    outCards: {
      primary: Card[];
      secondary: Card[];
      total: Card[];
    };
    outBreakdown: {
      primaryOuts: number;
      primaryType: string;
      secondaryOuts: number;
      secondaryTypes: string[];
    };
  };

  // User's response
  userDecision: 'call' | 'fold';

  // Whether the user was correct
  isCorrect: boolean;

  // Time taken to make decision (in milliseconds)
  timeToDecision?: number;

  // Additional metadata
  metadata?: {
    // Session identifier to group attempts
    sessionId?: string;

    // User's confidence level (1-5 scale)
    confidenceLevel?: number;

    // Notes or comments from user
    notes?: string;

    // Device/platform information
    platform?: string;

    // App version
    appVersion?: string;
  };
}

// Schema for aggregated performance statistics
export interface CallPracticeStats {
  // Total attempts
  totalAttempts: number;

  // Correct attempts
  correctAttempts: number;

  // Accuracy percentage
  accuracy: number;

  // Breakdown by decision type
  callAttempts: {
    total: number;
    correct: number;
    accuracy: number;
  };

  foldAttempts: {
    total: number;
    correct: number;
    accuracy: number;
  };

  // Average time to decision
  averageTimeToDecision?: number;

  // Performance over time (last 7, 30, 90 days)
  recentPerformance: {
    last7Days: {
      attempts: number;
      accuracy: number;
    };
    last30Days: {
      attempts: number;
      accuracy: number;
    };
    last90Days: {
      attempts: number;
      accuracy: number;
    };
  };

  // Performance by scenario type
  scenarioTypePerformance: {
    flushDraws: {
      attempts: number;
      accuracy: number;
    };
    straightDraws: {
      attempts: number;
      accuracy: number;
    };
    fullHouseDraws: {
      attempts: number;
      accuracy: number;
    };
    twoPairDraws: {
      attempts: number;
      accuracy: number;
    };
    threeOfAKindDraws: {
      attempts: number;
      accuracy: number;
    };
    overcardDraws: {
      attempts: number;
      accuracy: number;
    };
  };

  // Performance by pot odds ranges
  potOddsPerformance: {
    lowOdds: { // 0-20%
      attempts: number;
      accuracy: number;
    };
    mediumOdds: { // 20-40%
      attempts: number;
      accuracy: number;
    };
    highOdds: { // 40%+
      attempts: number;
      accuracy: number;
    };
  };
}

// Schema for user preferences and settings
export interface CallPracticeSettings {
  // Whether to show hints during practice
  showHints: boolean;

  // Whether to show detailed analysis after each attempt
  showDetailedAnalysis: boolean;

  // Preferred difficulty level
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';

  // Target practice session length (in minutes)
  sessionLength: number;

  // Whether to track timing
  trackTiming: boolean;

  // Notification preferences
  notifications: {
    dailyReminder: boolean;
    weeklyProgress: boolean;
    milestoneAchievements: boolean;
  };
}

// Schema for learning progress and achievements
export interface CallPracticeProgress {
  // Current streak of correct answers
  currentStreak: number;

  // Longest streak achieved
  longestStreak: number;

  // Total practice sessions completed
  sessionsCompleted: number;

  // Total practice time (in minutes)
  totalPracticeTime: number;

  // Achievements unlocked
  achievements: {
    firstCorrect: boolean;
    tenCorrect: boolean;
    fiftyCorrect: boolean;
    hundredCorrect: boolean;
    perfectSession: boolean; // 100% accuracy in a session
    speedDemon: boolean; // Fast average decision time
    consistency: boolean; // High accuracy over many attempts
    variety: boolean; // Attempted all scenario types
  };

  // Learning milestones
  milestones: {
    beginner: boolean; // 10 correct attempts
    intermediate: boolean; // 50 correct attempts, 70%+ accuracy
    advanced: boolean; // 100 correct attempts, 80%+ accuracy
    expert: boolean; // 200 correct attempts, 85%+ accuracy
  };
}

// ===== DRIZZLE SCHEMA DEFINITIONS =====

// Call practice attempts table
export const callPracticeAttempts = sqliteTable('call_practice_attempts', {
  id: text('id').primaryKey(), // UUID
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),

  // Scenario data (stored as JSON)
  holeCards: text('hole_cards').notNull(), // JSON string of Card[]
  boardCards: text('board_cards').notNull(), // JSON string of Card[]
  potAmount: real('pot_amount').notNull(),
  callAmount: real('call_amount').notNull(),
  outs: integer('outs').notNull(),
  equity: real('equity').notNull(),
  potOdds: real('pot_odds').notNull(),
  correctDecision: text('correct_decision', { enum: ['call', 'fold'] }).notNull(),
  description: text('description').notNull(),

  // Out cards data (stored as JSON)
  outCardsPrimary: text('out_cards_primary').notNull(), // JSON string of Card[]
  outCardsSecondary: text('out_cards_secondary').notNull(), // JSON string of Card[]
  outCardsTotal: text('out_cards_total').notNull(), // JSON string of Card[]

  // Out breakdown data (stored as JSON)
  outBreakdown: text('out_breakdown').notNull(), // JSON string of outBreakdown object

  // User response
  userDecision: text('user_decision', { enum: ['call', 'fold'] }).notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),

  // Optional timing data
  timeToDecision: integer('time_to_decision'), // milliseconds

  // Metadata (stored as JSON)
  sessionId: text('session_id'),
  confidenceLevel: integer('confidence_level'), // 1-5 scale
  notes: text('notes'),
  platform: text('platform'),
  appVersion: text('app_version'),
});

// User settings table
export const callPracticeSettings = sqliteTable('call_practice_settings', {
  id: text('id').primaryKey(), // Single row for user settings
  showHints: integer('show_hints', { mode: 'boolean' }).notNull().default(false),
  showDetailedAnalysis: integer('show_detailed_analysis', { mode: 'boolean' }).notNull().default(true),
  difficultyLevel: text('difficulty_level', { enum: ['beginner', 'intermediate', 'advanced'] }).notNull().default('beginner'),
  sessionLength: integer('session_length').notNull().default(10), // minutes
  trackTiming: integer('track_timing', { mode: 'boolean' }).notNull().default(true),

  // Notification preferences (stored as JSON)
  notifications: text('notifications').notNull().default('{"dailyReminder":false,"weeklyProgress":false,"milestoneAchievements":true}'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// User progress table
export const callPracticeProgress = sqliteTable('call_practice_progress', {
  id: text('id').primaryKey(), // Single row for user progress
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  sessionsCompleted: integer('sessions_completed').notNull().default(0),
  totalPracticeTime: integer('total_practice_time').notNull().default(0), // minutes

  // Achievements (stored as JSON)
  achievements: text('achievements').notNull().default('{"firstCorrect":false,"tenCorrect":false,"fiftyCorrect":false,"hundredCorrect":false,"perfectSession":false,"speedDemon":false,"consistency":false,"variety":false}'),

  // Milestones (stored as JSON)
  milestones: text('milestones').notNull().default('{"beginner":false,"intermediate":false,"advanced":false,"expert":false}'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Practice sessions table (for grouping attempts)
export const callPracticeSessions = sqliteTable('call_practice_sessions', {
  id: text('id').primaryKey(), // UUID
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  totalAttempts: integer('total_attempts').notNull().default(0),
  correctAttempts: integer('correct_attempts').notNull().default(0),
  accuracy: real('accuracy').notNull().default(0),
  totalTime: integer('total_time').notNull().default(0), // minutes

  // Session metadata
  notes: text('notes'),
  difficultyLevel: text('difficulty_level', { enum: ['beginner', 'intermediate', 'advanced'] }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Export all tables for use in db.ts
export const schema = {
  callPracticeAttempts,
  callPracticeSettings,
  callPracticeProgress,
  callPracticeSessions,
};
