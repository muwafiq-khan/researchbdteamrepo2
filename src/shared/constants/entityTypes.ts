// src/shared/constants/entityTypes.ts

// This object defines every entity type that can be referenced in a notification.
// Example: "User X sent you a connection request" — the notification needs to know
// what kind of thing it's pointing at so the frontend can build the right link.
// Python equivalent: a class with class-level constants, or an Enum.
export const EntityType = {
  POST:               'post',               // a research post
  CONNECTION_REQUEST: 'connection_request', // someone wants to connect
  COLLAB_REQUEST:     'collab_request',     // someone wants to collaborate
  HELP_REQUEST:       'help_request',       // someone sent a help request
  FUNDING_POST:       'funding_post',       // a funding opportunity
  COMPETITION:        'competition',        // a competition
  PROBLEM:            'problem',            // a problem page
} as const
// 'as const' tells TypeScript: treat every value as a literal, not just "string".
// Without it, TypeScript sees 'post' as type string.
// With it, TypeScript sees 'post' as the exact literal type 'post'.
// Python equivalent: Final or Literal types in typing module.

// This extracts all the values ('post', 'connection_request', etc.) as a union type.
// Meaning: a variable of type EntityType can ONLY be one of these exact strings.
// Python equivalent: Literal['post', 'connection_request', 'collab_request', ...]
export type EntityType = typeof EntityType[keyof typeof EntityType]