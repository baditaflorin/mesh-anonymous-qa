# Open Floor — visibility and privacy boundary

Open Floor is a shared-room tool, not a private inbox or a secure anonymity system. This page describes the data the app writes and the limits of its claims.

## What room participants can read

Anyone who joins the same room can receive the shared Yjs state, including:

- The complete text and timestamp of every question.
- Whether a question is marked covered.
- The current net vote score and the vote-map entries.
- The browser-local voter UUID inside each vote key (`<questionId>:<voterId>`). It is linkable across that browser’s votes in the room.
- This app deliberately does not show a numeric participant or connection count. Browser awareness is useful for transport coordination, but it is not a reliable roster across all peer paths and timing states.

The question record is exactly `{ id, text, ts, answered }`; it has **no author field** and the app does not write the voter UUID alongside question text. That is a narrow data-model property, not a promise that a determined participant cannot infer authorship from timing, network observations, screen context, or altered clients.

## What stays on this browser

- The room selection and local role (`audience` or `presenter`).
- The voter UUID before it is used in a vote. Once used, that UUID becomes part of shared vote-map keys.
- Locally configured signaling and TURN endpoint overrides.

Changing to facilitator mode is not authorization. The role only changes this browser’s UI; other participants can choose the same role and write equivalent shared-state changes.

## Network services involved

The app contacts the configured signaling endpoint to establish WebRTC sessions and may contact the configured TURN credential endpoint and relay. Those services can observe the network requests and connection metadata they receive, including IP addresses at their respective endpoints. The signaling service is given the room name used by y-webrtc (`mesh-anonymous-qa:<roomId>`).

WebRTC data channels use browser WebRTC transport security, but that does not make the room’s shared data secret from room participants. This app makes no claim of end-to-end identity verification, content access control, or protection from a malicious participant/client.

## Permissions

Open Floor does not request camera, microphone, motion, notification, or location permissions.

## Out of scope

- **Strong anonymity or authorship protection.** Do not use this app for whistleblowing, sensitive disclosures, or situations where identity inference matters.
- **Sybil resistance.** Clearing browser storage or using another browser can create a new voter UUID and vote again.
- **Moderator access control.** Facilitator controls are a convention for the group, not an enforced role.
- **Retention guarantees.** Participants can keep copies of shared state; clearing questions only removes them from the current shared document going forward.

For the current executable safety checks, see the published [security audit](security-audit.md) after a release.
