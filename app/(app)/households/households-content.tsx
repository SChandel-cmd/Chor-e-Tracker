"use client";

import {
  acceptHouseholdInvite,
  createHousehold,
  declineHouseholdInvite,
} from "@/actions/households";
import Link from "next/link";
import { useTransition, useState } from "react";

type Household = { id: string; name: string };
type PendingInvite = { id: string; household_id: string; household_name: string };

export function HouseholdsContent({
  households,
  pendingInvites,
}: {
  households: Household[];
  pendingInvites: PendingInvite[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createHousehold(name);
      if (result.error) setError(result.error);
      else if (result.id) {
        setName("");
        window.location.href = `/households/${result.id}`;
      }
    });
  };

  const handleAccept = (inviteId: string) => {
    startTransition(async () => {
      const result = await acceptHouseholdInvite(inviteId);
      if (result.error) setError(result.error);
    });
  };

  const handleDecline = (inviteId: string) => {
    startTransition(async () => {
      await declineHouseholdInvite(inviteId);
    });
  };

  return (
    <div className="mt-6 space-y-8">
      {pendingInvites.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Pending invites
          </h2>
          <ul className="mt-2 space-y-2">
            {pendingInvites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <span className="font-medium text-gray-900">
                  {inv.household_name}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(inv.id)}
                    disabled={isPending}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(inv.id)}
                    disabled={isPending}
                    className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          Create household
        </h2>
        <form onSubmit={handleCreate} className="mt-2 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Household name"
            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Your households</h2>
        {households.length === 0 ? (
          <p className="mt-2 text-gray-600">
            You haven&apos;t joined any household yet. Create one or accept an
            invite.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {households.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/households/${h.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{h.name}</span>
                  <span className="ml-2 text-sm text-gray-500">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
