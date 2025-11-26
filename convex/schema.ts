import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  responses: defineTable({
    q1: v.string(),
    q2: v.string(),
    q3: v.string(),
    q4: v.string(),
    q5: v.string(),
    userId: v.string(),
    createdAt: v.number(),
  }),

  // Live session management
  liveSession: defineTable({
    currentQuestion: v.number(), // 0-4 for questions 1-5, -1 for not started
    isActive: v.boolean(),
    questionStartTime: v.optional(v.number()),
    timerDuration: v.number(), // in seconds, default 30
    sessionStartTime: v.optional(v.number()),
  }),

  // Live responses from users
  liveResponses: defineTable({
    userId: v.string(),
    questionNumber: v.number(),
    answer: v.string(),
    submittedAt: v.number(),
    sessionId: v.string(),
    isFavorited: v.optional(v.boolean()),
  })
    .index("by_session_and_question", ["sessionId", "questionNumber"])
    .index("by_user_and_session", ["userId", "sessionId"]),
});
