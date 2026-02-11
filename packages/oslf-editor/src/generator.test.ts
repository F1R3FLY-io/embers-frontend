import { beforeEach, describe, expect, it, vi } from "vitest";

import { Order, RhoLangGenerator } from "./generator";

// Mock Blockly Block
function createMockBlock(
  type: string,
  options: {
    fields?: Record<string, string | number>;
    inputStatements?: Record<string, ReturnType<typeof createMockBlock>>;
    inputValues?: Record<string, ReturnType<typeof createMockBlock>>;
    nextBlock?: ReturnType<typeof createMockBlock>;
  } = {},
): any {
  const block: any = {
    getFieldValue: vi.fn((name: string) => options.fields?.[name] ?? null),
    nextConnection: options.nextBlock
      ? {
          targetBlock: () => options.nextBlock,
        }
      : null,
    type,
    workspace: {
      getVariableById: vi.fn(),
    },
  };

  // Add input connections for value inputs
  if (options.inputValues) {
    block.getInput = vi.fn((name: string) => {
      if (options.inputValues?.[name]) {
        return {
          connection: {
            targetBlock: () => options.inputValues![name],
          },
        };
      }
      return null;
    });
  }

  return block;
}

describe("RhoLangGenerator", () => {
  let generator: RhoLangGenerator;

  beforeEach(() => {
    generator = new RhoLangGenerator();
  });

  describe("Order constants", () => {
    it("should have correct precedence values", () => {
      expect(Order.ATOMIC).toBe(0);
      expect(Order.UNARY).toBe(1);
      expect(Order.NONE).toBe(99);
    });

    it("should have ATOMIC as highest precedence", () => {
      expect(Order.ATOMIC).toBeLessThan(Order.UNARY);
      expect(Order.UNARY).toBeLessThan(Order.MULTIPLICATIVE);
      expect(Order.MULTIPLICATIVE).toBeLessThan(Order.ADDITIVE);
    });
  });

  describe("registerBlockDefinitions", () => {
    it("should register a simple value block", () => {
      const blocks = [
        {
          message0: "0",
          output: "Proc",
          type: "proc_zero",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      expect(generator.forBlock.proc_zero).toBeDefined();
    });

    it("should register a statement block", () => {
      const blocks = [
        {
          args0: [{ check: "Name", name: "CHANNEL", type: "input_value" }],
          message0: "* ( %1 )",
          nextStatement: "Proc",
          previousStatement: "Proc",
          type: "proc_drop",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      expect(generator.forBlock.proc_drop).toBeDefined();
    });

    it("should skip blocks without type or message0", () => {
      const blocks = [
        { message0: "test" }, // no type
        { type: "test" }, // no message0
      ];

      generator.registerBlockDefinitions(blocks as any);

      expect(generator.forBlock.test).toBeUndefined();
    });
  });

  describe("code generation", () => {
    it("should generate code for a simple value block", () => {
      const blocks = [
        {
          message0: "0",
          output: "Proc",
          type: "proc_zero",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("proc_zero");
      const result = generator.forBlock.proc_zero(block, generator);

      expect(result).toEqual(["0", Order.ATOMIC]);
    });

    it("should generate code for a block with field input", () => {
      const blocks = [
        {
          args0: [{ name: "VAR", text: "v", type: "field_input" }],
          message0: "%1",
          output: "Proc",
          type: "proc_var",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("proc_var", {
        fields: { VAR: "myVar" },
      });
      const result = generator.forBlock.proc_var(block, generator);

      expect(result).toEqual(["myVar", Order.ATOMIC]);
    });

    it("should use default text when field is empty", () => {
      const blocks = [
        {
          args0: [{ name: "VAR", text: "defaultValue", type: "field_input" }],
          message0: "%1",
          output: "Proc",
          type: "proc_var",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("proc_var", {
        fields: {},
      });
      const result = generator.forBlock.proc_var(block, generator);

      expect(result).toEqual(["defaultValue", Order.ATOMIC]);
    });

    it("should generate code for statement block without input_statement", () => {
      const blocks = [
        {
          message0: "simple",
          nextStatement: "Proc",
          previousStatement: "Proc",
          type: "proc_simple",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("proc_simple");
      const result = generator.forBlock.proc_simple(block, generator);

      expect(typeof result).toBe("string");
      expect(result).toBe("simple\n");
    });
  });

  describe("scrub_ - parallel composition operator", () => {
    it("should return code as-is when there is no next block", () => {
      const block = createMockBlock("test_block");
      const code = "test code\n";

      const result = generator.scrub_(block, code, false);

      expect(result).toBe(code);
    });

    it("should return code as-is when thisOnly is true", () => {
      const nextBlock = createMockBlock("next_block");
      const block = createMockBlock("test_block", { nextBlock });
      const code = "test code\n";

      const result = generator.scrub_(block, code, true);

      expect(result).toBe(code);
    });

    it("should add | operator between stacked blocks", () => {
      // Mock blockToCode to avoid Blockly internals
      const nextBlock = createMockBlock("next_block");
      const block = createMockBlock("test_block", { nextBlock });

      // Spy on blockToCode and mock its return value
      const blockToCodeSpy = vi
        .spyOn(generator, "blockToCode")
        .mockReturnValue("next\n");

      const code = "first\n";
      const result = generator.scrub_(block, code, false);

      // Should have called blockToCode with the next block
      expect(blockToCodeSpy).toHaveBeenCalledWith(nextBlock);

      // Should contain | operator
      expect(result).toContain("|");
      expect(result).toContain("first");
      expect(result).toContain("next");

      // Clean up
      blockToCodeSpy.mockRestore();
    });

    it("should trim code before adding | operator", () => {
      const nextBlock = createMockBlock("next_block");
      const block = createMockBlock("test_block", { nextBlock });

      // Mock blockToCode
      const blockToCodeSpy = vi
        .spyOn(generator, "blockToCode")
        .mockReturnValue("next\n");

      const code = "test   \n\n\n";
      const result = generator.scrub_(block, code, false);

      // Should have trimmed the whitespace before |
      expect(result).toMatch(/^test\n\| next/);
      expect(result).not.toMatch(/\s{2,}\|/);

      blockToCodeSpy.mockRestore();
    });

    it("should format output as: code\\n| nextCode", () => {
      const nextBlock = createMockBlock("next_block");
      const block = createMockBlock("test_block", { nextBlock });

      const blockToCodeSpy = vi
        .spyOn(generator, "blockToCode")
        .mockReturnValue("second\n");

      const result = generator.scrub_(block, "first\n", false);

      // Verify exact format
      expect(result).toBe("first\n| second\n");

      blockToCodeSpy.mockRestore();
    });
  });

  describe("field types", () => {
    it("should handle field_number", () => {
      const blocks = [
        {
          args0: [{ name: "NUM", type: "field_number" }],
          message0: "value: %1",
          output: "Number",
          type: "test_number",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("test_number", {
        fields: { NUM: 42 },
      });
      const result = generator.forBlock.test_number(block, generator);

      expect(result).toEqual(["value: 42", Order.ATOMIC]);
    });

    it("should handle field_dropdown", () => {
      const blocks = [
        {
          args0: [{ name: "OP", type: "field_dropdown" }],
          message0: "op: %1",
          output: "Op",
          type: "test_dropdown",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const block = createMockBlock("test_dropdown", {
        fields: { OP: "ADD" },
      });
      const result = generator.forBlock.test_dropdown(block, generator);

      expect(result).toEqual(["op: ADD", Order.ATOMIC]);
    });

    it("should handle field_checkbox", () => {
      const blocks = [
        {
          args0: [{ name: "ENABLED", type: "field_checkbox" }],
          message0: "enabled: %1",
          output: "Bool",
          type: "test_checkbox",
        },
      ];

      generator.registerBlockDefinitions(blocks);

      const blockTrue = createMockBlock("test_checkbox", {
        fields: { ENABLED: "TRUE" },
      });
      const blockFalse = createMockBlock("test_checkbox", {
        fields: { ENABLED: "FALSE" },
      });

      expect(generator.forBlock.test_checkbox(blockTrue, generator)).toEqual([
        "enabled: true",
        Order.ATOMIC,
      ]);
      expect(generator.forBlock.test_checkbox(blockFalse, generator)).toEqual([
        "enabled: false",
        Order.ATOMIC,
      ]);
    });
  });

  describe("scrubNakedValue", () => {
    it("should add newline to naked values", () => {
      const result = generator.scrubNakedValue("test");
      expect(result).toBe("test\n");
    });
  });
});
