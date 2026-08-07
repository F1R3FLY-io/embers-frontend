/**
 * The portal target every dialog needs.
 *
 * `Modal.tsx` portals into `document.getElementById("modal-root")` and asserts
 * the element exists, so a jsdom suite that renders any dialog has to create it
 * first. `index.html` provides it in the running app; nothing provides it in a
 * test.
 *
 * Replacing the body's children rather than appending also clears whatever a
 * previous test left mounted, so a stray portal cannot be found by the next
 * test's query.
 */
export function installModalRoot(): HTMLElement {
  const modalRoot = document.createElement("div");
  modalRoot.id = "modal-root";
  document.body.replaceChildren(modalRoot);
  return modalRoot;
}
