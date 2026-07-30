/**
 * @jest-environment jsdom
 *
 * A DOM, because the modal reads `window.FIRESKY_URL` to decide whether it has a
 * profile page to link to. Nothing here reaches the query layer, so the client SDK's
 * WASM -- which fetches its binary at import time, and jsdom has no `fetch` -- is
 * never loaded.
 */
import { renderToStaticMarkup } from "react-dom/server";

import type { DeploySuccessData } from "@/pages/PublishAgentsTeam/SuccessModal/SuccessModal";

import { SuccessModal } from "@/pages/PublishAgentsTeam/SuccessModal/SuccessModal";

// Both of this modal's side buttons were dead. "Unpublish Agent" closed the modal and
// did nothing at all -- no unpublish existed anywhere in the backend -- so a user who
// pressed it believed the team had stopped answering mentions while it carried on
// answering them. "View on F1R3SKY" had nowhere to go, because the handle was never
// passed down.
//
// A control that does nothing is worse than a missing one: it reports success. So the
// rule these pin is that a button appears exactly when it has something to do.

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => () => undefined,
}));

jest.mock("@/lib/providers/modal/useModal", () => ({
  useModal: () => ({ close: () => undefined, open: () => undefined }),
}));

const render = (props: Partial<DeploySuccessData> = {}) =>
  renderToStaticMarkup(
    <SuccessModal agentName="RedTeam" data={[]} {...props} />,
  );

describe("publish success modal", () => {
  it("always offers the way back to the dashboard", () => {
    expect(render()).toContain("publish.backToDashboard");
  });

  it("offers unpublish when there is an unpublish to run", () => {
    expect(render({ onUnpublish: () => undefined })).toContain(
      "publish.unpublish",
    );
  });

  it("hides unpublish when there is nothing behind it", () => {
    // The dead-control rule. Rendering the button regardless is what made pressing
    // it read as success.
    expect(render()).not.toContain("publish.unpublish");
  });

  it("links to the published profile when the handle is known", () => {
    window.FIRESKY_URL = "http://localhost:19006";

    const markup = render({ handle: "redteam.test" });

    expect(markup).toContain("publish.view");
  });

  it("hides the profile link when there is no handle to build it from", () => {
    // The handle was never passed to this modal at all, so the link had no target
    // and the button did nothing.
    window.FIRESKY_URL = "http://localhost:19006";

    expect(render()).not.toContain("publish.view");
  });

  it("hides the profile link when the deployment has no f1r3sky to point at", () => {
    // Self-hosted stacks configure this; one that does not has no profile page, and
    // a button leading to `undefined/profile/...` is another dead control.
    window.FIRESKY_URL = "";

    expect(render({ handle: "redteam.test" })).not.toContain("publish.view");
  });
});
