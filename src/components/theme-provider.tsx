import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

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






































