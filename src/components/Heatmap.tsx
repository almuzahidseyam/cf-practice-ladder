import React from 'react';

type HeatmapProps = {
  data: Record<string, number>; // "YYYY-MM-DD": count
};

export const Heatmap = ({ data }: HeatmapProps) => {
  // Generate last 365 days
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  
  // Backtrack 364 days so we have exactly 365 days (52 weeks + 1 day)
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0] as string;
    days.push({
      date: dateStr,
      count: data[dateStr] || 0
    });
  }

  // Get color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'bg-base-300';
    if (count <= 2) return 'bg-success/30';
    if (count <= 4) return 'bg-success/60';
    if (count <= 6) return 'bg-success/80';
    return 'bg-success';
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-none mt-6">
      <h3 className="text-sm font-semibold mb-2">Last Year Activity (365 days)</h3>
      <div className="inline-flex flex-col gap-[3px] pr-2 pb-2">
        {/* We want a grid that flows columns-first. 
            Tailwind Grid doesn't easily flow columns left-to-right wrapping down, 
            so we'll construct columns manually. */}
        <div className="flex gap-[3px]">
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              {days.slice(colIndex * 7, (colIndex + 1) * 7).map((day) => (
                <div 
                  key={day.date} 
                  className={`w-3 h-3 rounded-sm ${getColor(day.count)} tooltip`}
                  data-tip={`${day.count} solved on ${day.date}`}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
