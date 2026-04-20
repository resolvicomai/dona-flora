# Book Language And Multilingual UI Design

## Summary

Extend Dona Flora so book language becomes a first-class metadata field and the product UI supports four app languages: `pt-BR`, `en`, `es`, and `zh-CN`.

This design follows the approved "lean i18n + real language metadata in the catalog" approach:

- book language is auto-filled from external search APIs and persisted with the book
- the app language is chosen by the user in settings
- the app language controls UI copy and Dona Flora's response language
- there are no locale-prefixed routes in this phase
- book language is not manually editable in the add/edit forms for now

## Goals

- Make it easy to distinguish book language during search without relying on ISBN.
- Surface book language consistently in search results, browse surfaces, and book detail.
- Preserve whatever language code external APIs return while presenting it cleanly in the UI.
- Support multilingual UI for `pt-BR`, `en`, `es`, and `zh-CN`.
- Make Dona Flora answer in the user's chosen app language.

## Non-Goals

- No route-level locale prefixes such as `/en/...` or `/es/...`.
- No automatic translation of book metadata, notes, or imported descriptions.
- No manual language override field in add-book or edit-book flows.
- No language-based search filtering in this phase.
- No backfill migration that tries to infer language for existing saved books.

## User Experience

### Search Results

Each search result will display a compact language tag near the main metadata, visible before selection. The tag should use short uppercase display labels when a known mapping exists:

- `pt-BR` -> `PT-BR`
- `en` or `en-US` or `en-GB` -> `EN`
- `es` or regional Spanish variants -> `ES`
- `zh`, `zh-CN`, `zh-Hans` -> `ZH-CN`

For any other code returned by the API, the UI will show a normalized uppercase display form based on the raw code rather than hiding it.

If the source API does not provide a language, no language tag is shown.

### Library Surfaces

Browse cards and list rows will show language in the same metadata cluster as status and rating. The intended order is:

1. status
2. rating, when present
3. language, when present

This keeps the signal compact and scan-friendly without introducing another row of metadata.

### Book Detail

The detail page will include language in the primary metadata section alongside genre, year, and ISBN.

### Settings

The existing user language preference becomes explicitly an app-language preference. In copy and behavior, it means:

- interface language
- Dona Flora response language

It does not imply the language of books in the user's library.

## Data Model

### Book Metadata

Add an optional `language` field to the book schema and persistence pipeline.

Expected stored value:

- raw string from upstream metadata, for example `pt-BR`, `en`, `es-MX`, `zh-CN`

Behavior:

- search-imported books persist `language` automatically
- manually created books omit `language`
- existing books without `language` continue working unchanged

### User Settings

Restrict the app-language setting to the supported set:

- `pt-BR`
- `en`
- `es`
- `zh-CN`

This setting already exists conceptually, but this phase formalizes it as the source of truth for UI language and Dona Flora response language.

## Architecture

### 1. Book Language Pipeline

The external search layer becomes responsible for returning language metadata whenever upstream APIs expose it.

Affected flow:

1. external API response
2. normalized `BookSearchResult`
3. add-book search UI
4. create-book API payload
5. markdown persistence
6. read path back into `BookSchema`
7. browse/detail rendering

This ensures language is not a view-only embellishment; it becomes durable library metadata.

### 2. Language Presentation Utility

Create a single utility responsible for:

- receiving raw language codes from saved books or search results
- producing a short display label

This phase only requires a short display label. Centralizing this logic prevents duplicated ad hoc mapping in components and leaves room for richer labels in a future phase without changing component contracts.

### 3. UI Dictionary Layer

Introduce lightweight app dictionaries for the supported locales. The initial scope covers high-visibility UI copy used by the main authenticated product and new account surfaces.

Recommended structure:

- locale constants
- dictionary objects keyed by locale
- thin helper or provider for resolving translated strings from the user's saved app language

This should be app-level and settings-driven, not route-driven.

### 4. Dona Flora Language Alignment

The system prompt builder will receive the user's app language as an explicit directive. Dona Flora should answer in that language unless the conversation requires quoting or discussing source material in another language.

This is a behavioral instruction, not a separate chat mode.

## Component-Level Changes

### Search

Update search result rendering in the add-book flow so each result can show:

- cover
- title
- author
- year if present
- language tag if present

### Browse

Update:

- [book-card.tsx](/Users/mauro/projects/Dona Flora/src/components/book-card.tsx)
- [book-row.tsx](/Users/mauro/projects/Dona Flora/src/components/book-row.tsx)

to render a compact language badge in the same metadata cluster as status and rating.

### Detail

Update:

- [page.tsx](/Users/mauro/projects/Dona Flora/src/app/books/[slug]/page.tsx)

to include language as a persisted metadata field.

### Settings

Update the settings form so the language selector clearly means app language. Option labels should be localized and human-readable, while the persisted value remains one of the four supported locale codes.

## API And Persistence Contracts

### Search Result Contract

Extend `BookSearchResult` with:

- `language?: string`

### Book Creation Contract

Extend create-book payload handling to accept:

- `language?: string`

### Stored Markdown

Books imported from search may now contain:

```yaml
language: pt-BR
```

or any other upstream code.

## Error Handling

- Missing language from upstream is acceptable; the UI hides the tag.
- Unsupported or unfamiliar language codes are still stored and displayed in normalized short form.
- Existing books without language must continue rendering with no regressions.
- UI locale fallback is `pt-BR` if user settings are absent or invalid.
- Dona Flora prompt generation must also fall back safely to `pt-BR`.

## Testing Strategy

### Unit

- language display formatter for known and unknown codes
- schema acceptance of optional book `language`
- settings locale validation and fallback behavior
- prompt directive generation for response language

### Integration

- search route normalization includes language when upstream provides it
- create-book persists language into markdown
- list/read path returns language correctly
- settings updates propagate the chosen app language

### Component

- add-book search results render language tags
- browse card and row render language tags when present
- detail page metadata shows language
- translated UI surfaces render correct copy for `pt-BR`, `en`, `es`, and `zh-CN`

### Regression

- books without language still render correctly
- manual add-book flow still works without language
- chat still works when app language changes

## Rollout Notes

This feature should be implemented incrementally in this order:

1. extend data contracts and persistence for book language
2. show language tags in search and library surfaces
3. add app-level locale dictionaries
4. bind settings language to UI text resolution
5. pass app language into Dona Flora system prompt

This order keeps the user-visible catalog improvement available early while containing i18n risk.

## Risks

- If translation coverage is attempted too broadly in one pass, the product may become inconsistent. Initial implementation should prioritize core authenticated surfaces and account flows.
- If language formatting logic is duplicated across components, labels will drift. A single formatter utility is required.
- If search APIs disagree on language shape, normalization must remain permissive instead of overfitting to one provider.

## Accepted Design Decisions

- Use app-settings-driven i18n instead of locale-prefixed routing.
- Persist raw book language from upstream metadata.
- Do not add manual editing for book language in this phase.
- Support four UI languages only: `pt-BR`, `en`, `es`, `zh-CN`.
- Make Dona Flora answer in the selected app language.
