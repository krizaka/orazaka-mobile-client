<!-- krizaka-header -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/krizaka/.github/main/profile/assets/orazaka-dark.svg">
  <img src="https://raw.githubusercontent.com/krizaka/.github/main/profile/assets/orazaka-light.svg" alt="Orazaka" width="96">
</picture>

# Orazaka Mobile Client

**The AI that never leaves home.**

Expo / React Native client of the Orazaka platform (talks to the edge with Bearer tokens).

[![CI](https://github.com/krizaka/orazaka-mobile-client/actions/workflows/ci.yml/badge.svg)](https://github.com/krizaka/orazaka-mobile-client/actions/workflows/ci.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/krizaka/orazaka-mobile-client/badge)](https://scorecard.dev/viewer/?uri=github.com/krizaka/orazaka-mobile-client)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Orazaka](https://img.shields.io/badge/part%20of-Orazaka-f67e23)](https://github.com/krizaka/orazaka#repositories)
[![Docs](https://img.shields.io/badge/docs-krizaka.com-f67e23)](https://www.krizaka.com/en/products/orazaka)

[Documentation](https://www.krizaka.com/en/products/orazaka) · [Website](https://www.krizaka.com) · [Krizaka on GitHub](https://github.com/krizaka)

</div>
<!-- /krizaka-header -->

**Layer:** Client application · **Version:** `1.0.0-SNAPSHOT` · **License:** Apache-2.0 ·
part of the [Orazaka platform](https://github.com/krizaka/orazaka) by [Krizaka](https://krizaka.com)

## What it provides

The Expo SDK 53 client (port `8081`). Native clients call the edge (`:8088`) with
`Authorization: Bearer`, not the BFF. Shares tokens and types with the web via
[@krizaka/orazaka-shared](https://github.com/krizaka/orazaka-ui-kit).

```bash
npm install && npm start
```

The app does not hard-code where the edge is: at start it reads the **signed manifest**
`https://www.krizaka.com/.well-known/krizaka/services.json` ([`@krizaka/discovery`](https://ui.krizaka.com/packages/discovery),
[ADR-003](https://github.com/krizaka/.github/blob/main/docs/adr/ADR-003-mobile-service-discovery.md)); a move of the edge is a
manifest edit and a krizaka.com deploy, never a store release. Offline it falls back to its cache, then to the baked dev edge
(`https://dev.orazaka.com/edge` — the edge, **not** the website: `https://dev.orazaka.com` is the Next.js BFF and answers a
bearer client `401 Missing active security context`).

To run against the local stack, override discovery for your build with an edge the device can reach:

```bash
EXPO_PUBLIC_EDGE_URL=http://192.168.1.5:8088 npx expo run:ios      # http://10.0.2.2:8088 for the Android emulator
```

No EAS profile sets an address; they only set `EXPO_PUBLIC_APP_ENV=dev` (which entry of the manifest the build follows).

Running it on a simulator against the local stack, what each screen does today and what is missing:
[docs/MOBILE.md](https://github.com/krizaka/orazaka/blob/main/docs/MOBILE.md) of the workspace.

## Position in the platform

| | |
|:---|:---|
| Depends on | [`orazaka-ui-kit`](https://github.com/krizaka/orazaka-ui-kit) |
| Used by | _no other Orazaka repository._ |
| Workspace path | `orazaka-apps/ui/orazaka-mobile-client` |

## Build

**Inside the Orazaka workspace** (npm workspaces link `@krizaka/*` packages from source):

```bash
git clone https://github.com/krizaka/orazaka.git && cd orazaka
node scripts/workspace.mjs clone
cd orazaka-apps/ui && npm install
```

**Standalone**: `npm ci` (the `@krizaka/*` packages are on the public npm registry).

**End-to-end flows** (Maestro, `.maestro/`): `mobile-e2e.yml` runs the flows tagged `ci` on an Android emulator on
every pull request, through the org's reusable workflow (the check is `mobile-e2e / gate`). A `ci` flow needs no backend
and no account (`sign-in.yaml`: the first screen and its sign-in rule). The flows that sign in against the dev platform
(`smoke`, `story`, `story-video`) are tagged `manual` and run by hand:
`maestro test .maestro/smoke.yaml -e ORAZAKA_EMAIL=… -e ORAZAKA_PASSWORD=…`. `npm run test:flows` checks that every flow
carries exactly one of the two tags.

Requirements: Node.js 22+.

## Governance

This repository follows the Orazaka governance contract — [AGENTS.md](https://github.com/krizaka/orazaka/blob/main/AGENTS.md)
in the workspace is normative; the local [AGENTS.md](AGENTS.md) only scopes it to this repository.

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

<sub>A Krizaka product · [krizaka.com](https://www.krizaka.com) · Apache-2.0</sub>
