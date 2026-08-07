import type { QueryClient } from "@tanstack/react-query";
import type { RenderResult } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { MemoryRouter } from "react-router-dom";

import type { WalletStateContext } from "@/lib/providers/wallet/useApi";

import { DockProvider } from "@/lib/providers/dock/DockProvider";
import { LoaderProvider } from "@/lib/providers/loader/LoaderProvider";
import { ModalProvider } from "@/lib/providers/modal/ModalProvider";
import { ThemeProvider } from "@/lib/providers/theme/ThemeProvider";

import { installModalRoot } from "./modalRoot";
import { makeTestQueryClient } from "./queryClient";
import { TestWalletProvider } from "./wallet";

/**
 * Renders a component under the providers it expects, in the order the app
 * nests them.
 *
 * The order is copied from `App.tsx` on purpose. Provider nesting is not
 * incidental -- the modal layer sits inside the router so a dialog can
 * navigate, and the loader sits outside the modal layer, which is what makes
 * the spinner render above dialogs. A test that nests them differently can pass
 * while the app is broken, so this composes them the one way the app does.
 *
 * Providers are opt-in beyond the four most components need, because each one
 * costs setup and obscures which context a failure came from. Ask for the
 * editor providers only when rendering the editor.
 */
export interface ProviderOptions {
  /** The dock (logs and deploy history), used by the editor layouts. */
  dock?: boolean;
  /** How many dock entries to keep; exposed so the clamp can be tested. */
  dockMaxEntries?: number;
  /** Router entries; the first is the starting location. */
  initialEntries?: string[];
  /** Reuse a client across renders, e.g. to seed the cache before rendering. */
  queryClient?: QueryClient;
  /** React Flow context, required by anything rendering the graph canvas. */
  reactFlow?: boolean;
  /** Theme context, for components reading theme tokens or the switch. */
  theme?: boolean;
  /** Supply a signed-in or signed-out wallet; omitted means no wallet context. */
  wallet?: WalletStateContext;
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions = {},
): RenderWithProvidersResult {
  const {
    dock = false,
    dockMaxEntries,
    initialEntries = ["/"],
    queryClient = makeTestQueryClient(),
    reactFlow = false,
    theme = false,
    wallet,
  } = options;

  // Dialogs portal into #modal-root, and it must exist before the first render
  // rather than when a dialog opens.
  installModalRoot();

  const wrap = (children: ReactNode) => {
    let tree = <ModalProvider>{children}</ModalProvider>;
    tree = <MemoryRouter initialEntries={initialEntries}>{tree}</MemoryRouter>;
    if (reactFlow) {
      tree = <ReactFlowProvider>{tree}</ReactFlowProvider>;
    }
    if (dock) {
      tree = <DockProvider maxEntries={dockMaxEntries}>{tree}</DockProvider>;
    }
    tree = <LoaderProvider>{tree}</LoaderProvider>;
    if (theme) {
      tree = <ThemeProvider>{tree}</ThemeProvider>;
    }
    if (wallet !== undefined) {
      tree = <TestWalletProvider wallet={wallet}>{tree}</TestWalletProvider>;
    }
    return (
      <QueryClientProvider client={queryClient}>{tree}</QueryClientProvider>
    );
  };

  const result = render(ui, {
    wrapper: ({ children }) => wrap(children),
  });

  return { ...result, queryClient };
}
