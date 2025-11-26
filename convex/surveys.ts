import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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
        const responses = await ctx.db.query("responses").collect();
        await Promise.all(responses.map((r) => ctx.db.delete(r._id)));
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
