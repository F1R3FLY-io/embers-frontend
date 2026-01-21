import type { BlockDefinition } from "blockly/core/blocks";

export const oslfBlocks: BlockDefinition[] = [
  {
    colour: "208bfe",
    inputsInline: true,
    message0: "0",
    output: "Proc",
    tooltip: "Zero: 0",
    type: "proc_zero",
  },
  {
    args0: [
      {
        check: "Name",
        name: "CHANNEL",
        type: "input_value",
      },
    ],
    colour: "208bfe",
    inputsInline: true,
    message0: "* ( %1 )",
    nextStatement: "Proc",
    previousStatement: "Proc",
    tooltip: "Drop: * ( ... )",
    type: "proc_drop",
  },
  {
    args0: [
      {
        check: "Name",
        name: "CHANNEL",
        type: "input_value",
      },
      {
        check: "Proc",
        name: "MESSAGE",
        type: "input_value",
      },
    ],
    colour: "208bfe",
    inputsInline: true,
    message0: "%1 ! ( %2 )",
    nextStatement: "Proc",
    previousStatement: "Proc",
    tooltip: "Output: ... ! ( ... )",
    type: "proc_output",
  },
  {
    args0: [
      {
        check: "Name",
        name: "CHANNEL",
        type: "input_value",
      },
      {
        name: "VAR",
        text: "x",
        type: "field_input",
      },
      {
        check: "Proc",
        name: "ARG3",
        type: "input_statement",
      },
    ],
    colour: "208bfe",
    message0: "for ( %1 -> %2 ) { %3 }",
    nextStatement: "Proc",
    previousStatement: "Proc",
    tooltip: "Input: for ( ... -> ... ) { ... }",
    type: "proc_input",
  },
  {
    args0: [
      {
        check: "Proc",
        name: "PROCS",
        type: "input_statement",
      },
    ],
    colour: "208bfe",
    message0: "{ %1 }",
    nextStatement: "Proc",
    previousStatement: "Proc",
    tooltip: "Par: { ... }",
    type: "proc_par",
  },
  {
    args0: [
      {
        check: "Proc",
        name: "BODY",
        type: "input_value",
      },
    ],
    colour: "65cda8",
    inputsInline: true,
    message0: "@ ( %1 )",
    output: "Name",
    tooltip: "Quote: @ ( ... )",
    type: "name_quote",
  },
  {
    args0: [
      {
        name: "VAR",
        text: "v",
        type: "field_input",
      },
    ],
    colour: "208bfe",
    inputsInline: true,
    message0: "%1",
    output: "Proc",
    tooltip: "Var: ...",
    type: "proc_var",
  },
  {
    args0: [
      {
        name: "VAR",
        text: "v",
        type: "field_input",
      },
    ],
    colour: "65cda8",
    inputsInline: true,
    message0: "%1",
    output: "Name",
    tooltip: "Var: ...",
    type: "name_var",
  },
];
