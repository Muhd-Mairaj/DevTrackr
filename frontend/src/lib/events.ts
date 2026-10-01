/** Window events used to decouple shell commands from page-local dialogs. */
export const NEW_PROJECT_EVENT = "devtrackr:new-project";
export const NEW_ENTRY_EVENT = "devtrackr:new-entry";
export const SHORTCUTS_EVENT = "devtrackr:shortcuts";

export function dispatchAppEvent(name: string) {
  window.dispatchEvent(new Event(name));
}
