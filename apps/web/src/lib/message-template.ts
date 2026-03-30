/**
 * Re-exports shared template logic and adds browser-specific localStorage helpers.
 */

import type { JSONContent } from "@tiptap/react";

import {
  type MessageTemplateSettings,
  type TemplateNode,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  cloneTemplateContent,
  normalizeMessageTemplateSettings,
} from "@shotgun-notifier/shared";

// Re-export everything the frontend components already import
export {
  type MessageTemplateSection,
  type MessageTemplateSectionMeta,
  type MessageTemplateVariable,
  type MessageTemplatePreset,
  type MessageTemplateSettings,
  type TemplateNode,
  SHOTGUN_VARIABLE_NODE_NAME,
  DEFAULT_MESSAGE_TEMPLATE_SETTINGS,
  DEFAULT_MESSAGE_TEMPLATE_CONTENT,
  MESSAGE_TEMPLATE_SECTIONS,
  MESSAGE_TEMPLATE_VARIABLES,
  MESSAGE_TEMPLATE_PRESETS,
  SAMPLE_MESSAGE_TEMPLATE_CONTEXT,
  getMessageTemplateVariable,
  getMessageTemplateVariablesForSection,
  createMessageTemplateVariableNode,
  cloneTemplateContent,
  renderMessageTemplatePreview,
  renderMessageTemplateWithData,
  serializeMessageTemplate,
  extractMessageTemplateVariableKeys,
  normalizeMessageTemplateSettings,
} from "@shotgun-notifier/shared";

// ---------------------------------------------------------------------------
// Browser-only localStorage helpers
// ---------------------------------------------------------------------------

export const MESSAGE_TEMPLATE_STORAGE_KEY = "message_template";
export const MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY =
  "message_template_settings";

/**
 * Alias kept for backward-compat with components that import this name.
 */
export function cloneMessageTemplateContent(content: JSONContent): JSONContent {
  return cloneTemplateContent(content as unknown as TemplateNode) as unknown as JSONContent;
}

export function readStoredMessageTemplateContent(): JSONContent {
  if (typeof window === "undefined") {
    return cloneMessageTemplateContent(
      DEFAULT_MESSAGE_TEMPLATE_CONTENT as unknown as JSONContent
    );
  }

  const raw = window.localStorage.getItem(MESSAGE_TEMPLATE_STORAGE_KEY);
  if (!raw) {
    return cloneMessageTemplateContent(
      DEFAULT_MESSAGE_TEMPLATE_CONTENT as unknown as JSONContent
    );
  }

  try {
    const parsed = JSON.parse(raw) as JSONContent;
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed;
    }
    return cloneMessageTemplateContent(
      DEFAULT_MESSAGE_TEMPLATE_CONTENT as unknown as JSONContent
    );
  } catch {
    return cloneMessageTemplateContent(
      DEFAULT_MESSAGE_TEMPLATE_CONTENT as unknown as JSONContent
    );
  }
}

export function saveStoredMessageTemplateContent(content: JSONContent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MESSAGE_TEMPLATE_STORAGE_KEY,
    JSON.stringify(content)
  );
}

export function readStoredMessageTemplateSettings(): MessageTemplateSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }

  const raw = window.localStorage.getItem(
    MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY
  );
  if (!raw) return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };

  try {
    return normalizeMessageTemplateSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_MESSAGE_TEMPLATE_SETTINGS };
  }
}

export function saveStoredMessageTemplateSettings(
  settings: MessageTemplateSettings
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeMessageTemplateSettings(settings))
  );
}

export function clearStoredMessageTemplate() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MESSAGE_TEMPLATE_STORAGE_KEY);
  window.localStorage.removeItem(MESSAGE_TEMPLATE_SETTINGS_STORAGE_KEY);
}
