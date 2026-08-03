// Jest stands in for Vite here, so there is no HMR channel to subscribe to.
export function onViteBeforeUpdate(_handler: () => void): () => void {
  return () => undefined;
}
