# Contributing to Quikturn Logos

We welcome, appreciate, and applaud all contributions!

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10

### Setup

```bash
# Clone the repository
git clone https://github.com/quikturn-sdk/Logos.git
cd Logos

# Install dependencies
pnpm install

# Build the core SDK
pnpm build

# Run tests
pnpm test
```

### Project Structure

This is a pnpm monorepo:

| Package | Path | Description |
|---------|------|-------------|
| `@quikturn/logos` | `.` | Core SDK — URL builder, browser client, server client, web component |
| `@quikturn/logos-react` | `packages/react` | React components — QuikturnLogo, LogoCarousel, LogoGrid |
| `@quikturn/logos-next` | `packages/next` | Next.js integration — QuikturnImage (next/image wrapper), server helpers |
| `@quikturn/logos-vue` | `packages/vue` | Vue 3 components |
| `@quikturn/logos-svelte` | `packages/svelte` | Svelte 5 components |
| `@quikturn/logos-angular` | `packages/angular` | Angular standalone components with signal inputs |

## Development Workflow

### Building

```bash
# Build core SDK (required before building framework packages)
pnpm build

# Build a specific package
pnpm --filter @quikturn/logos-react build
```

### Testing

```bash
# Run core SDK tests
pnpm test

# Run a specific package's tests
pnpm --filter @quikturn/logos-vue test

# Watch mode
pnpm test:watch
```

### Linting and Type Checking

```bash
# Run both typecheck and lint
pnpm check

# Or individually
pnpm typecheck
pnpm lint
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Make your changes
4. Ensure tests pass (`pnpm test`)
5. Ensure types and lint pass (`pnpm check`)
6. Commit using [conventional commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `docs:`)
7. Open a pull request

### Commit Convention

We use [conventional commits](https://www.conventionalcommits.org/) to automate versioning and changelogs:

- `feat: ...` — new feature (minor version bump)
- `fix: ...` — bug fix (patch version bump)
- `docs: ...` — documentation only
- `chore: ...` — maintenance (no release)
- `feat!: ...` — breaking change (major version bump)

## Code Style

- TypeScript strict mode
- No runtime dependencies in the core SDK
- Each framework package re-implements beacon and href validation locally
- Coverage thresholds: 90% branches, 95% lines/functions/statements

## Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/quikturn-sdk/Logos/issues).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
