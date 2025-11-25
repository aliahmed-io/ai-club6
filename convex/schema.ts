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
});
