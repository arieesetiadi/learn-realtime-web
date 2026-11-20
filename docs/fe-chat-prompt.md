You are working in an existing, empty Next.js project. Do not run create-next-app, do not scaffold a new project, and do not restructure the existing app. Inspect package.json, tsconfig.json, and whichever of app/ or src/app/ already exists, then build inside that structure. Follow the existing package manager (npm/pnpm/yarn based on the lockfile).

# Goal
Build a clean, production-quality 1:1 realtime chat frontend against an existing Laravel API. This is a learning project: prefer simple, readable code over clever abstractions. Add concise comments explaining non-obvious decisions, especially around auth, cookies, pagination, caching, and realtime. Do not narrate obvious code.

Endpoints available:
- Auth, conversations, messages, and broadcasting auth already exist.
- Realtime uses Laravel Reverb.
- The backend has no user search, no unread/read-state, and no conversation "show" endpoint. Do not invent them.

# Required stack
Use these libraries; do not substitute without a concrete reason:

- Next.js App Router + TypeScript strict
- Tailwind CSS + shadcn/ui defaults, forced dark theme
- @tanstack/react-query v5
- react-hook-form + zod + @hookform/resolvers
- laravel-echo + pusher-js
- date-fns
- @t3-oss/env-nextjs
- server-only
- sonner
- lucide-react
- Dev/testing: vitest, jsdom, @vitejs/plugin-react, vite-tsconfig-paths, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw
- Formatting: prettier + prettier-plugin-tailwindcss (add only if not already present)

Do NOT add:
Axios, SWR, Redux, Zustand, NextAuth/Auth.js, socket.io-client, GraphQL, tRPC, Yup, Jest, Cypress, Playwright, Sentry, next-themes, @tanstack/react-virtual, OpenAPI tooling.

# Non-negotiable architecture
Use a Next.js BFF with an httpOnly cookie. The Laravel token must never be readable by browser JavaScript.

Flow:
1. Browser calls Next route handlers under app/api/.
2. Route handlers read the token from an httpOnly cookie and call Laravel with `Authorization: Bearer <token>`.
3. Auth endpoints set/clear that cookie.
4. Realtime authorization also goes through a Next route handler that forwards Echo's auth request to Laravel.
5. Server Components may call Laravel directly using the same cookie, but never send the token to the client.

