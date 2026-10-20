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

Against the public dev site, point the app at its edge, **not** at the website (`https://dev.orazaka.com` is the
Next.js BFF and answers a bearer client `401 Missing active security context`):

```bash
EXPO_PUBLIC_EDGE_URL=https://dev.orazaka.com/edge npx expo run:ios
```

The EAS `development` and `preview` profiles already set it.

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

**Standalone**: add `@krizaka:registry=https://npm.pkg.github.com` to `.npmrc`, then `npm install`.

Requirements: Node.js 22+.

## Governance

This repository follows the Orazaka governance contract — [AGENTS.md](https://github.com/krizaka/orazaka/blob/main/AGENTS.md)
in the workspace is normative; the local [AGENTS.md](AGENTS.md) only scopes it to this repository.

## License

Apache License 2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE).

---

<sub>A Krizaka product · [krizaka.com](https://www.krizaka.com) · Apache-2.0</sub>
