import { mergeAttributes, Node } from "@tiptap/core";

export const SHOTGUN_VARIABLE_NODE_NAME = "shotgunVariable";

export interface ShotgunVariableNodeAttributes {
  key: string;
  label: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    shotgunVariable: {
      insertShotgunVariable: (
        attributes: ShotgunVariableNodeAttributes
      ) => ReturnType;
    };
  }
}

export const ShotgunVariableNode = Node.create({
  name: SHOTGUN_VARIABLE_NODE_NAME,
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: {
        default: "",
      },
      label: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-shotgun-variable]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-shotgun-variable": "true",
        "data-key": HTMLAttributes.key,
        contenteditable: "false",
        class:
          "sg-variable-chip mx-1 inline-flex items-center rounded-full border border-border/80 bg-muted px-3 py-1.5 text-xs font-medium text-foreground shadow-sm",
      }),
      HTMLAttributes.label || HTMLAttributes.key,
    ];
  },

  renderText({ node }) {
    const attributes = node.attrs as ShotgunVariableNodeAttributes;
    return `{{${attributes.key}}}`;
  },

  addCommands() {
    return {
      insertShotgunVariable:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: attributes,
            },
            {
              type: "text",
              text: " ",
            },
          ]),
    };
  },
});
