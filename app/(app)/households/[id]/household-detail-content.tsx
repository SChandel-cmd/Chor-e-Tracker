"use client";

import {
  addChoreTemplate,
  logChore,
} from "@/actions/chores";
import { inviteToHousehold } from "@/actions/households";
import Image from "next/image";
import { useTransition, useState } from "react";

type Member = {
  user_id: string;
  role: string;
  username: string;
  avatar_url: string | null;
};

type Template = {
  id: string;
  name: string;
  type: string;
  points: number;
};

type LeaderboardRow = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
};

type HistoryEntry = {
  id: string;
  chore_name: string;
  points: number;
  created_at: string;
  created_by: string;
  participants: { user_id: string; points_earned: number }[];
};

type InviteableFriend = { id: string; username: string | null };

export function HouseholdDetailContent({
  householdId,
  members,
  templates,
  leaderboard,
  history,
  usernameById,
  inviteableFriends,
  currentUserId,
}: {
  householdId: string;
  members: Member[];
  templates: Template[];
  leaderboard: LeaderboardRow[];
  history: HistoryEntry[];
  usernameById: Record<string, string>;
  inviteableFriends: InviteableFriend[];
  currentUserId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [choreName, setChoreName] = useState("");
  const [choreType, setChoreType] = useState("general");
  const [chorePoints, setChorePoints] = useState(10);
  const [logChoreId, setLogChoreId] = useState("");
  const [logParticipantIds, setLogParticipantIds] = useState<string[]>([]);
  const [inviteUserId, setInviteUserId] = useState("");

  const handleAddChore = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addChoreTemplate(householdId, choreName, choreType, chorePoints);
      if (result.error) setError(result.error);
      else {
        setChoreName("");
        setChorePoints(10);
      }
    });
  };

  const handleLogChore = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!logChoreId || logParticipantIds.length === 0) {
      setError("Select a chore and at least one participant.");
      return;
    }
    startTransition(async () => {
      const result = await logChore(householdId, logChoreId, logParticipantIds);
      if (result.error) setError(result.error);
      else {
        setLogChoreId("");
        setLogParticipantIds([]);
      }
    });
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!inviteUserId) return;
    startTransition(async () => {
      const result = await inviteToHousehold(householdId, inviteUserId);
      if (result.error) setError(result.error);
      else setInviteUserId("");
    });
  };

  const toggleParticipant = (userId: string) => {
    setLogParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="mt-6 space-y-8">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm"
            >
              {m.avatar_url ? (
                <Image src={m.avatar_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-300" />
              )}
              <span>@{m.username}</span>
              {m.role === "owner" && (
                <span className="text-xs text-gray-500">(owner)</span>
              )}
            </li>
          ))}
        </ul>
        {inviteableFriends.length > 0 && (
          <form onSubmit={handleInvite} className="mt-3 flex gap-2">
            <select
              value={inviteUserId}
              onChange={(e) => setInviteUserId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="">Invite a friend…</option>
              {inviteableFriends.map((f) => (
                <option key={f.id} value={f.id}>
                  @{f.username ?? f.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isPending || !inviteUserId}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Invite
            </button>
          </form>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Chore templates</h2>
        <form onSubmit={handleAddChore} className="mt-2 flex flex-wrap gap-2">
          <input
            type="text"
            value={choreName}
            onChange={(e) => setChoreName(e.target.value)}
            placeholder="Chore name"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={isPending}
          />
          <input
            type="text"
            value={choreType}
            onChange={(e) => setChoreType(e.target.value)}
            placeholder="Type (e.g. cleaning)"
            className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={isPending}
          />
          <input
            type="number"
            min={1}
            value={chorePoints}
            onChange={(e) => setChorePoints(Number(e.target.value) || 1)}
            className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={isPending}
          />
          <span className="flex items-center text-sm text-gray-500">points</span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add chore
          </button>
        </form>
        <ul className="mt-3 space-y-1">
          {templates.map((t) => (
            <li key={t.id} className="text-sm text-gray-700">
              <span className="font-medium">{t.name}</span>
              <span className="text-gray-500"> — {t.type}, {t.points} pts</span>
            </li>
          ))}
          {templates.length === 0 && (
            <li className="text-sm text-gray-500">No chores yet. Add one above.</li>
          )}
        </ul>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Log a chore</h2>
        <form onSubmit={handleLogChore} className="mt-2 space-y-3">
          <div>
            <label className="block text-sm text-gray-600">Chore</label>
            <select
              value={logChoreId}
              onChange={(e) => setLogChoreId(e.target.value)}
              className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              disabled={isPending}
            >
              <option value="">Select chore…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.points} pts)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600">Participants (points split)</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {members.map((m) => (
                <label key={m.user_id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={logParticipantIds.includes(m.user_id)}
                    onChange={() => toggleParticipant(m.user_id)}
                    disabled={isPending}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">@{m.username}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending || !logChoreId || logParticipantIds.length === 0}
            className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            Log chore
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          {leaderboard.map((row) => (
            <li key={row.user_id} className="flex items-center gap-2">
              {row.avatar_url ? (
                <Image src={row.avatar_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-300" />
              )}
              <span className="font-medium">@{row.username}</span>
              <span className="text-gray-600">
                {row.total_points.toFixed(1)} pts
              </span>
              {row.user_id === currentUserId && (
                <span className="text-xs text-gray-500">(you)</span>
              )}
            </li>
          ))}
          {leaderboard.length === 0 && (
            <li className="text-sm text-gray-500">No points yet. Log a chore!</li>
          )}
        </ol>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">History</h2>
        <ul className="mt-2 space-y-2">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="border-b border-gray-100 py-2 text-sm last:border-0"
            >
              <span className="font-medium text-gray-900">{entry.chore_name}</span>
              <span className="text-gray-500"> — {entry.points} pts</span>
              <span className="text-gray-400">
                {" "}
                {new Date(entry.created_at).toLocaleDateString()}
              </span>
              <div className="mt-1 text-gray-600">
                Done by:{" "}
                {entry.participants
                  .map(
                    (p) =>
                      `@${usernameById[p.user_id] ?? "—"} (${Number(p.points_earned).toFixed(1)} pts)`
                  )
                  .join(", ")}
              </div>
            </li>
          ))}
          {history.length === 0 && (
            <li className="text-sm text-gray-500">No chores logged yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
