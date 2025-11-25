import React from "react";

export const SimpleBarChart = ({
    data,
    color = "bg-indigo-500",
}: {
    data: { label: string; value: number; percentage: number }[];
    color?: string;
}) => {
    const max = Math.max(...data.map((d) => d.value));
    return (
        <div className="space-y-3">
            {data.map((item, idx) => (
                <div key={idx} className="group">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500">
                            {item.value} ({item.percentage}%)
                        </span>
                    </div>
                    <div className="h-4 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color} rounded-full transition-all duration-1000 ease-out group-hover:brightness-110`}
                            style={{ width: `${max > 0 ? (item.value / max) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const DonutChart = ({
    data,
}: {
    data: { label: string; value: number; percentage: number; color: string }[];
}) => {
    let currentAngle = 0;
    const gradientParts = data.map((item) => {
        const start = currentAngle;
        const end = currentAngle + item.percentage * 3.6;
        currentAngle = end;
        return `${item.color} ${start}deg ${end}deg`;
    });

    const background =
        gradientParts.length > 0
            ? `conic-gradient(${gradientParts.join(", ")})`
            : "conic-gradient(#e2e8f0 0deg 360deg)";

    return (
        <div className="flex flex-col items-center">
            <div
                className="relative w-48 h-48 rounded-full shadow-inner"
                style={{ background }}
            >
                <div className="absolute inset-0 m-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold text-slate-800">
                        {data.reduce((a, b) => a + b.value, 0)}
                    </span>
                    <span className="text-xs text-slate-500 uppercase tracking-wider">
                        Responses
                    </span>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-600">
                            {item.label} ({item.percentage}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
