// Gradual-migration shim: new code can import from "@/i18n/strings"
// instead of the legacy "@/ii8n/strings" path (typo kept for backwards
// compatibility). Both resolve to the same object; do not duplicate keys.
export { type StringKey, strings } from "@/ii8n/strings";
