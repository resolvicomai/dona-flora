import { spawn } from 'child_process'
import { access, cp, mkdir, rm } from 'fs/promises'
import { constants } from 'fs'
import path from 'path'
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

const projectRoot = process.cwd()
const standaloneRoot = path.join(projectRoot, '.next', 'standalone')
const standaloneServer = path.join(standaloneRoot, 'server.js')

loadEnvConfig(projectRoot)

try {
  await access(path.join(projectRoot, '.next', 'BUILD_ID'), constants.F_OK)
} catch {
  console.error('Build production first with `npm run build` before starting the local preview.')
  process.exit(1)
}

async function syncStandaloneAssets() {
  const standaloneNextRoot = path.join(standaloneRoot, '.next')
  const standaloneStaticDir = path.join(standaloneNextRoot, 'static')
  const builtStaticDir = path.join(projectRoot, '.next', 'static')
  const publicDir = path.join(projectRoot, 'public')
  const standalonePublicDir = path.join(standaloneRoot, 'public')

  await mkdir(standaloneNextRoot, { recursive: true })
  await rm(standaloneStaticDir, { force: true, recursive: true })
  await cp(builtStaticDir, standaloneStaticDir, { recursive: true })

  try {
    await access(publicDir, constants.F_OK)
    await rm(standalonePublicDir, { force: true, recursive: true })
    await cp(publicDir, standalonePublicDir, { recursive: true })
  } catch {
    // Project has no public dir or it is not needed for this preview.
  }
}

await syncStandaloneAssets()

const child = spawn(
  process.execPath,
  [
    standaloneServer,
  ],
  {
    cwd: standaloneRoot,
    env: {
      ...process.env,
      HOSTNAME: process.env.HOSTNAME ?? '0.0.0.0',
      PORT: process.env.PORT ?? '3000',
    },
    stdio: 'inherit',
  },
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})
