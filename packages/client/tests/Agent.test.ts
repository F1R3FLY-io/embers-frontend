import { Agent, NO_ID, NO_VERSION } from "../src/entities/Agent";

describe("Agent class", () => {
  it("should containt placeholders if empty", () => {
    const agent = Agent.empty();

    expect(agent.id).toBe(NO_ID);
    expect(agent.version).toBe(NO_VERSION);
    expect(agent.is_empty()).toBeTruthy();
  });

  it("should update agent version", () => {
    const agent = new Agent("fake agent id");

    expect(agent.id).toBe("fake agent id");
    expect(agent.version).toBe(NO_VERSION);

    const newAgent = agent.newWithVersion("fake version");
    expect(newAgent.id).toBe("fake agent id");
    expect(newAgent.version).toBe("fake version");
  });
});
