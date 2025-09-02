const fs = require("fs");
fs.mkdirSync("public/js", { recursive: true });
fs.cpSync(
  "node_modules/@f1r3fly-io/lightning-bug/resources/public/extensions",
  "public/extensions",
  { recursive: true },
);
fs.cpSync(
  "node_modules/@f1r3fly-io/lightning-bug/resources/public/js/tree-sitter.wasm",
  "public/js/tree-sitter.wasm",
);
