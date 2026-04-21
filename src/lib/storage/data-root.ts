import path from 'path'

function getRuntimeRoot() {
  const cwd = process.cwd()
  if (cwd.endsWith(path.join('.next', 'standalone'))) {
    return path.resolve(cwd, '..', '..')
  }

  return cwd
}

export function resolveRuntimePath(target: string) {
  if (path.isAbsolute(target)) {
    return target
  }

  return path.resolve(getRuntimeRoot(), target)
}

export function getDataRoot(dataRoot?: string) {
  return resolveRuntimePath(dataRoot ?? process.env.DATA_DIR ?? 'data')
}

export function getDataSubdirectory(subdirectory: string, directDir?: string) {
  if (directDir) {
    return resolveRuntimePath(directDir)
  }

  return path.join(getDataRoot(), subdirectory)
}
