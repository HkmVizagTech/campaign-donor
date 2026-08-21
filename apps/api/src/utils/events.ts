import { EventEmitter } from "events";

// Fired whenever campaign/recipient/donor state changes so the admin portal
// can push live updates over SSE instead of the client polling for changes.
// campaignId is omitted for changes that aren't scoped to one campaign
// (e.g. a new donor being created).
export interface AppEvent {
  campaignId?: string;
}

class AppEventBus extends EventEmitter {}

export const appEvents = new AppEventBus();
appEvents.setMaxListeners(200);

export function emitAppEvent(event: AppEvent = {}): void {
  appEvents.emit("update", event);
}
