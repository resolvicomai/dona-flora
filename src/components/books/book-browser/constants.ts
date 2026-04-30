export const VIEW_VALUES = ['grid', 'list'] as const
export type ViewMode = (typeof VIEW_VALUES)[number]
