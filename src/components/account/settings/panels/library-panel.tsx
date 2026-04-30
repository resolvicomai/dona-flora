import type * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SectionHeader } from '../components/section-header'
import { StatusMessage } from '../components/status-message'
import type { SettingsUiCopy } from '../copy'
import type { LibraryBrowseState, SaveStatus } from '../types'

export function LibraryPanel({
  browse,
  browseStatus,
  dir,
  indexStatus,
  isBrowsing,
  isBrowserOpen,
  isReindexing,
  isSaving,
  mdFileCount,
  onBrowse,
  onDirChange,
  onReindex,
  onSubmit,
  setLibraryStatus,
  strings,
  status,
}: {
  browse: LibraryBrowseState
  browseStatus: SaveStatus
  dir: string
  indexStatus: SaveStatus
  isBrowsing: boolean
  isBrowserOpen: boolean
  isReindexing: boolean
  isSaving: boolean
  mdFileCount: number | null
  onBrowse: (pathToOpen?: string) => Promise<void>
  onDirChange: (dir: string) => void
  onReindex: () => Promise<void>
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  setLibraryStatus: React.Dispatch<React.SetStateAction<SaveStatus>>
  strings: SettingsUiCopy['library']
  status: SaveStatus
}) {
  return (
    <div className="space-y-5">
      <form className="brand-window p-6 md:p-7" onSubmit={onSubmit}>
        <SectionHeader eyebrow={strings.eyebrow} title={strings.title} body={strings.body} />

        {status ? <StatusMessage status={status} /> : null}

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_12rem] lg:items-end">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">{strings.absolutePath}</span>
            <Input
              onChange={(event) => onDirChange(event.target.value)}
              placeholder="/Users/seu-usuario/Obsidian/livros"
              required
              spellCheck={false}
              value={dir}
            />
          </label>

          <Button
            className="h-11"
            disabled={isBrowsing}
            onClick={() => onBrowse(dir || undefined)}
            type="button"
            variant="outline"
          >
            {isBrowsing ? strings.browsing : strings.browse}
          </Button>

          <Button className="h-11" disabled={isSaving} type="submit">
            {isSaving ? strings.validating : strings.connectFolder}
          </Button>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{strings.helper}</p>

        {isBrowserOpen ? (
          <LibraryBrowser
            browse={browse}
            browseStatus={browseStatus}
            isBrowsing={isBrowsing}
            onBrowse={onBrowse}
            onDirChange={onDirChange}
            setLibraryStatus={setLibraryStatus}
            strings={strings}
          />
        ) : null}

        <div className="brand-inset mt-5 px-4 py-3 text-sm text-muted-foreground">
          {strings.status}:{' '}
          <span className="font-medium text-foreground">
            {dir ? strings.dirConfigured : strings.dirMissing}
          </span>
          {mdFileCount !== null ? ` - ${strings.mdCount(mdFileCount)}` : null}
        </div>
      </form>

      <section className="brand-window p-6 md:p-7">
        <SectionHeader
          eyebrow={strings.contextEyebrow}
          title={strings.contextTitle}
          body={strings.contextBody}
        />

        {indexStatus ? <StatusMessage status={indexStatus} /> : null}

        <Button className="mt-6" disabled={isReindexing} onClick={onReindex} type="button">
          {isReindexing ? strings.reindexing : strings.reindex}
        </Button>
      </section>
    </div>
  )
}

function LibraryBrowser({
  browse,
  browseStatus,
  isBrowsing,
  onBrowse,
  onDirChange,
  setLibraryStatus,
  strings,
}: {
  browse: LibraryBrowseState
  browseStatus: SaveStatus
  isBrowsing: boolean
  onBrowse: (pathToOpen?: string) => Promise<void>
  onDirChange: (dir: string) => void
  setLibraryStatus: React.Dispatch<React.SetStateAction<SaveStatus>>
  strings: SettingsUiCopy['library']
}) {
  return (
    <div className="brand-inset mt-5 space-y-4 px-4 py-4">
      {browseStatus ? <StatusMessage status={browseStatus} /> : null}

      {browse ? (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="eyebrow">{strings.browsingEyebrow}</p>
              <p className="mt-2 break-all text-sm font-medium text-foreground">{browse.path}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {strings.mdCount(browse.mdFileCount)}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                disabled={isBrowsing}
                onClick={() => onBrowse(browse.parent)}
                type="button"
                variant="outline"
              >
                {strings.up}
              </Button>
              <Button
                onClick={() => {
                  onDirChange(browse.path)
                  setLibraryStatus({
                    kind: 'success',
                    message: strings.selectedHint,
                  })
                }}
                type="button"
              >
                {strings.useThisFolder}
              </Button>
            </div>
          </div>

          {browse.shortcuts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {browse.shortcuts.map((shortcut) => (
                <button
                  className="surface-transition rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-hairline-strong hover:text-foreground"
                  key={shortcut.path}
                  onClick={() => onBrowse(shortcut.path)}
                  type="button"
                >
                  {shortcut.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className="max-h-72 overflow-y-auto rounded-md border border-hairline bg-surface">
            {browse.entries.length > 0 ? (
              browse.entries.map((entry) => (
                <button
                  className="surface-transition block w-full border-b border-hairline px-4 py-3 text-left text-sm text-foreground last:border-b-0 hover:bg-surface-elevated"
                  key={entry.path}
                  onClick={() => onBrowse(entry.path)}
                  type="button"
                >
                  {entry.name}
                </button>
              ))
            ) : (
              <p className="px-4 py-3 text-sm text-muted-foreground">{strings.emptyFolders}</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{strings.browsePrompt}</p>
      )}
    </div>
  )
}
