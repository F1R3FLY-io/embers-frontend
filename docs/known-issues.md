# Embers Frontend — Known Issues

## 1. "Create Wallet" Button Is a Stub

**Location:** `apps/embers/src/pages/Login/Login.tsx:27`

Two buttons on the login page do nothing — the "Create Wallet" button on the initial screen (line 62) and the "Don't have F1R3SKY Wallet? Create one" link on the sign-in form (line 110). Both call the same empty `redirectToFiresky` callback:

```tsx
const redirectToFiresky = useCallback(() => {}, []);
```

This was intended to redirect users to F1R3Sky for wallet creation but was never implemented.

**Workaround:** Sign in using an existing private key. For local development against a shard, use the bootstrap wallet private key from the shard's genesis:

```
5f668a7ee96d944a4494cc947e4005e172d7ab3461ee5538f1f2a45a835e9657
```

Click "Sign In With Wallet", paste the key, and hit Sign In.

**Fix needed:** Either implement wallet creation in the frontend (key generation using `@noble/curves` is already a dependency) or wire up the redirect to F1R3Sky.

## 2. Settings Button Is a Stub

**Location:** `apps/embers/src/pages/Dashboard/Dashboard.tsx:102`

The settings icon button in the dashboard header has no `onClick` handler:

```tsx
<Button icon={<SettingsIcon />} type="gray" />
```

The `Button` component guards with `if (!disabled && onClick)`, so it silently does nothing when clicked.

**Fix needed:** Implement a settings page or panel and wire up the handler.

## 3. Documentation Button Is a Stub

**Location:** `apps/embers/src/pages/Dashboard/Dashboard.tsx:129-135`

The documentation button in the dashboard sidebar has no `onClick` handler:

```tsx
<Button
  className={styles["system-button"]}
  icon={<DocumentationIcon />}
  type="gray"
>
  {t("dashboard.documentation")}
</Button>
```

Same as Settings — no `onClick` means the button renders but does nothing.

**Fix needed:** Link to documentation (external URL or in-app help page).

## 4. Page Refresh Logs Out the User

**Location:** `apps/embers/src/lib/providers/wallet/WalletProvider.tsx`

The wallet private key is stored only in React context (in-memory). A page refresh destroys the React tree and loses the key, redirecting the user back to the login page. Other UI state (theme, active tab, accordion panels) is persisted to `localStorage`, but the wallet key is not.

**Fix needed:** Persist the wallet key to `sessionStorage` (cleared when the browser tab closes) so it survives page refreshes but isn't retained across sessions. Avoid `localStorage` for private keys as it persists indefinitely.

## 5. "Add Custom Component" in Graph Editor Is a Stub

**Location:** `apps/embers/src/lib/layouts/Graph/Sidebar.tsx:94-97`

The "Add Custom Component" link in the Agent Teams graph editor sidebar is a `<Text>` element with a plus icon but no click handler:

```tsx
<Text bold color="hover" type="normal">
  <i className={classNames("fa fa-plus", styles["plus-icon"])} />
  {t("graphEditor.addCustomComponent")}
</Text>
```

It renders as styled text that looks interactive but has no `onClick` and is not wrapped in a `<Button>` or `<a>` — clicking does nothing.

**Fix needed:** Implement custom component creation or at minimum wrap in a `<Button>` with a handler.

## 6. Graph Node Settings Icon Is a Stub

**Location:** `apps/embers/src/lib/components/GraphEditor/nodes/NodeTemplate/NodeTemplate.tsx:42`

Each node on the graph editor workbench renders a settings gear icon, but it has no click handler:

```tsx
<SettingsIcon className={styles["settings-icon"]} />
```

It's a static SVG with no `onClick`, no wrapping button. Clicking it does nothing.

**Fix needed:** Implement a node configuration panel (e.g. set parameters, rename, configure inputs/outputs) and wire up the click handler.

## 7. Sidebar Node Plus Icon Is a Stub

**Location:** `apps/embers/src/lib/components/GraphEditor/nodes/SidebarNode/NodeItem.tsx:44-51`

Each node type in the graph editor sidebar has a "+" icon next to it. The icon is a styled div with no click handler:

```tsx
<div className={classNames(styles["icon-container"], styles["icon-container-plus"])}>
  <PlusIcon />
</div>
```

No `onClick` — clicking does nothing. The only way to add a node to the workbench is by dragging it (which does work via `onDragStart`).

**Fix needed:** Add an `onClick` handler that places the node on the workbench (same effect as drag-and-drop, for accessibility and convenience).

## 8. Agent Team Deploy Fails — Graph Deserialization Error

**Location:** Backend `packages/embers/src/blockchain/agents_teams/models.rs` (Graph deserializer) and `packages/embers/src/domain/agents_teams/deploy.rs`

When deploying a saved agent team, the backend retrieves the team data from the blockchain and tries to parse the stored graph string back into a GraphL AST. The graph is stored on-chain as a Rholang string literal, which adds escape layers (`\"` becomes `\\\"` becomes `\\\\\\\"`, etc.). When read back, the GraphL parser fails to parse the heavily-escaped string, causing `failed to deserialize filed model`.

The error occurs in the `Graph` custom deserializer which calls `graphl_parser::parse_to_ast()` on the string retrieved from the tuplespace. The round-trip escaping (frontend GraphL → Rholang string → blockchain → Rholang string → GraphL parse) corrupts the data.

This affects both "Deploy" and "Edit" (clicking on a saved team) since both call the `get` endpoint which deserializes the graph.

**Fix needed:** Fixed in embers backend update #11 — added unescape step in Graph deserializer.

## 9. "View in F1R3SKY" Button Is a Stub

**Location:** `apps/embers/src/pages/PublishAgentsTeam/SuccessModal/SuccessModal.tsx:26-29`

The "View in F1R3SKY" button on the publish success modal closes the modal but doesn't navigate anywhere. The comment `//http ref?` confirms it was never implemented:

```tsx
const handleViewOnFiresky = useCallback(() => {
    close();
    //http ref?
}, [close]);
```

**Fix needed:** Navigate to the f1r3sky frontend profile page, e.g. `http://localhost:8100/profile/{handle}`.

## 10. "Unpublish Agent" Button Is a Stub

**Location:** `apps/embers/src/pages/PublishAgentsTeam/SuccessModal/SuccessModal.tsx:36-38`

The "Unpublish Agent" button just closes the modal:

```tsx
const handleUnpublish = useCallback(() => {
    close();
}, [close]);
```

**Fix needed:** Call the PDS to delete the AT Protocol account or remove the agent team record.
