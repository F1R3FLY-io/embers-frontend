/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Login from "@/pages/Login/Login";

// Login is the single receiver of the app's auth return-path contract:
// ProtectedRoute and the run inspector bounce here with the origin location
// as `state.from`, and a successful sign-in must land back there — falling
// back to the dashboard when no origin was carried, and refusing pathnames
// that are not app-internal (a protocol-relative "//host" must never become
// a navigation target).

const mockNavigate = jest.fn();
const mockSetKey = jest.fn();
let mockLocation: { state: unknown } = { state: null };

jest.mock("react-router-dom", () => ({
  useLocation: () => mockLocation,
  useNavigate: () => mockNavigate,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@/lib/providers/wallet/useApi", () => ({
  useWalletState: () => ({ ready: false, setKey: mockSetKey }),
}));

// The real WalletInput imports the SDK's crypto (z32, blakejs), which jsdom
// cannot host; Login only consumes its onChange, so the stub supplies
// exactly that.
jest.mock("@/lib/components/WalletInput", () => ({
  WalletInput: ({ onChange }: { onChange: (key?: unknown) => void }) => (
    <input
      placeholder="key"
      onChange={(e) => onChange(e.currentTarget.value || undefined)}
    />
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockLocation = { state: null };
});

async function signIn() {
  render(<Login />);
  fireEvent.click(screen.getByText("login.signInWithWallet"));
  fireEvent.change(screen.getByPlaceholderText("key"), {
    target: { value: "some-key" },
  });
  fireEvent.click(screen.getByText("login.signIn"));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));
}

describe("post-login navigation", () => {
  it("returns to the carried origin location", async () => {
    mockLocation = {
      state: { from: { hash: "", pathname: "/runs/run-42", search: "" } },
    };

    await signIn();

    expect(mockSetKey).toHaveBeenCalledWith("some-key");
    expect(mockNavigate).toHaveBeenCalledWith(
      { hash: "", pathname: "/runs/run-42", search: "" },
      { replace: true },
    );
  });

  it("falls back to the dashboard when no origin was carried", async () => {
    await signIn();

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
      replace: true,
    });
  });

  it("rejects a protocol-relative pathname and falls back", async () => {
    mockLocation = {
      state: { from: { hash: "", pathname: "//evil.example", search: "" } },
    };

    await signIn();

    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
      replace: true,
    });
  });
});
