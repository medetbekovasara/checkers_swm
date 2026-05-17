import { Trophy } from "lucide-react";
import { demoLeaderboard } from "@/services/ranking/ranking";

export function Leaderboard() {
  return (
    <section className="rounded-[8px] border border-[#ded8c9] bg-panel/[0.82] p-4 shadow-[0_14px_38px_rgba(63,69,75,0.10)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
        <Trophy className="h-4 w-4 text-volt" />
        Leaderboard
      </div>
      <div className="space-y-2">
        {demoLeaderboard.map((player, index) => (
          <div key={player.id} className="flex items-center justify-between rounded-[8px] border border-[#e4ddcb] bg-[#f8f5ec] px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-ink">#{index + 1} {player.handle}</div>
              <div className="text-xs text-ink/[0.46]">{player.wins}W · streak {player.streak}</div>
            </div>
            <div className="text-sm font-semibold text-violet">{player.xp}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
