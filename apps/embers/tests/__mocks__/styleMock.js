// Returns each requested class as its own source name, so `styles.open` becomes
// "open" in rendered markup. An empty object would make every CSS-module class
// `undefined` and `classNames` would drop it -- leaving the classes that carry
// behaviour (an open accordion, a panel opting out of the height cap) invisible
// to assertions.
export default new Proxy(
  {},
  {
    get: (_target, property) =>
      typeof property === "string" ? property : undefined,
  },
);
