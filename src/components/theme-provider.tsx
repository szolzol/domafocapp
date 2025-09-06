import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

  defaultTheme?: Theme
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
 

const initialState: ThemePr
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,

  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
   


  const context = useContext(ThemeProviderContex































export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}