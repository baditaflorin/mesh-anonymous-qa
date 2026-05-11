import { useEffect, useMemo, useState } from "react";
import { createRoomSync, type RoomSync } from "../sync/yjsRoom";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import type { Mode } from "../../App";

type Question = {
  id: string;
  text: string;
  ts: number;
  answered: boolean;
};

type Props = {
  roomId: string;
  mode: Mode;
  voterId: string;
};

export function QaBoard({ roomId, mode, voterId }: Props) {
  const [armed, setArmed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [voteMap, setVoteMap] = useState<Map<string, 1 | -1>>(new Map());
  const [peerCount, setPeerCount] = useState(0);
  const [draft, setDraft] = useState("");

  const room = useMemo<RoomSync | null>(() => {
    if (!armed) return null;
    return createRoomSync(roomId);
  }, [armed, roomId]);

  useEffect(() => {
    if (!armed) return undefined;
    void maybeFetchTurnCredentials();
    return undefined;
  }, [armed]);

  useEffect(() => {
    return () => {
      room?.provider?.destroy();
    };
  }, [room]);

  useEffect(() => {
    if (!room) return undefined;
    const qArr = room.doc.getArray<Question>("questions");
    const vMap = room.doc.getMap<1 | -1>("votes");

    const refreshQuestions = () => setQuestions(qArr.toArray().map((q) => ({ ...q })));
    const refreshVotes = () => {
      const next = new Map<string, 1 | -1>();
      vMap.forEach((value, key) => next.set(key, value));
      setVoteMap(next);
    };

    refreshQuestions();
    refreshVotes();
    qArr.observeDeep(refreshQuestions);
    vMap.observe(refreshVotes);

    const onAwareness = () => {
      if (!room.provider) return;
      const states = room.provider.awareness.getStates();
      setPeerCount(states.size > 0 ? states.size - 1 : 0);
    };
    room.provider?.awareness.on("change", onAwareness);
    onAwareness();

    const onMarkAll = () => {
      const items = qArr.toArray();
      room.doc.transact(() => {
        items.forEach((q, i) => {
          if (!q.answered) {
            qArr.delete(i, 1);
            qArr.insert(i, [{ ...q, answered: true }]);
          }
        });
      });
    };
    const onClearAnswered = () => {
      room.doc.transact(() => {
        for (let i = qArr.length - 1; i >= 0; i--) {
          const item = qArr.get(i);
          if (item && item.answered) qArr.delete(i, 1);
        }
        // Drop vote entries for deleted questions
        const remaining = new Set(qArr.toArray().map((q) => q.id));
        const stale: string[] = [];
        vMap.forEach((_v, key) => {
          const colon = key.indexOf(":");
          if (colon < 0) return;
          const qid = key.slice(0, colon);
          if (!remaining.has(qid)) stale.push(key);
        });
        stale.forEach((k) => vMap.delete(k));
      });
    };

    window.addEventListener("qa:mark-all-answered", onMarkAll);
    window.addEventListener("qa:clear-answered", onClearAnswered);

    return () => {
      qArr.unobserveDeep(refreshQuestions);
      vMap.unobserve(refreshVotes);
      room.provider?.awareness.off("change", onAwareness);
      window.removeEventListener("qa:mark-all-answered", onMarkAll);
      window.removeEventListener("qa:clear-answered", onClearAnswered);
    };
  }, [room]);

  const sorted = useMemo(() => {
    const tally = new Map<string, number>();
    voteMap.forEach((value, key) => {
      const colon = key.indexOf(":");
      if (colon < 0) return;
      const qid = key.slice(0, colon);
      tally.set(qid, (tally.get(qid) ?? 0) + value);
    });
    return [...questions]
      .map((q) => ({ q, net: tally.get(q.id) ?? 0 }))
      .sort((a, b) => {
        if (a.q.answered !== b.q.answered) return a.q.answered ? 1 : -1;
        if (b.net !== a.net) return b.net - a.net;
        return a.q.ts - b.q.ts;
      });
  }, [questions, voteMap]);

  const submit = () => {
    const text = draft.trim();
    if (!room || text.length === 0) return;
    const qArr = room.doc.getArray<Question>("questions");
    qArr.push([
      {
        id: crypto.randomUUID(),
        text: text.slice(0, 500),
        ts: Date.now(),
        answered: false,
      },
    ]);
    setDraft("");
  };

  const castVote = (qid: string, value: 1 | -1) => {
    if (!room) return;
    const vMap = room.doc.getMap<1 | -1>("votes");
    const key = `${qid}:${voterId}`;
    const current = vMap.get(key);
    if (current === value) {
      vMap.delete(key);
    } else {
      vMap.set(key, value);
    }
  };

  const markAnswered = (qid: string, answered: boolean) => {
    if (!room) return;
    const qArr = room.doc.getArray<Question>("questions");
    const items = qArr.toArray();
    const idx = items.findIndex((q) => q.id === qid);
    if (idx < 0) return;
    const existing = items[idx];
    if (!existing) return;
    room.doc.transact(() => {
      qArr.delete(idx, 1);
      qArr.insert(idx, [{ ...existing, answered }]);
    });
  };

  if (!armed) {
    return (
      <div className="qa-arm">
        <h1>mesh-anonymous-qa</h1>
        <p>
          Anonymous audience Q&amp;A. Submit questions, upvote others. Presenter sees the list
          sorted by votes. No login. No tracking. No server you have to trust.
        </p>
        <button type="button" className="qa-arm-button" onClick={() => setArmed(true)}>
          Join room
        </button>
        <p className="qa-hint">
          Room <code>{roomId}</code> · mode <code>{mode}</code>
        </p>
      </div>
    );
  }

  return (
    <div className={`qa-stage qa-mode-${mode}`}>
      <div className="qa-hud">
        <span>{peerCount + 1} phones</span>
        <span>·</span>
        <span>{questions.length} questions</span>
        <span>·</span>
        <span>{mode}</span>
      </div>

      {mode === "audience" && (
        <form
          className="qa-compose"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <textarea
            placeholder="Ask anything…"
            value={draft}
            maxLength={500}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
          />
          <button type="submit" disabled={draft.trim().length === 0}>
            Submit
          </button>
        </form>
      )}

      <ul className="qa-list">
        {sorted.length === 0 && <li className="qa-empty">No questions yet.</li>}
        {sorted.map(({ q, net }) => {
          const myVote = voteMap.get(`${q.id}:${voterId}`);
          return (
            <li
              key={q.id}
              className={`qa-item${q.answered ? " qa-answered" : ""} qa-vote-${myVote ?? "none"}`}
            >
              <div className="qa-votes">
                <button
                  type="button"
                  className={`qa-vote-btn qa-up${myVote === 1 ? " qa-active" : ""}`}
                  onClick={() => castVote(q.id, 1)}
                  aria-label="Upvote"
                  disabled={q.answered}
                >
                  ▲
                </button>
                <span className="qa-net">{net}</span>
                <button
                  type="button"
                  className={`qa-vote-btn qa-down${myVote === -1 ? " qa-active" : ""}`}
                  onClick={() => castVote(q.id, -1)}
                  aria-label="Downvote"
                  disabled={q.answered}
                >
                  ▼
                </button>
              </div>
              <div className="qa-body">
                <p className="qa-text">{q.text}</p>
                <div className="qa-meta">
                  <span>{new Date(q.ts).toLocaleTimeString()}</span>
                  {q.answered && <span className="qa-answered-tag">answered</span>}
                </div>
              </div>
              {mode === "presenter" && (
                <button
                  type="button"
                  className="qa-answer-btn"
                  onClick={() => markAnswered(q.id, !q.answered)}
                >
                  {q.answered ? "Unmark" : "Mark answered"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
