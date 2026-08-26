# Security audit — mesh-anonymous-qa

Generated: **2026-08-26T05:01:36.637Z** · 20 checks · 20 pass · 0 fail

> A programmatic, CPU-only verification of shared security invariants and app-specific safety checks.
> Re-run with `npm run audit:security` from this repo. Source: `mesh-common/tests/securityAudit.test.ts`
>
> - this app's `tests/e2e/security-audit.spec.ts` app-specific UI safety checks.

## Result

✅ **All checks pass.**

- crypto / Y.Doc invariants: **16 / 16**
- UI-flow checks: **4**

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
| `UI.QA.literalQuestionAndVisibilityBoundary` | Question text renders as literal text, and the app discloses that room participants can read unlabeled questions. | Submitted an image/onerror payload through the actual shared Yjs question flow; asserted no image node, no executed payload, no dialog, and visible boundary copy. |   ✅   |
| `UI.QA.literalQuestionAndVisibilityBoundary` | Question text renders as literal text, and the app discloses that room participants can read unlabeled questions. | Submitted an image/onerror payload through the actual shared Yjs question flow; asserted no image node, no executed payload, no dialog, and visible boundary copy. |   ✅   |
| `UI.QA.literalQuestionAndVisibilityBoundary` | Question text renders as literal text, and the app discloses that room participants can read unlabeled questions. | Submitted an image/onerror payload through the actual shared Yjs question flow; asserted no image node, no executed payload, no dialog, and visible boundary copy. |   ✅   |

## Evidence

Selected captured evidence (full payloads in `security-audit.json`):

### `L1.IDENTITY.persists`

```json
{
  "pubkeyA": "67a2ecc5bc5f45ffa3831f9fac7cfb9cac99eab33457660d6f909481a24ab68a",
  "pubkeyB": "67a2ecc5bc5f45ffa3831f9fac7cfb9cac99eab33457660d6f909481a24ab68a"
}
```

### `L1.IDENTITY.uniquePerApp`

```json
{
  "pubkeyA": "54923fa8d9262b42",
  "pubkeyB": "bc2c3996c8336c04"
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
  "plantedExpiresAt": 1787720436631,
  "now": 1787720496634
}
```

### `L1.MODERATOR.forgedClaimRejected`

```json
{
  "realPubkey": "da60eec23a0c8b53",
  "forgerPubkey": "e1365501e5d7e23a"
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
  "pubkeyPrefix": "ba2241d01e301da1"
}
```

### `L1.TOFU.fingerprint`

```json
{
  "fingerprint": "ef-a1-b5-13"
}
```

### `L1.TOFU.peerIdFromPubkey`

```json
{
  "peerId": "006fa30ee63fe9ed"
}
```

### `L1.TOFU.register`

```json
{
  "peerId": "alice",
  "pubkeyPrefix": "b48f4d729a60fe0f",
  "sigLen": 128
}
```

### `L1.TOFU.rejectImposter`

```json
{
  "forgedPubkey": "1c18e222a3db0457",
  "realPubkey": "2a45bef1a08610f2"
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
