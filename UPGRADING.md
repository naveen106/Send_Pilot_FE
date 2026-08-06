# Upgrade guide

## Supported toolchain

- Node.js 24.18.0
- npm 10 or newer

## Routine verification

```bash
npm ci
npm run check
```

## Upgrade procedure

1. Change one dependency or Docker version at a time.
2. Run `npm install` and commit the updated lockfile.
3. Run `npm run check` and `npm audit`.
4. Build the Docker image and test the production bundle.

Keep the Node version in `package.json`, Dockerfile, and local development aligned.
