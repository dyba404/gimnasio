import { createContext, useContext } from 'react'

export type SearchContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch debe usarse dentro de SearchProvider')
  }
  return context
}
