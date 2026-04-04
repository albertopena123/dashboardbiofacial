import { createMongoAbility } from "@casl/ability"
import type { Action, Subject, AppAbility, RawPermission } from "./permissions"

export function defineAbilityFor(permissions: RawPermission[]): AppAbility {
  return createMongoAbility<[Action, Subject]>(
    permissions.map((p) => ({
      action: p.action as Action,
      subject: p.subject as Subject,
    }))
  )
}
