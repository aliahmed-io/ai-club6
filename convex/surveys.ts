import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// LIVE SESSION MUTATIONS
// ============================================

export const startSession = mutation({
    handler: async (ctx) => {
        // Check if there's an existing session
        const existingSession = await ctx.db.query("liveSession").first();

        if (existingSession) {
            // Update existing session
            await ctx.db.patch(existingSession._id, {
                currentQuestion: -1,
                isActive: true,
                questionStartTime: undefined,
                timerDuration: 30,
                sessionStartTime: Date.now(),
            });
            return existingSession._id;
        } else {
            // Create new session
            return await ctx.db.insert("liveSession", {
                currentQuestion: -1,
                isActive: true,
                timerDuration: 30,
                sessionStartTime: Date.now(),
            });
        }
    },
});

export const startQuestion = mutation({
    args: { questionNumber: v.number() },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            throw new Error("No active session");
        }

        await ctx.db.patch(session._id, {
            currentQuestion: args.questionNumber,
            questionStartTime: Date.now(),
        });
    },
});

export const nextQuestion = mutation({
    handler: async (ctx) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            throw new Error("No active session");
        }

        // Delete non-favorited answers from the current question
        if (session.currentQuestion >= 0) {
            const currentAnswers = await ctx.db
                .query("liveResponses")
                .withIndex("by_session_and_question", (q) =>
                    q.eq("sessionId", session._id).eq("questionNumber", session.currentQuestion)
                )
                .collect();

            for (const answer of currentAnswers) {
                if (!answer.isFavorited) {
                    await ctx.db.delete(answer._id);
                }
            }
        }

        const nextQ = session.currentQuestion + 1;
        if (nextQ > 4) {
            // End session if we're past question 5
            await ctx.db.patch(session._id, {
                isActive: false,
                currentQuestion: 4,
            });
        } else {
            await ctx.db.patch(session._id, {
                currentQuestion: nextQ,
                questionStartTime: Date.now(),
            });
        }
    },
});

export const endSession = mutation({
    handler: async (ctx) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            throw new Error("No active session");
        }

        await ctx.db.patch(session._id, {
            isActive: false,
            questionStartTime: undefined,
        });
    },
});

export const submitLiveAnswer = mutation({
    args: {
        questionNumber: v.number(),
        answer: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            throw new Error("No active session");
        }

        // Check if time has expired (with 2s grace period for latency)
        if (session.isActive && session.questionStartTime) {
            const elapsed = Date.now() - session.questionStartTime;
            const timeLimit = session.timerDuration * 1000;
            if (elapsed > timeLimit + 2000) {
                throw new Error("Time is up! Answers are no longer accepted.");
            }
        }

        // Profanity Filter
        const badWords = [
            // English
            "fuck", "shit", "bitch", "asshole", "cunt", "dick", "pussy", "bastard", "whore", "slut",
            // Arabic (Transliterated - Sexual/Explicit only)
            "sharmoota", "sharmuta", "kos", "kuss", "zeb", "zubb", "ayr", "gahba", "qahba", "manyok", "manyuk", "khara", "neek", "nik",
            // Arabic (Script - Sexual/Explicit only)
            "شرموطة", "كس", "زب", "قحبة", "منيوك", "خرا", "نيك", "طيز", "قواد"
        ];
        const lowerAnswer = args.answer.toLowerCase();
        // Check for exact matches or words contained within the answer
        if (badWords.some(word => lowerAnswer.includes(word))) {
            throw new Error("Please use appropriate language.");
        }

        // Check if user already answered this question in this session
        const existing = await ctx.db
            .query("liveResponses")
            .withIndex("by_user_and_session", (q) =>
                q.eq("userId", args.userId).eq("sessionId", session._id)
            )
            .filter((q) => q.eq(q.field("questionNumber"), args.questionNumber))
            .first();

        if (existing) {
            // Update existing answer
            await ctx.db.patch(existing._id, {
                answer: args.answer,
                submittedAt: Date.now(),
            });
        } else {
            // Insert new answer
            await ctx.db.insert("liveResponses", {
                userId: args.userId,
                questionNumber: args.questionNumber,
                answer: args.answer,
                submittedAt: Date.now(),
                sessionId: session._id,
                isFavorited: false,
            });
        }
    },
});

// ============================================
// LIVE SESSION QUERIES
// ============================================

export const getLiveSession = query({
    handler: async (ctx) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            return null;
        }

        // Calculate time remaining
        let timeRemaining = 0;
        if (session.questionStartTime && session.isActive && session.currentQuestion >= 0) {
            const elapsed = Date.now() - session.questionStartTime;
            timeRemaining = Math.max(0, session.timerDuration * 1000 - elapsed);
        }

        return {
            ...session,
            timeRemaining,
        };
    },
});

export const getLiveAnswers = query({
    args: { questionNumber: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            return [];
        }

        const questionNum = args.questionNumber ?? session.currentQuestion;

        const answers = await ctx.db
            .query("liveResponses")
            .withIndex("by_session_and_question", (q) =>
                q.eq("sessionId", session._id).eq("questionNumber", questionNum)
            )
            .collect();

        return answers;
    },
});

