import type { AgentHeader, DeploySignedTestResp } from "../src";

import { AgentsApiSdk, LogLevel, PrivateKey } from "../src";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AgentsApiSdk", () => {
  it("should create agent with correct properties", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      privateKey,
    });

    const result = agent.createAgent({
      code: "console.log('Hello, World!');",
      name: "Test Agent",
      shard: "test",
    });

    await expect(result).resolves.toEqual({
      id: "fake id",
      version: "fake version",
    });
  });

  it("should deploy Agent", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      privateKey,
    });
    const result = agent.deployAgent("fake agent id", "fake version id");

    await expect(result).resolves.toBeUndefined();
  });

  it("should return agents list", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      headers: {
        "x-test-response": "all-props",
      },
      privateKey,
    });

    const result = await agent.getAgents();
    expect(result.agents).toBeDefined();
    expect(result.agents).toEqual(
      expect.arrayOf<AgentHeader>({
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.any(String) as string,
        version: expect.any(String) as string,
      }),
    );
  });

  it("should return agent's versions", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      headers: {
        "x-test-response": "all-props",
      },
      privateKey,
    });

    const result = await agent.getAgentVersions("fake agent id");
    expect(result.agents).toEqual(
      expect.arrayOf<AgentHeader>({
        id: expect.any(String) as string,
        name: expect.any(String) as string,
        shard: expect.any(String) as string,
        version: expect.any(String) as string,
      }),
    );
  });

  it("should return agent by version", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
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

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      privateKey,
    });

    const result = agent.saveAgentVersion("fake agent id", {
      code: "console.log('Updated Code');",
      name: "Updated Agent",
      shard: "test",
    });

    await expect(result).resolves.toEqual({
      version: "fake version",
    });
  });

  it("should testDeployAgent agent with error", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      privateKey,
    });

    const testnetPrivateKey = PrivateKey.new();
    const result = agent.testDeployAgent(testnetPrivateKey, "fake test");

    await expect(result).resolves.toEqual<DeploySignedTestResp>({
      error: expect.any(String) as string,
      type: "TestDeployFailed",
    });
  });

  it("should testDeployAgent agent with success", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      headers: {
        "x-test-response": "with-logs",
      },
      privateKey,
    });

    const testnetPrivateKey = PrivateKey.new();
    const result = agent.testDeployAgent(testnetPrivateKey, "fake test");

    await expect(result).resolves.toEqual<DeploySignedTestResp>({
      logs: [
        {
          level: LogLevel.Info,
          message: "Hello, World!",
        },
      ],
      type: "Ok",
    });
  });

  it("should test wallet", async () => {
    const privateKey = PrivateKey.new();

    const agent = new AgentsApiSdk({
      basePath: "http://localhost:3100",
      privateKey,
    });

    const result = agent.getTestWalletKey();

    await expect(result).resolves.toEqual(expect.any(PrivateKey));
  });
});
