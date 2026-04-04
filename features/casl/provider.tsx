"use client"

import { createContext, useContext, useMemo } from "react"
import { createContextualCan } from "@casl/react"
import { defineAbilityFor } from "./ability"
import type { AppAbility, RawPermission } from "./permissions"

const AbilityContext = createContext<AppAbility>(null!)

export const Can = createContextualCan(AbilityContext.Consumer)

export function AbilityProvider({
  permissions,
  children,
}: {
  permissions: RawPermission[]
  children: React.ReactNode
}) {
  const ability = useMemo(() => defineAbilityFor(permissions), [permissions])

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  )
}

export function useAbility() {
  const ability = useContext(AbilityContext)
  if (!ability) {
    throw new Error("useAbility must be used within AbilityProvider")
  }
  return ability
}
