// Vite HMR subscription, isolated in its own module: `import.meta` is a
// syntax error under CommonJS test transforms, so any module containing it
// becomes untestable along with everything that imports it. Pages subscribe
// through this wrapper (mapped to a no-op in jest) instead of touching
// `import.meta` themselves.
export function onViteBeforeUpdate(handler: () => void): () => void {
  if (import.meta.hot) {
    const hmr = import.meta.hot;
    hmr.on("vite:beforeUpdate", handler);
    return () => {
      hmr.off("vite:beforeUpdate", handler);
    };
  }
  return () => undefined;
}
