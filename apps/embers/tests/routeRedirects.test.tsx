/**
 * @jest-environment jsdom
 */
import type { EmbersApiSdk } from "@f1r3fly-io/embers-client-sdk";

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import type { WalletStateContext } from "@/lib/providers/wallet/useApi";

import { ProtectedRoute } from "@/lib/components/ProtectedRoute";
import { WalletContext } from "@/lib/providers/wallet/useApi";
import Home from "@/pages/Home";

// Where the app sends someone who has not asked for a particular page, and what
// it remembers when it turns them away from one they did ask for.
//
// `App.tsx` hard-codes a BrowserRouter, so the route table is replicated here
// over MemoryRouter with the real Home and ProtectedRoute and stubbed
// destinations. The stubs carry test ids rather than copy, so this stays a test
// of routing rather than of wording. The return-path parsing that Login does
// with `state.from` is already pinned by loginNavigation.test.tsx; this suite
// covers only the handoff into it.

// `embers` is never dereferenced along these paths -- ProtectedRoute and Home
// read `ready` alone -- so a placeholder keeps the wallet SDK, and its
// import-time WASM, out of a routing test.
const readyWallet: WalletStateContext = {
  embers: {} as EmbersApiSdk,
  ready: true,
  setKey: () => {},
};

const signedOutWallet: WalletStateContext = {
  ready: false,
  setKey: () => {},
};

function LoginStub() {
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } } | null)
    ?.from;

  return (
    <div data-from={from?.pathname ?? ""} data-testid="login-page">
      login
    </div>
  );
}

function renderAt(path: string, wallet: WalletStateContext) {
  return render(
    <WalletContext.Provider value={wallet}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<Home />} path="/" />
          <Route element={<LoginStub />} path="/login" />
          <Route element={<ProtectedRoute />}>
            <Route
              element={<div data-testid="dashboard-page">dashboard</div>}
              path="/dashboard"
            />
            <Route
              element={<div data-testid="editor-page">editor</div>}
              path="/agent/edit"
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </WalletContext.Provider>,
  );
}

it("sends a signed-in wallet from the root to the dashboard", () => {
  renderAt("/", readyWallet);

  expect(screen.getByTestId("dashboard-page")).toBeTruthy();
  expect(screen.queryByTestId("login-page")).toBeNull();
});

it("sends a signed-out visitor from the root to sign in", () => {
  renderAt("/", signedOutWallet);

  expect(screen.getByTestId("login-page")).toBeTruthy();
  expect(screen.queryByTestId("dashboard-page")).toBeNull();
});

it("does not route a signed-out visitor through a protected page on the way", () => {
  // The inverted redirect happened to work only because /dashboard bounced the
  // visitor onward. Landing on login with no remembered origin is what
  // distinguishes "went to the root" from "was turned away from the dashboard".
  renderAt("/", signedOutWallet);

  expect(screen.getByTestId("login-page").getAttribute("data-from")).toBe("");
});

it("remembers the protected page a signed-out visitor asked for", () => {
  renderAt("/agent/edit", signedOutWallet);

  expect(screen.getByTestId("login-page").getAttribute("data-from")).toBe(
    "/agent/edit",
  );
});

it("lets a signed-in wallet reach a protected page directly", () => {
  renderAt("/agent/edit", readyWallet);

  expect(screen.getByTestId("editor-page")).toBeTruthy();
  expect(screen.queryByTestId("login-page")).toBeNull();
});
