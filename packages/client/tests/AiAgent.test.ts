import type { AgentHeader, Log } from "../src/api-client";

import { AiAgent, PrivateKey } from "../src";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AiAgent", () => {
  it("should create agent with correct properties", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });
    const result = agent.createAgent({
      code: "console.log('Hello, World!');",
      name: "Test Agent",
      shard: "test",
    });

    await expect(result).resolves.toBeUndefined();
  });

  it("should deploy Agent", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });
    const result = agent.deployAgent("fake agent id", "fake version id");

    await expect(result).resolves.toBeUndefined();
  });

  it("should return agents list", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = await agent.getAgents();
    expect(result.agents).toBeDefined();
    expect(result.agents).toContainEqual(
      expect.objectContaining<AgentHeader>({
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

    const agentData = agent.getAgentVersion("fake agent id", "fake version id");
    await expect(agentData).resolves.toEqual(
      expect.objectContaining({
        code: expect.anything() as unknown,
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.anything() as unknown,
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

    const result = agent.saveAgentVersion("fake agent id", {
      code: "console.log('Updated Code');",
      name: "Updated Agent",
      shard: "test",
    });

    await expect(result).resolves.toBeUndefined();
  });

  it("should testDeployAgent agent successfully", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const deploymentResult = agent.testDeployAgent(
      "fake agent id",
      "fake version id",
      "fake test",
    );

    await expect(deploymentResult).resolves.toEqual(
      expect.objectContaining({
        error: expect.anything() as unknown,
        logs: expect.arrayOf<Log>({
          level: expect.any(String) as string,
          message: expect.any(String) as string,
        } as Log) as Log[] | undefined,
      }),
    );
  });

  it("should test wallet", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AiAgent({
      basePath: "http://localhost:3100",
      headers: {},
      privateKey,
    });

    const result = agent.testWallet();

    await expect(result).resolves.toEqual(
      expect.objectContaining({
        key: expect.any(String) as string,
      }),
    );
  });
});