export const getUserAnswer = query({
    args: {
        userId: v.string(),
        questionNumber: v.number(),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db.query("liveSession").first();
        if (!session) {
            return null;
        }

        const answer = await ctx.db
            .query("liveResponses")
            .withIndex("by_user_and_session", (q) =>
                q.eq("userId", args.userId).eq("sessionId", session._id)
            )
            .filter((q) => q.eq(q.field("questionNumber"), args.questionNumber))
            .first();

        return answer;
    },
});

// Toggle favorite status of an answer
export const toggleFavorite = mutation({
    args: {
        answerId: v.id("liveResponses"),
    },
    handler: async (ctx, args) => {
        const answer = await ctx.db.get(args.answerId);
        if (!answer) {
            throw new Error("Answer not found");
        }

        await ctx.db.patch(args.answerId, {
            isFavorited: !answer.isFavorited,
        });
    },
});

// Delete a specific answer
export const deleteAnswer = mutation({
    args: {
        answerId: v.id("liveResponses"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.answerId);
    },
});

// Reset game - clear all non-favorited answers and restart from Q1
export const resetGame = mutation({
    handler: async (ctx) => {
        const session = await ctx.db.query("liveSession").first();

        // Delete all non-favorited answers
        const allAnswers = await ctx.db.query("liveResponses").collect();
        for (const answer of allAnswers) {
            if (!answer.isFavorited) {
                await ctx.db.delete(answer._id);
            }
        }

        // Reset session to Q1
        if (session) {
            await ctx.db.patch(session._id, {
                currentQuestion: 0,
                questionStartTime: Date.now(),
                isActive: true,
            });
        } else {
            // Create new session if none exists
            await ctx.db.insert("liveSession", {
                currentQuestion: 0,
                isActive: true,
                questionStartTime: Date.now(),
                timerDuration: 30,
                sessionStartTime: Date.now(),
            });
        }
    },
});

// ============================================
// ORIGINAL MUTATIONS (kept for compatibility)
// ============================================

export const submit = mutation({
    args: {
        q1: v.string(),
        q2: v.string(),
        q3: v.string(),
        q4: v.string(),
        q5: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("responses", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

export const clearAll = mutation({
    handler: async (ctx) => {
        // Clear old responses
        const responses = await ctx.db.query("responses").collect();
        await Promise.all(responses.map((r) => ctx.db.delete(r._id)));

        // Clear live responses
        const liveResponses = await ctx.db.query("liveResponses").collect();
        await Promise.all(liveResponses.map((r) => ctx.db.delete(r._id)));

        // Reset session
        const session = await ctx.db.query("liveSession").first();
        if (session) {
            await ctx.db.patch(session._id, {
                currentQuestion: -1,
                isActive: false,
                questionStartTime: undefined,
            });
        }
    },
});

export const getStats = query({
    handler: async (ctx) => {
        const responses = await ctx.db.query("responses").collect();
        const total = responses.length;

        if (total === 0) {
            return {
                total: 0,
                q3Data: [],
                q4Data: [],
                q5Data: [],
                dailyStats: [],
            };
        }

        const count = (field: keyof typeof responses[0], value: string) =>
            responses.filter((r) => r[field] === value).length;

        const q3Data = [
            { label: "Yes", value: count("q3", "Yes"), color: "#818cf8" },
            { label: "No", value: count("q3", "No"), color: "#f472b6" },
            { label: "Sometimes", value: count("q3", "Sometimes"), color: "#34d399" },
        ].map((d) => ({
            ...d,
            percentage: Math.round((d.value / total) * 100) || 0,
        }));

        const q4Options = [
            "1-3 times",
            "4-7 times",
            "8-15 times",
            "16-30 times",
            "30+ times",
        ];
        const q4Data = q4Options.map((opt) => ({
            label: opt,
            value: count("q4", opt),
            percentage: Math.round((count("q4", opt) / total) * 100) || 0,
        }));

        const q5Data = [
            { label: "Yes", value: count("q5", "Yes"), color: "#38bdf8" },
            { label: "No", value: count("q5", "No"), color: "#fb7185" },
            { label: "Depends", value: count("q5", "Depends"), color: "#c084fc" },
        ].map((d) => ({
            ...d,
            percentage: Math.round((d.value / total) * 100) || 0,
        }));

        // Calculate Daily Stats (Last 7 Days)
        const dailyStatsMap = new Map<string, number>();
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            dailyStatsMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), 0);
        }

        responses.forEach((r) => {
            if (r.createdAt) {
                const date = new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
                if (dailyStatsMap.has(date)) {
                    dailyStatsMap.set(date, (dailyStatsMap.get(date) || 0) + 1);
                }
            }
        });

        const dailyStats = Array.from(dailyStatsMap.entries()).map(([label, value]) => ({
            label,
            value,
            percentage: Math.round((value / total) * 100) || 0,
        }));

        return { q3Data, q4Data, q5Data, dailyStats, total };
    },
});

export const getRecent = query({
    handler: async (ctx) => {
        return await ctx.db.query("responses").order("desc").take(300);
    },
});
