# Privacy threat model — mesh-anonymous-qa

## What other peers in the same room can see

- The full text of every question submitted to the room.
- The net vote score on every question.
- Your **voter UUID** (a `crypto.randomUUID()` persisted to `localStorage`) attached to every vote you cast. The UUID is not tied to your name, IP, or device — but two votes from the same UUID are linkable to each other.
- Your Yjs awareness `clientID` — a per-session 32-bit random integer regenerated on every page load.

The question text itself is **not** signed or tagged with the author's voter UUID, so question submissions are stronger-anonymous than votes.

## What stays local

- Your voter UUID (used for dedup).
- Your room ID and mode (audience / presenter).
- Self-hosted infra overrides.

## What the signaling server sees

`signaling-server` (mine, source at https://github.com/baditaflorin/signaling-server) sees:

- The **room name** (`mesh-anonymous-qa:<roomId>`).
- Encrypted **SDP** offer/answer blobs being relayed between peers.
- The IP address of the peer making the WebSocket connection.

It does **not** see question text or votes — those flow peer-to-peer over WebRTC DataChannel.

## What the TURN server sees

`coturn-hetzner` (mine, source at https://github.com/baditaflorin/coturn-hetzner) relays encrypted WebRTC media/data when peers cannot connect directly. It sees:

- The IP addresses of the two peers being relayed.
- Encrypted DTLS-SRTP / DataChannel bytes. It cannot decrypt them.

## Permissions asked

None. No camera, microphone, motion, or notification permissions.

## What's NOT in the threat model

- **Sybil resistance.** A user can clear `localStorage` (or use a private window) and vote again. See ADR 0002 — acceptable trade-off for informal use.
- **Network observers.** On a hostile Wi-Fi, the network owner can see the WebSocket connection to `turn.0docker.com` and a relay flow to whatever TURN port you negotiate. They cannot decrypt the contents.
- **Question authorship correlation.** A peer with packet-inspection tools could correlate Yjs CRDT writes with awareness clientIDs and an IP address, defeating the "anonymous question" property. For a stronger threat model, route through Tor and accept the latency cost.
