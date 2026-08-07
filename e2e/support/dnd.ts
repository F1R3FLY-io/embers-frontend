import type { Locator, Page } from "@playwright/test";

/**
 * Drags one element onto another using the HTML5 drag-and-drop protocol.
 *
 * Playwright's own `dragTo` moves the mouse, which drives pointer-based
 * dragging. The graph editor's palette does not use pointers: the sidebar item
 * is `draggable`, it writes three custom MIME entries onto `dataTransfer` in
 * `dragstart`, and the canvas reads them back in `drop`. A mouse drag never
 * produces those events, so it would silently do nothing -- and a test that
 * asserts "the node did not appear" would then pass for the wrong reason.
 *
 * The events are dispatched with ONE shared `DataTransfer`, because that is the
 * contract the application depends on: what `dragstart` writes is what `drop`
 * reads. Real coordinates are passed too, since the source computes a grab
 * offset from the pointer's position within itself and the canvas converts the
 * drop point into graph space.
 */
export async function dragAndDrop(
  page: Page,
  source: Locator,
  target: Locator,
  /**
   * Where in the target to drop, as a fraction of its size. Defaults to the
   * middle; distinct values are how two nodes end up in two places rather than
   * stacked on one another.
   */
  at: { x: number; y: number } = { x: 0.5, y: 0.5 },
): Promise<void> {
  const sourceBox = await source.boundingBox();
  const targetBox = await target.boundingBox();

  if (sourceBox === null || targetBox === null) {
    throw new Error("cannot drag: one of the elements has no layout box");
  }

  const sourceHandle = await source.elementHandle();
  const targetHandle = await target.elementHandle();

  await page.evaluate(
    ({ drop, from, grab, to }) => {
      const dataTransfer = new DataTransfer();

      const event = (name: string, x: number, y: number) =>
        new DragEvent(name, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          dataTransfer,
        });

      from.dispatchEvent(event("dragstart", grab.x, grab.y));
      // `dragover` must be delivered and default-prevented before a drop is
      // accepted, exactly as a real drag does it.
      to.dispatchEvent(event("dragover", drop.x, drop.y));
      to.dispatchEvent(event("drop", drop.x, drop.y));
      from.dispatchEvent(event("dragend", drop.x, drop.y));
    },
    {
      drop: {
        x: targetBox.x + targetBox.width * at.x,
        y: targetBox.y + targetBox.height * at.y,
      },
      from: sourceHandle,
      grab: {
        x: sourceBox.x + sourceBox.width / 2,
        y: sourceBox.y + sourceBox.height / 2,
      },
      to: targetHandle,
    },
  );

  await sourceHandle.dispose();
  await targetHandle.dispose();
}

/**
 * Draws an edge between two node handles.
 *
 * Unlike the palette, connecting IS a pointer gesture: the graph library
 * tracks pointer events on its handles and commits the connection on release.
 * So this uses the real mouse, in steps, because a single jump can land
 * outside the library's hit area and end the drag with nothing connected.
 */
export async function connectHandles(
  page: Page,
  from: Locator,
  to: Locator,
): Promise<void> {
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();

  if (fromBox === null || toBox === null) {
    throw new Error("cannot connect: one of the handles has no layout box");
  }

  await page.mouse.move(
    fromBox.x + fromBox.width / 2,
    fromBox.y + fromBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, {
    steps: 12,
  });
  await page.mouse.up();
}
