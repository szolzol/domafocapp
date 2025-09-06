import { createContext, useContext, useEffect, useState } from "react"

type ThemeProviderProps = {

}
type ThemeProviderState = {
  setTheme: (theme: Th

 

const ThemeProviderContext 
export functio
  defaultTheme = "system",
 

  )
  useEffect(() => 



        ? "dark"

      return

  }, [theme])
  const value = {
    setThe
      setTheme(theme)
  }
  return (
   


  const context = useContext(ThemeProviderContex































export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}