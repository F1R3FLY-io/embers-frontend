/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigate = jest.fn();
const appendDeploy = jest.fn();
const update = jest.fn();
const reset = jest.fn();
const openModal = jest.fn();
const deployMutate = jest.fn();

let agentsTeam: Record<string, unknown> = {};

jest.mock("@/lib/queries", () => ({
  useDeployAgentsTeamMutation: () => ({ mutateAsync: deployMutate }),
}));

jest.mock("@/lib/providers/currentAgentsTeam/useCurrentAgentsTeam", () => ({
  useCurrentAgentsTeam: () => ({ agentsTeam, reset, update }),
}));

jest.mock("@/lib/providers/dock/useDock", () => ({
  useDock: () => ({ appendDeploy, appendLog: jest.fn() }),
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: jest.fn(), open: openModal }),
}));

jest.mock("@/lib/providers/loader/useCallbackWithLoader", () => ({
  useCallbackWithLoader: (fn: (...args: unknown[]) => Promise<void>) => fn,
}));

// Loader visibility is covered by loaderProvider.test.tsx; here it only has to
// exist, so the page is not testing the spinner a second time.
jest.mock("@/lib/providers/loader/useLoader", () => ({
  useLoader: () => ({ hide: jest.fn(), show: jest.fn() }),
}));

jest.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import DeployAgentsTeam from "@/pages/DeployAgentsTeam/DeployAgentsTeam";

// Deploying a team, and what the editor must remember afterwards.
//
// This is the path behind "a team cannot be re-deployed after an update". Two
// pieces of state decide whether the editor offers Deploy or Run next time:
// the registry key and uri recorded on success, and the `hasGraphChanges` flag
// that is cleared by it. Neither was tested, and both are set here and nowhere
// else.

beforeEach(() => {
  jest.clearAllMocks();
  agentsTeam = {
    description: "A research desk",
    hasGraphChanges: true,
    id: "team-1",
    name: "Research Desk",
    version: "version-1",
  };
  deployMutate.mockResolvedValue({
    waitForFinalization: Promise.resolve(),
  });
});

async function submit() {
  const user = userEvent.setup();
  const view = render(<DeployAgentsTeam />);
  // The page renders a back control whose label also matches "deploy"
  // (deploy.back), so the submit button is addressed by its exact key.
  await user.click(screen.getByRole("button", { name: "deploy.deploy" }));
  return view;
}

describe("a successful deploy", () => {
  it("deploys the team version currently open", async () => {
    await submit();

    // Asserted on the first argument rather than the whole call: mutateAsync
    // also receives an options slot, which is not part of this contract.
    const [variables] = deployMutate.mock.calls[0] as [unknown];
    expect(variables).toMatchObject({
      agentsTeamId: "team-1",
      registryVersion: 1n,
      version: "version-1",
    });
  });

  it("mints a fresh registry key for every deployment", async () => {
    const user = userEvent.setup();
    render(<DeployAgentsTeam />);
    const deploy = screen.getByRole("button", { name: "deploy.deploy" });

    // Deployed twice from the same page rather than through two renders, so
    // the comparison is between two deployments and not two mountings.
    await user.click(deploy);
    await user.click(deploy);

    const keys = deployMutate.mock.calls.map(
      ([args]) =>
        (args as { registryKey: { toHex: () => string } }).registryKey,
    );

    // Each deployment gets its own registry identity, which is what gives it a
    // distinct uri. Reusing a key would overwrite the previous deployment's
    // registry entry instead of creating a new one.
    expect(keys).toHaveLength(2);
    expect(keys[0].toHex()).not.toBe(keys[1].toHex());
  });

  it("records the key and the uri it produces", async () => {
    await submit();

    const recorded = update.mock.calls
      .map(([value]) => value as Record<string, unknown>)
      .find((value) => "lastDeployKey" in value);

    // These two are what tell the editor a team HAS been deployed. Without
    // them it keeps offering Deploy and never offers Run.
    expect(recorded).toBeDefined();
    expect(recorded?.uri).toBeDefined();
  });

  it("clears the pending-changes flag", async () => {
    await submit();

    // `hasGraphChanges` is what makes the editor offer Deploy instead of Run.
    // Leaving it set after a successful deploy is exactly the state in which a
    // team looks permanently un-deployed.
    expect(update).toHaveBeenCalledWith({ hasGraphChanges: false });
  });

  it("waits for finalization before recording anything", async () => {
    let finalized = false;
    deployMutate.mockResolvedValue({
      waitForFinalization: Promise.resolve().then(() => {
        finalized = true;
      }),
    });

    await submit();

    // Recording a uri for a deploy that has not finalized would point the
    // editor at a registry entry that may never exist.
    expect(finalized).toBe(true);
    expect(appendDeploy).toHaveBeenCalledWith(true);
  });

  it("confirms the deployment to the user", async () => {
    await submit();

    expect(openModal).toHaveBeenCalledTimes(1);
    const [, options] = openModal.mock.calls[0] as [unknown, unknown];
    expect(options).toMatchObject({
      ariaLabel: "Success deploy",
      // Not dismissible by accident: the dialog carries the only copy of the
      // deployment details the user has just been given.
      closeOnBlur: false,
      closeOnEsc: false,
    });
  });
});

describe("a failed deploy", () => {
  beforeEach(() => {
    deployMutate.mockRejectedValue(new Error("no agent named Refine"));
  });

  it("records the failure in the deploy history", async () => {
    await submit();

    expect(appendDeploy).toHaveBeenCalledWith(false);
  });

  it("does not record a key or uri", async () => {
    await submit();

    // Recording them for a failed deploy is what would make a broken team look
    // deployed, and hide the Deploy action behind Run.
    const recorded = update.mock.calls
      .map(([value]) => value as Record<string, unknown>)
      .find((value) => "lastDeployKey" in value);
    expect(recorded).toBeUndefined();
  });

  it("leaves the pending-changes flag alone", async () => {
    await submit();

    expect(update).not.toHaveBeenCalledWith({ hasGraphChanges: false });
  });

  it("shows the reason rather than a generic failure", async () => {
    await submit();

    // The backend names the missing agent; passing that through is what makes
    // a failed deploy actionable instead of mysterious.
    expect(openModal).toHaveBeenCalledTimes(1);
    const [, options] = openModal.mock.calls[0] as [unknown, unknown];
    expect(options).toMatchObject({ ariaLabel: "Warning" });
  });
});
