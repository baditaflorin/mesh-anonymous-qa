# Security audit — mesh-anonymous-qa

Generated: **2026-08-26T04:35:40.323Z** · 17 checks · 17 pass · 0 fail

> A programmatic, CPU-only verification of shared security invariants and app-specific safety checks.
> Re-run with `npm run audit:security` from this repo. Source: `mesh-common/tests/securityAudit.test.ts`
>
> - this app's `tests/e2e/security-audit.spec.ts` app-specific UI safety checks.

## Result

✅ **All checks pass.**

- crypto / Y.Doc invariants: **16 / 16**
- UI-flow checks: **1**

## Checks

| ID                                           | Claim                                                                                                             | Method                                                                                                                                                             | Result |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----: |
| `L1.IDENTITY.persists`                       | Identity key persists across reloads via localStorage                                                             | loadOrCreateIdentity called twice with same prefix; both keypairs match                                                                                            |   ✅   |
| `L1.IDENTITY.uniquePerApp`                   | Each storagePrefix produces a distinct keypair (no cross-app reuse)                                               | loadOrCreateIdentity with two different prefixes; private keys differ                                                                                              |   ✅   |
| `L1.MODERATOR.claimSyncs`                    | A claims moderator → B's hook reports A as current moderator                                                      | linkMockRooms relays Y.Doc updates; A.claim() then read on B                                                                                                       |   ✅   |
| `L1.MODERATOR.expiredClaimIgnored`           | A signed claim with expiresAt in the past is treated as vacant                                                    | Plant claim with expiresAt = now - 60s; hook reports current=null                                                                                                  |   ✅   |
| `L1.MODERATOR.forgedClaimRejected`           | A claim with a signature not matching its embedded pubkey is treated as vacant                                    | Plant {pubkey:real, sig:forger}; hook rejects and reports current=null                                                                                             |   ✅   |
| `L1.MODERATOR.releaseSyncs`                  | Relinquish by the current moderator clears the slot for all peers                                                 | After A.relinquish() both A and B observe current=null                                                                                                             |   ✅   |
| `L1.MODERATOR.signedClaim`                   | The moderator claim's signature verifies against the embedded pubkey                                              | verify({peerId,pubkey,claimedAt,expiresAt,nonce}, sig, pubkey) === true                                                                                            |   ✅   |
| `L1.MODERATOR.vacantDefault`                 | Fresh room reports no moderator and isMe=false                                                                    | useModerator hook on a fresh mock room returns {current:null, isMe:false}                                                                                          |   ✅   |
| `L1.SIGN.rejectGarbage`                      | Invalid signature / pubkey inputs return false instead of crashing                                                | verify({x:1}, 'not-hex', 'also-bad') and verify({x:1}, '', '') both false                                                                                          |   ✅   |
| `L1.SIGN.rejectTampered`                     | A signed payload with any byte modified fails verification                                                        | Sign {msg:'hello'}, then verify({msg:'HELLO'}, …) returns false                                                                                                    |   ✅   |
| `L1.SIGN.rejectWrongKey`                     | A's signature does not verify under B's public key                                                                | Sign with kpA.priv, verify with kpB.pub returns false                                                                                                              |   ✅   |
| `L1.SIGN.roundtrip`                          | A signed payload verifies against the matching pubkey                                                             | Ed25519 sign(payload, privkey) then verify(payload, sig, pubkey)                                                                                                   |   ✅   |
| `L1.TOFU.fingerprint`                        | trustFingerprint emits a 4x2-hex grouped string for in-person verification                                        | fingerprint(peerId, pubkey) matches /^xx-xx-xx-xx$/                                                                                                                |   ✅   |
| `L1.TOFU.peerIdFromPubkey`                   | peerIdFromPubkey is deterministic and uses 64-bit prefix of pubkey                                                | Two calls with same pubkey return the same 16-hex-char id                                                                                                          |   ✅   |
| `L1.TOFU.register`                           | register() writes a self-signed PubkeyRecord into the registry Y.Map                                              | Verify the stored record's signature against its own pubkey                                                                                                        |   ✅   |
| `L1.TOFU.rejectImposter`                     | A forged record signed by the wrong key does not block the real peer from publishing                              | Pre-write mallory-signed alice claim; alice arrives and overwrites with her own                                                                                    |   ✅   |
| `UI.QA.literalQuestionAndVisibilityBoundary` | Question text renders as literal text, and the app discloses that room participants can read unlabeled questions. | Submitted an image/onerror payload through the actual shared Yjs question flow; asserted no image node, no executed payload, no dialog, and visible boundary copy. |   ✅   |

## Evidence

Selected captured evidence (full payloads in `security-audit.json`):

### `L1.IDENTITY.persists`

```json
{
  "pubkeyA": "4388d6d24880b6872397f9c2f4d975a7003f3498ba27ba9245bcd7c57088f7df",
  "pubkeyB": "4388d6d24880b6872397f9c2f4d975a7003f3498ba27ba9245bcd7c57088f7df"
}
```

### `L1.IDENTITY.uniquePerApp`

```json
{
  "pubkeyA": "32404c1184c3c37b",
  "pubkeyB": "042ba3a3be285b66"
}
```

### `L1.MODERATOR.claimSyncs`

```json
{
  "claimer": "alice",
  "ttlMs": 1800000
}
```

### `L1.MODERATOR.expiredClaimIgnored`

```json
{
  "plantedExpiresAt": 1787718880317,
  "now": 1787718940320
}
```

### `L1.MODERATOR.forgedClaimRejected`

```json
{
  "realPubkey": "c679708dbb6dc325",
  "forgerPubkey": "f2a18fa4c12066a2"
}
```

### `L1.MODERATOR.signedClaim`

```json
{
  "sigLen": 128,
  "nonceLen": 32
}
```

### `L1.SIGN.roundtrip`

```json
{
  "sigLen": 128,
  "pubkeyPrefix": "418aaceeb3107570"
}
```

### `L1.TOFU.fingerprint`

```json
{
  "fingerprint": "72-4f-3d-69"
}
```

### `L1.TOFU.peerIdFromPubkey`

```json
{
  "peerId": "2689c94b4009b02a"
}
```

### `L1.TOFU.register`

```json
{
  "peerId": "alice",
  "pubkeyPrefix": "68f4019dc8d6dcce",
  "sigLen": 128
}
```

### `L1.TOFU.rejectImposter`

```json
{
  "forgedPubkey": "b479ed0f442ef5de",
  "realPubkey": "b4056824634b3994"
}
```

### `UI.QA.literalQuestionAndVisibilityBoundary`

```json
{
  "renderedLiteral": true,
  "injectedImageCount": 0,
  "payloadExecuted": false,
  "dialogs": 0,
  "boundaryCopyVisible": true
}
```

---

## How to re-run

```bash
cd mesh-anonymous-qa
npm run audit:security
```

The audit runs in two passes:

1. **Crypto invariants** (Vitest, ~1s) — sign/verify roundtrips, TOFU registry, moderator role state machine, forged-claim rejection, expired-claim rejection. Uses in-memory Yjs mock rooms; no browser.
2. **UI flow** (Playwright, app-specific) — opens the browser scenario declared in `tests/e2e/security-audit.spec.ts` and verifies the app's own safety contract.

Both run **headless, CPU-only**. No GPU acceleration is required; no signaling server is contacted. The fleet's `judge.sh` aggregator includes these checks alongside per-app feature tests.
