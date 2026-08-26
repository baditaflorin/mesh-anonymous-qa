import { useEffect, useMemo, useState } from "react";
import {
  MeshButton,
  MeshEmpty,
  MeshLaunch,
  MeshStatusPill,
  MeshSurface,
  MeshTextArea,
} from "@baditaflorin/mesh-common";
import { maybeFetchTurnCredentials } from "../sync/iceConfig";
import { createRoomSync, type RoomSync } from "../sync/yjsRoom";
import type { Mode } from "../../App";

export type Question = {
  id: string;
  text: string;
  ts: number;
  answered: boolean;
};

export type RankedQuestion = {
  q: Question;
  net: number;
};

type Props = {
  roomId: string;
  mode: Mode;
  voterId: string;
};

/**
 * Keeps the queue's behavior independent from its presentation: unanswered
 * questions lead, then the room's current vote score, then arrival order.
 */
export function rankQuestions(
  questions: Question[],
  voteMap: Map<string, 1 | -1>,
): RankedQuestion[] {
  const tally = new Map<string, number>();
  voteMap.forEach((value, key) => {
    const colon = key.indexOf(":");
    if (colon < 0) return;
    const questionId = key.slice(0, colon);
    tally.set(questionId, (tally.get(questionId) ?? 0) + value);
  });

  return [...questions]
    .map((q) => ({ q, net: tally.get(q.id) ?? 0 }))
    .sort((a, b) => {
      if (a.q.answered !== b.q.answered) return a.q.answered ? 1 : -1;
      if (b.net !== a.net) return b.net - a.net;
      return a.q.ts - b.q.ts;
    });
}

function questionCountLabel(count: number): string {
  return `${count} ${count === 1 ? "question" : "questions"}`;
}

function questionTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function QaBoard({ roomId, mode, voterId }: Props) {
  const [armed, setArmed] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [voteMap, setVoteMap] = useState<Map<string, 1 | -1>>(new Map());
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
    const questionArray = room.doc.getArray<Question>("questions");
    const votes = room.doc.getMap<1 | -1>("votes");

    const refreshQuestions = () =>
      setQuestions(questionArray.toArray().map((question) => ({ ...question })));
    const refreshVotes = () => {
      const next = new Map<string, 1 | -1>();
      votes.forEach((value, key) => next.set(key, value));
      setVoteMap(next);
    };
    refreshQuestions();
    refreshVotes();
    questionArray.observeDeep(refreshQuestions);
    votes.observe(refreshVotes);

    const onMarkAll = () => {
      const items = questionArray.toArray();
      room.doc.transact(() => {
        items.forEach((question, index) => {
          if (!question.answered) {
            questionArray.delete(index, 1);
            questionArray.insert(index, [{ ...question, answered: true }]);
          }
        });
      });
    };
    const onClearAnswered = () => {
      room.doc.transact(() => {
        for (let index = questionArray.length - 1; index >= 0; index -= 1) {
          const question = questionArray.get(index);
          if (question?.answered) questionArray.delete(index, 1);
        }
        // The vote map is deliberately flat; only drop entries whose question
        // no longer exists so active votes remain untouched.
        const remaining = new Set(questionArray.toArray().map((question) => question.id));
        const stale: string[] = [];
        votes.forEach((_value, key) => {
          const colon = key.indexOf(":");
          if (colon < 0) return;
          if (!remaining.has(key.slice(0, colon))) stale.push(key);
        });
        stale.forEach((key) => votes.delete(key));
      });
    };

    window.addEventListener("qa:mark-all-answered", onMarkAll);
    window.addEventListener("qa:clear-answered", onClearAnswered);

    return () => {
      questionArray.unobserveDeep(refreshQuestions);
      votes.unobserve(refreshVotes);
      window.removeEventListener("qa:mark-all-answered", onMarkAll);
      window.removeEventListener("qa:clear-answered", onClearAnswered);
    };
  }, [room]);

  const ranked = useMemo(() => rankQuestions(questions, voteMap), [questions, voteMap]);

  const submit = () => {
    const text = draft.trim();
    if (!room || text.length === 0) return;
    room.doc.getArray<Question>("questions").push([
      {
        id: crypto.randomUUID(),
        text: text.slice(0, 500),
        ts: Date.now(),
        answered: false,
      },
    ]);
    setDraft("");
  };

  const castVote = (questionId: string, value: 1 | -1) => {
    if (!room) return;
    const votes = room.doc.getMap<1 | -1>("votes");
    const key = `${questionId}:${voterId}`;
    if (votes.get(key) === value) {
      votes.delete(key);
    } else {
      votes.set(key, value);
    }
  };

  const markAnswered = (questionId: string, answered: boolean) => {
    if (!room) return;
    const questionArray = room.doc.getArray<Question>("questions");
    const questionsInRoom = questionArray.toArray();
    const index = questionsInRoom.findIndex((question) => question.id === questionId);
    const current = questionsInRoom[index];
    if (!current || index < 0) return;
    room.doc.transact(() => {
      questionArray.delete(index, 1);
      questionArray.insert(index, [{ ...current, answered }]);
    });
  };

  if (!armed) {
    return (
      <main className="qa-entry" data-qa-view="entry">
        <MeshLaunch
          className="qa-launch"
          eyebrow="Facilitated question room"
          heading="Let the room ask."
          promise="Collect the questions worth hearing without turning the conversation into a feed."
          presence={
            <span>
              This room is <code>{roomId}</code>
            </span>
          }
          preview={
            <section className="qa-visibility-note" data-qa-visibility="shared-room">
              <span className="qa-note-kicker">Shared-room visibility</span>
              <p>
                Questions are stored without an author label. Everyone who joins this room can read
                them.
              </p>
              <p>Do not include names or sensitive details.</p>
            </section>
          }
          primaryAction={{
            label: "Open this question room",
            onClick: () => setArmed(true),
          }}
        />
      </main>
    );
  }

  return (
    <main className={`qa-stage qa-mode-${mode}`} data-qa-view="room">
      <header className="qa-stage-header">
        <div className="qa-stage-title">
          <p className="qa-overline">Facilitated questions</p>
          <h1>Room queue</h1>
          <p>
            Questions in <code>{roomId}</code> are visible to everyone sharing this room.
          </p>
        </div>
        <div className="qa-room-status" aria-label="Room status">
          <MeshStatusPill tone="info" data-qa-room-scope="shared-room">
            Shared room
          </MeshStatusPill>
          <MeshStatusPill tone="info">{questionCountLabel(questions.length)}</MeshStatusPill>
          <span className="qa-mode-note">Local role · {mode}</span>
        </div>
      </header>

      <div className="qa-workspace">
        {mode === "audience" ? (
          <MeshSurface
            as="section"
            tone="accent"
            padding="lg"
            className="qa-composer-panel"
            aria-labelledby="qa-compose-title"
          >
            <div className="qa-panel-heading">
              <p className="qa-panel-kicker">Your prompt</p>
              <h2 id="qa-compose-title">Ask the room</h2>
              <p>
                Add one clear question. It will appear in the shared queue without an author label.
              </p>
            </div>
            <form
              className="qa-compose"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <MeshTextArea
                id="qa-question-draft"
                name="question"
                label="Your question"
                hint="Questions are stored without an author label. Everyone who joins this room can read them."
                fieldClassName="qa-question-field"
                className="qa-question-input"
                placeholder="What would make this clearer?"
                value={draft}
                onValueChange={setDraft}
                maxLength={500}
                rows={4}
              />
              <div className="qa-compose-footer">
                <span className="qa-character-count" aria-live="polite">
                  {draft.length} / 500
                </span>
                <MeshButton type="submit" disabled={draft.trim().length === 0}>
                  Submit question
                </MeshButton>
              </div>
            </form>
          </MeshSurface>
        ) : (
          <MeshSurface
            as="section"
            tone="accent"
            padding="lg"
            className="qa-composer-panel qa-facilitator-panel"
            aria-labelledby="qa-facilitator-title"
          >
            <div className="qa-panel-heading">
              <p className="qa-panel-kicker">Facilitator view</p>
              <h2 id="qa-facilitator-title">Keep the conversation moving.</h2>
              <p>
                Mark a question answered when it has been covered. This local role changes the
                controls on this browser; it is not an access-control boundary.
              </p>
            </div>
            <div className="qa-facilitator-summary">
              <span>{ranked.filter(({ q }) => !q.answered).length} open</span>
              <span>{ranked.filter(({ q }) => q.answered).length} covered</span>
            </div>
          </MeshSurface>
        )}

        <MeshSurface
          as="section"
          tone="raised"
          padding="none"
          className="qa-queue-panel"
          aria-labelledby="qa-queue-title"
        >
          <header className="qa-queue-header">
            <div>
              <p className="qa-panel-kicker">Shared queue</p>
              <h2 id="qa-queue-title">What the room wants to cover</h2>
            </div>
            <span
              className="qa-queue-count"
              aria-label={`${questionCountLabel(questions.length)} in queue`}
            >
              {questions.length}
            </span>
          </header>

          {ranked.length === 0 ? (
            <MeshEmpty
              className="qa-empty"
              size="lg"
              title="The queue is clear."
              message={
                mode === "audience"
                  ? "Ask the first question to give the room a place to begin."
                  : "Questions from the room will collect here in vote order."
              }
            />
          ) : (
            <ul className="qa-list" aria-label="Question queue">
              {ranked.map(({ q, net }) => {
                const myVote = voteMap.get(`${q.id}:${voterId}`);
                const questionLabel = q.answered ? "Answered question" : "Open question";
                return (
                  <li
                    key={q.id}
                    className={`qa-item${q.answered ? " qa-answered" : ""} qa-vote-${myVote ?? "none"}`}
                  >
                    <div className="qa-votes" aria-label={`${net} net votes`}>
                      <MeshButton
                        type="button"
                        variant="quiet"
                        size="sm"
                        className="qa-vote-button qa-up"
                        onClick={() => castVote(q.id, 1)}
                        aria-label={`Upvote question: ${q.text}`}
                        aria-pressed={myVote === 1}
                        disabled={q.answered}
                      >
                        ↑
                      </MeshButton>
                      <output className="qa-net" aria-label={`${net} net votes`}>
                        {net}
                      </output>
                      <MeshButton
                        type="button"
                        variant="quiet"
                        size="sm"
                        className="qa-vote-button qa-down"
                        onClick={() => castVote(q.id, -1)}
                        aria-label={`Downvote question: ${q.text}`}
                        aria-pressed={myVote === -1}
                        disabled={q.answered}
                      >
                        ↓
                      </MeshButton>
                    </div>
                    <article className="qa-body" aria-label={questionLabel}>
                      <p className="qa-text">{q.text}</p>
                      <div className="qa-meta">
                        <time dateTime={new Date(q.ts).toISOString()}>{questionTime(q.ts)}</time>
                        <span>author label not stored</span>
                        {q.answered ? <span className="qa-answered-tag">Covered</span> : null}
                      </div>
                    </article>
                    {mode === "presenter" ? (
                      <MeshButton
                        type="button"
                        variant={q.answered ? "secondary" : "primary"}
                        size="sm"
                        className="qa-answer-button"
                        onClick={() => markAnswered(q.id, !q.answered)}
                      >
                        {q.answered ? "Reopen" : "Mark covered"}
                      </MeshButton>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </MeshSurface>
      </div>
    </main>
  );
}