Cookie rules:
- Name: `laravel_api_token`
- `httpOnly: true`
- `sameSite: 'lax'`
- `secure: process.env.NODE_ENV === 'production'`
- `path: '/'`
- `maxAge: 60 * 60 * 24 * 30` (matches the backend's 30-day token)
- Do not expose the token in JSON responses, localStorage, sessionStorage, or client logs.
- On logout, clear the cookie even if the Laravel logout call fails.

Use Node runtime for BFF routes. Do not use the Edge runtime.

Do not add middleware.ts. Protect app pages in the server layout by validating the session with Laravel; middleware is easy to misconfigure and adds edge-runtime complexity.

# Environment
Create `.env.local.example` with comments. Never commit `.env.local`.

```env
# Server-only. If Next.js runs in Docker, use http://app:8181 instead.
LARAVEL_API_URL=http://localhost:8181

# Browser-visible Reverb settings. Copy the app key from Laravel's REVERB_APP_KEY.
# Never expose REVERB_APP_SECRET to the frontend.
NEXT_PUBLIC_REVERB_APP_KEY=your-reverb-app-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
Validate env with @t3-oss/env-nextjs. Keep LARAVEL_API_URL server-only.
Assumed local ports:
- Laravel API: http://localhost:8181
- Reverb: ws://localhost:8080
- Next.js: http://localhost:3000
Feature-based structure
Adapt to the existing app/ vs src/app/ choice. Do not create both.
app/
  layout.tsx                     # root layout, dark class, providers, Toaster
  page.tsx                       # redirect to /conversations
  globals.css                    # shadcn defaults + color-scheme: dark
  error.tsx                      # client error boundary
  not-found.tsx
  (auth)/
    layout.tsx                   # centered auth layout
    login/page.tsx               # server component + client form
    register/page.tsx
  (app)/
    layout.tsx                   # server-side auth guard + SessionProvider + AppShell
    conversations/
      page.tsx                   # conversation list / empty state
      [conversationId]/page.tsx  # chat thread
  api/
    auth/login/route.ts
    auth/register/route.ts
    auth/logout/route.ts
    realtime/auth/route.ts
    conversations/route.ts
    conversations/[conversationId]/messages/route.ts
features/
  auth/
    components/login-form.tsx
    components/register-form.tsx
    session-provider.tsx
    schemas.ts
    types.ts
  conversations/
    api.ts
    queries.ts
    schemas.ts
    types.ts
    components/conversation-list.tsx
    components/conversation-item.tsx
    components/new-conversation-dialog.tsx
  messages/
    api.ts
    cache.ts                    # upsert/dedupe helpers
    queries.ts
    schemas.ts
    types.ts
    components/message-list.tsx
    components/message-bubble.tsx
    components/message-composer.tsx
  realtime/
    echo.ts
    use-conversation-channel.ts
    components/connection-status.tsx
lib/
  api/
    client.ts                   # browser fetch wrapper to the BFF
    laravel.ts                  # server-only Laravel fetch wrapper
    errors.ts                   # ApiError + parsing
    types.ts                    # CursorPage<T>, error payloads
  auth/
    cookies.ts                  # server-only cookie helpers
    session.ts                  # server-only getCurrentUser()
  env.ts
  utils.ts                      # shadcn cn()
providers/
  query-provider.tsx
components/ui/                  # shadcn-generated only
API contracts
Laravel API base: LARAVEL_API_URL + /api/v1.
Auth:
POST /api/auth/login
Request: { email: string, password: string }
Success: 200 { data: { user: { id, name, email } } }
Errors: 422 validation_failed with errors.email; 429
POST /api/auth/register
Request: { name: string, email: string, password: string }
Success: 201 { data: { user: { id, name, email } } }
Errors: 422 validation_failed
POST /api/auth/logout
Success: 204, cookie cleared
Conversations:
GET /api/conversations?cursor=<opaque>
Success: 200 {
  data: Array<{
    id: number,
    other_user: { id, name, email },
    last_message: Message | null,
    created_at: string,
    updated_at: string
  }>,
  links: { first, last, prev, next },
  meta: { next_cursor: string | null, prev_cursor: string | null, ... }
}
POST /api/conversations
Request: { recipient_id: number }
Success: 200 or 201 { data: Conversation }
Errors: 422 errors.recipient_id
Messages:
GET /api/conversations/:conversationId/messages?cursor=<opaque>
Success: 200 {
  data: Array<{
    id: number,
    conversation_id: number,
    body: string,
    sender: { id, name, email },
    created_at: string
  }>,
  links: { ... },
  meta: { next_cursor: string | null, prev_cursor: string | null, ... }
}
Messages are returned NEWEST FIRST. Reverse them for normal chat display.
POST /api/conversations/:conversationId/messages
Request: { body: string }  // max 5000
Success: 201 { data: Message }
Errors: 422 errors.body; 403; 404; 429
Realtime auth:
POST /api/realtime/auth
Request: { socket_id: string, channel_name: string }
Success: 200 { auth: string }
Errors: 401/403
Realtime channel: private-conversation.{conversationId}
Event: .MessageSent
Payload: the Message object above, not wrapped in data.
Error contract everywhere:
{
  "message": "string",
  "code": "string",
  "request_id": "string | null",
  "errors": { "field": ["message"] }
}
429 responses include a Retry-After header.
BFF implementation rules
Create a server-only laravelFetch<T>() helper that:
- Prefixes LARAVEL_API_URL, strips a trailing slash from the base.
- Sends Accept: application/json.
- Sends Content-Type: application/json only when there is a body.
- Sends Authorization: Bearer <token> when a token is provided.
- Uses cache: 'no-store' and forwards an optional AbortSignal.
- Parses the API error contract into ApiError.
- Converts network failures into a generic 502 network_error.
- Never logs tokens.
BFF route handlers must:
- Validate request bodies with Zod before calling Laravel.
- Return 422 with the same error contract for invalid input.
- Return 401 { message: "Unauthenticated.", code: "unauthenticated", request_id: null } when the cookie is missing.
- Pass through Laravel's status code, JSON body, and Retry-After header on 429.
- Set export const dynamic = 'force-dynamic'.
- Check Origin on mutating requests: if an Origin header exists and does not match the request origin, return 403.
- Forward request.signal to Laravel where possible.
Login/register BFF routes:
- Call Laravel /api/v1/login or /api/v1/register.
- Read data.token and set the cookie.
- Return only { data: { user } }; strip the token from the response.
Do not create a /api/auth/me route. The server layout validates the session by calling Laravel directly through getCurrentUser().
Logout BFF route:
- Read the cookie.
- Call Laravel logout if a token exists.
- Always clear the cookie.
- Return 204.
Realtime auth BFF route:
- Read the cookie.
- Forward { socket_id, channel_name } to Laravel /api/broadcasting/auth.
- Return Laravel's JSON unchanged.
Session and auth flow
lib/auth/session.ts:
- getSessionToken() reads the cookie.
- getCurrentUser() returns User | null.
- No token: return null.
- Laravel 401: return null.
- Other errors: throw so the app error boundary handles them.
- Server-only: add import 'server-only'.
app/(app)/layout.tsx:
- Server component.
- Call getCurrentUser().
- If null, redirect('/login').
- Wrap children in <SessionProvider user={user}> and <AppShell>.
app/(auth)/login/page.tsx:
- Server component.
- Call getCurrentUser().
- If a valid user exists, redirect to /conversations.
- Otherwise render <LoginForm />.
- Do not redirect based only on cookie presence; a stale invalid cookie would cause a redirect loop.
Auth forms:
- Use react-hook-form + zodResolver + shadcn Form.
- Login: email + password.
- Register: name + email + password + confirm password.
- Mirror the backend password rule client-side: minimum 12 chars, lower, upper, number, symbol. The backend remains authoritative.
- On 422, map errors to form fields.
- Important: Laravel returns 422 for invalid login credentials, not 401. Show the email error.
- On success, router.replace('/conversations').
- Show loading states and disable the submit button while pending.
- On 429/500, show a sonner toast.
Logout:
- Call /api/auth/logout.
- Clear the TanStack Query cache.
- Redirect to /login.
apiFetch in lib/api/client.ts:
- Calls same-origin BFF routes.
- Includes cookies (same-origin default is fine, but be explicit).
- Parses the error contract into ApiError with status, code, message, requestId, errors, retryAfter.
- On 401, redirect to /login by default.
- Allow { redirectOn401: false } for auth forms.
- Never attach an Authorization header.
- Never read a token from storage.
UI requirements
Use shadcn/ui defaults. Do not customize design tokens, colors, radii, fonts, or animations. Do not use shadcn blocks. Compose primitives.
Initialize shadcn if needed with its defaults (New York style, neutral base color, CSS variables). Add only:
button, input, textarea, form, label, card, dialog, avatar, badge, skeleton, sonner.
Force dark:
- Add className="dark" to <html>.
- Add color-scheme: dark in globals.css.
- No theme toggle and no next-themes.
- <Toaster theme="dark" />.
Layout:
- Desktop: persistent conversation sidebar (about 320px) + main chat pane.
- Mobile: sidebar hidden; /conversations shows the list full width; /conversations/[id] shows the chat with a back link.
- Do not add a mobile Sheet or drawer; the routes already separate list and chat.
- Use default shadcn border/background/muted tokens.
Pages and components:
- Login/register: centered Card, Form, Input, Button, links between pages.
- App shell: app name, logout button, new-chat button.
- Conversation list: avatar with initials, other user's name, last message snippet, relative time, active state.
- Empty state when no conversations.
- New conversation dialog: a single "Recipient user ID" field.
- This is temporary because the backend has no user search.
- Add helper text and a code comment explaining the TODO.
- On success, close the dialog, invalidate conversations, and navigate to the conversation.
- Chat page:
- Header with other user's name.
- Message list, aligned by sender id.
- Own messages use default primary styles; others use muted styles.
- Relative timestamp with full timestamp in a title attribute.
- "Load older messages" button at the top when hasNextPage. Do not add auto-load or virtualization.
- Composer: textarea + send button; Enter sends, Shift+Enter adds a newline.
- Disable the composer while a message is sending.
- Clear the composer only after success.
- Auto-scroll to the newest message on initial load and after sending; do not force-scroll when loading older messages.
- Empty state when there are no messages.
- Connection status: a small badge showing connected/reconnecting/disconnected.
- Loading: skeleton components.
- Errors: inline error state with a retry button; use sonner for transient errors.
- Accessibility: labels, aria-invalid, aria-describedby, focus the composer after send, aria-live for incoming messages.
- Render message bodies as plain text. Never use dangerouslySetInnerHTML.
Conversation header fallback:
- There is no conversation show endpoint.
- Resolve the conversation from the conversations list query cache.
- If it is not in the loaded pages, show a generic "Conversation" header and a back link. Do not chase pagination just to find it.
Realtime rules
features/realtime/echo.ts:
- Lazily create a single browser-only Echo instance.
- Set the Pusher global before creating Echo.
- Use broadcaster: 'reverb'.
- Use NEXT_PUBLIC_REVERB_* env values.
- forceTLS is true only when the scheme is https.
- Use a custom authorizer that calls /api/realtime/auth with credentials: 'include', sending { socket_id, channel_name }.
- This keeps the Laravel token in the httpOnly cookie.
- Never import this module into server components.
useConversationChannel(conversationId):
- Client-only.
- Subscribe to private-conversation.{id} and listen for .MessageSent.
- On event:
- If the messages query for this conversation exists, upsert the message into the cache.
- Deduplicate by message id.
- Invalidate the conversations list so the last message and ordering update.
- On reconnect:
- Invalidate messages and conversations to recover missed events.
- On cleanup, leave only this channel. Do not disconnect the global Echo instance.
- Expose connection state for the status badge.
Do not implement optimistic temporary messages. The Reverb broadcast usually arrives before the HTTP response, and both the mutation response and the broadcast are deduplicated by real id. Disabling the composer while sending is enough.
Data fetching rules
Create query key factories per feature.
Conversations:
- useInfiniteQuery.
- initialPageParam: undefined.
- getNextPageParam: (last) => last.meta.next_cursor ?? undefined.
- Pass the cursor to the BFF.
- "Load more" button at the bottom for additional pages.
Messages:
- useInfiniteQuery.
- getNextPageParam from meta.next_cursor.
- Flatten pages and reverse for oldest-to-newest display.
- "Load older" button at the top.
Query defaults:
- staleTime: 30_000.
- refetchOnWindowFocus: false.
- Retry only network/5xx errors, at most 2 times. Do not retry 4xx.
- refetchOnReconnect: true.
- Create QueryClient inside useState(() => new QueryClient(...)) in the provider.
- React Query Devtools only in development.
Mutations:
- useSendMessage:
- Validate body before sending.
- On success, upsert the returned message into the cache and invalidate conversations.
- On error, show a toast; keep the composer text.
- useCreateConversation:
- Validate recipient_id.
- On success, invalidate conversations and navigate.
- Do not add a generic mutation wrapper or repository layer.
Pass TanStack Query's AbortSignal into fetch calls.
Testing
Set up Vitest with jsdom, path aliases, and a test setup file. Use MSW node for network mocking.
Write only these focused tests:
1. errors.test.ts — maps the API error contract, including 429 Retry-After.
2. login-form.test.tsx — validation, successful submit redirects, 422 maps to the email field.
3. message-composer.test.tsx — prevents empty submits, disables while pending, keeps text on failure.
4. use-conversation-channel.test.ts — MessageSent upserts by id, deduplicates, and invalidates conversations.
Mock next/navigation where needed. Polyfill scrollIntoView in the test setup if required. Do not chase coverage and do not test shadcn internals.
Add scripts:
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "format": "prettier --write ."
}
Keep the existing lint script; do not replace the project's lint setup.
Backend limitations to respect
- No user search: the new-chat dialog accepts a recipient ID temporarily.
- No unread/read-state: do not show unread badges, "seen", or "delivered".
- No conversation show endpoint: derive metadata from the list, with a generic fallback.
- Messages are newest-first.
- Invalid login returns 422, not 401.
- No refresh token: on 401, clear the session and redirect to login.
- Broadcasts are best-effort: the message still saves if Reverb is down. Refetch on reconnect.
- Conversation cursor pagination is ordered by updated_at only; the frontend should simply follow the returned cursor and not attempt to fix it.
Simplicity rules
- No generic repository, DTO mapping layer, base service class, or mega-hook.
- No barrel files unless already used.
- Keep components small but do not split for the sake of splitting.
- No premature abstractions.
- No unused code or speculative endpoints.
- No comments that restate the code. Comment the "why".
- No any, @ts-ignore, or disabled lint rules to make things pass.
- No console.log in committed code.
- Do not log tokens, cookies, or message bodies.
- Do not add features beyond this scope.
- Do not modify the Laravel backend.
Acceptance criteria
- typecheck, lint, and test pass.
- Register, login, logout, and protected-page redirects work.
- Conversation list loads, paginates, and can create/open a conversation.
- Messages load, paginate older pages, and send.
- A second browser/incognito session receives new messages live without refresh.
- Message deduplication works when the broadcast and HTTP response both arrive.
- Reverb reconnect triggers a refetch.
- The Laravel token is visible only as an httpOnly cookie; it is not in localStorage, sessionStorage, or client JS.
- The UI uses default shadcn components, is dark by default, and is responsive.
- No backend endpoints were invented.
- No secrets are placed in NEXT_PUBLIC_* variables.
Delivery
When finished:
1. List every file created or modified and one sentence about its purpose.
2. Give the exact install/run commands.
3. Describe the manual two-browser realtime test.
4. Call out any place where the backend limitation forced a temporary UI decision.