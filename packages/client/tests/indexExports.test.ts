import {
  DEFAULT_MAX_WAIT_FOR_FINALISATION,
  EmbersEvents,
  NodeType,
  WalletEvent,
} from "@";

describe("package root exports", () => {
  it("exposes the events client and its contract types", () => {
    expect(EmbersEvents).toBeDefined();
    expect(typeof EmbersEvents).toBe("function");
  });

  it("exposes the finalization budget matching the backend deploy timeout", () => {
    expect(DEFAULT_MAX_WAIT_FOR_FINALISATION).toBe(120_000);
  });

  it("parses a finalization event with the exported schemas", () => {
    const event = WalletEvent.parse({
      cost: "1287",
      deploy_id: "3045022100ab",
      errored: false,
      node_type: "Observer",
      type: "Finalized",
    });
    expect(event.node_type).toBe(NodeType.parse("Observer"));
    expect(event.cost).toBe(1287n);
  });
});
