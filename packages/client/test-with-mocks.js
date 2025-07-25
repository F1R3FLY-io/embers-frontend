#!/usr/bin/env node

import { spawn } from "child_process";
import http from "http";

let mockServer = null;

// Function to check if server is ready
function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function checkServer() {
      const req = http.request(
        {
          hostname: "localhost",
          port: port,
          path: "/",
          method: "GET",
          timeout: 1000,
        },
        (res) => {
          console.log("✅ Mock server is ready");
          resolve();
        },
      );

      req.on("error", () => {
        if (Date.now() - startTime < timeout) {
          setTimeout(checkServer, 500);
        } else {
          reject(new Error(`Server did not start within ${timeout}ms`));
        }
      });

      req.on("timeout", () => {
        req.destroy();
        if (Date.now() - startTime < timeout) {
          setTimeout(checkServer, 500);
        } else {
          reject(new Error(`Server did not start within ${timeout}ms`));
        }
      });

      req.end();
    }

    checkServer();
  });
}

// Function to start mock server
function startMockServer() {
  return new Promise((resolve, reject) => {
    console.log("🚀 Starting Counterfact mock server...");

    mockServer = spawn(
      "counterfact",
      [
        "./embers-api-schema.json",
        "mocks",
        "--generate",
        "--serve",
        "--port",
        "3100",
      ],
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    mockServer.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`Mock server: ${output.trim()}`);

      // Check if server has started successfully
      if (
        output.includes("Starting REPL") ||
        output.includes("localhost:3100")
      ) {
        resolve();
      }
    });

    mockServer.stderr.on("data", (data) => {
      console.error(`Mock server error: ${data.toString().trim()}`);
    });

    mockServer.on("error", (error) => {
      reject(new Error(`Failed to start mock server: ${error.message}`));
    });

    mockServer.on("close", (code) => {
      if (code !== 0 && code !== null) {
        reject(new Error(`Mock server exited with code ${code}`));
      }
    });

    // Fallback: if we don't get the expected output, try waiting for the port
    setTimeout(async () => {
      try {
        await waitForServer(3100, 10000);
        resolve();
      } catch (error) {
        reject(error);
      }
    }, 3000);
  });
}

// Function to run tests
function runTests() {
  return new Promise((resolve, reject) => {
    console.log("🧪 Running tests...");

    const coverage = process.argv[2] === "--coverage" ? "--coverage" : "";

    const testProcess = spawn("jest", [coverage], {
      stdio: "inherit",
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Tests completed successfully");
        resolve();
      } else {
        console.log(`❌ Tests failed with exit code ${code}`);
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProcess.on("error", (error) => {
      reject(new Error(`Failed to run tests: ${error.message}`));
    });
  });
}

// Function to cleanup
function cleanup() {
  if (mockServer && !mockServer.killed) {
    console.log("🧹 Cleaning up mock server...");
    mockServer.kill("SIGTERM");

    // Force kill if it doesn't terminate gracefully
    setTimeout(() => {
      if (!mockServer.killed) {
        mockServer.kill("SIGKILL");
      }
    }, 5000);
  }
}

// Main execution
async function main() {
  let exitCode = 0;

  try {
    // Start mock server
    await startMockServer();

    // Additional wait to ensure server is fully ready
    await waitForServer(3100, 15000);

    // Run tests
    await runTests();
  } catch (error) {
    console.error("❌ Error:", error.message);
    exitCode = 1;
  } finally {
    cleanup();
  }

  process.exit(exitCode);
}

// Handle process signals for cleanup
process.on("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, cleaning up...");
  cleanup();
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM, cleaning up...");
  cleanup();
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught exception:", error.message);
  cleanup();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled rejection at:", promise, "reason:", reason);
  cleanup();
  process.exit(1);
});

// Run the main function
main();
