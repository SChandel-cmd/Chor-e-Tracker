"use client";

import {
  acceptFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from "@/actions/friends";
import Image from "next/image";
import { useTransition, useState } from "react";

type Incoming = {
  id: string;
  sender_id: string;
  status: string;
  username: string;
  avatar_url: string | null;
};

type Outgoing = {
  id: string;
  receiver_id: string;
  status: string;
  username: string;
  avatar_url: string | null;
};

type Friend = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export function FriendsContent({
  pendingIncoming,
  pendingOutgoing,
  friendsList,
}: {
  pendingIncoming: Incoming[];
  pendingOutgoing: Outgoing[];
  friendsList: Friend[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState("");

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const username = searchUsername.trim();
    if (!username) return;
    startTransition(async () => {
      const result = await sendFriendRequest(username);
      if (result.error) setError(result.error);
      else setSearchUsername("");
    });
  };

  const handleAccept = (requestId: string) => {
    startTransition(async () => {
      await acceptFriendRequest(requestId);
    });
  };

  const handleDecline = (requestId: string) => {
    startTransition(async () => {
      await declineFriendRequest(requestId);
    });
  };

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-gray-900">Add friend</h2>
        <form onSubmit={handleSendRequest} className="mt-2 flex gap-2">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Username"
            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Send request
          </button>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </section>

      {pendingIncoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Incoming requests
          </h2>
          <ul className="mt-2 space-y-2">
            {pendingIncoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  {r.avatar_url ? (
                    <Image
                      src={r.avatar_url}
                      alt=""
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                  )}
                  <span className="font-medium text-gray-900">@{r.username}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAccept(r.id)}
                    disabled={isPending}
                    className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(r.id)}
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

      {pendingOutgoing.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900">
            Pending (sent)
          </h2>
          <ul className="mt-2 space-y-2">
            {pendingOutgoing.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                {r.avatar_url ? (
                  <Image
                    src={r.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                )}
                <span className="font-medium text-gray-900">@{r.username}</span>
                <span className="text-sm text-gray-500">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Friends</h2>
        {friendsList.length === 0 ? (
          <p className="mt-2 text-gray-600">No friends yet. Send a request above.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {friendsList.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                {f.avatar_url ? (
                  <Image
                    src={f.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200" />
                )}
                <span className="font-medium text-gray-900">@{f.username}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
