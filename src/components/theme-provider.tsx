import { createContext, useContext, useEffect, useState } from "react"

type ThemeProviderProps = {

}
type ThemeProviderState = {
  setTheme: (theme: Th

 

const ThemeProviderContext 
export functio
  defaultTheme = "system",
 

  )
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
      {children}
        : "light"

      root.classList.add(systemTheme)
  const cont
    }

    root.classList.add(theme)
}


    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)

    },



    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}








