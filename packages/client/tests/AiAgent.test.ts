import type { AgentHeader } from "../src/api-client";

import { AiAgent, PrivateKey } from "../src";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AiAgent", () => {
  it("should initialize correctly", () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });
    expect(agent).toBeDefined();
  });

  it("should create agent with correct properties", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.createAgent({
      code: "console.log('Hello, World!');",
      name: "Test Agent",
      shard: "test",
    });

    expect(result).toBeUndefined();
  });

  it("should deploy Agent", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.deployAgent("fake agent id", "fake version id");

    expect(result).toBeUndefined();
  });

  it("should return agents list", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.getAgents();
    expect(result.agents).toContainEqual(
      expect.objectContaining({
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.any(String) as string,
        version: expect.any(String) as string,
      }),
    );
  });

  it("should return agent's versions", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.getAgentVersions("fake agent id");
    expect(result.agents).toContainEqual(
      expect.objectContaining<AgentHeader>({
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.any(String) as string,
        version: expect.any(String) as string,
      }),
    );
  });

  it("should return agent by version", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const agentData = await agent.getAgentVersion(
      "fake agent id",
      "fake version id",
    );
    expect(agentData).toEqual(
      expect.objectContaining<AgentHeader>({
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.any(String) as string,
        version: expect.any(String) as string,
      }),
    );
  });

  it("should update agent version", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.saveAgentVersion("fake agent id", {
      code: "console.log('Updated Code');",
      name: "Updated Agent",
      shard: "test",
    });

    expect(result).toBeUndefined();
  });
});
