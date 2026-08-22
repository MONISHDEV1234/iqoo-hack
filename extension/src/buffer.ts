/**
 * buffer.ts — In-memory ring buffer + trigger logic.
 *
 * Holds at most MAX_EVENTS events per workspace.
 * Fires extraction on:
 *   1. fail→pass test pattern (primary signal)
 *   2. idle timeout (IDLE_TIMEOUT_MS)
 *   3. manual "Extract Now" command
 */

export type EventType = "terminal" | "diagnostic" | "file_save";

export interface BufferEvent {
  ts: number;
  type: EventType;
  data: Record<string, unknown>;
}

const MAX_EVENTS = 500;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export class SessionBuffer {
  private events: BufferEvent[] = [];
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private onTrigger: (events: BufferEvent[], reason: string) => void;
  private lastFailTestTs: number | null = null;

  constructor(onTrigger: (events: BufferEvent[], reason: string) => void) {
    this.onTrigger = onTrigger;
  }

  push(event: BufferEvent): void {
    if (this.events.length >= MAX_EVENTS) {
      this.events.shift(); // drop oldest
    }
    this.events.push(event);
    this._resetIdleTimer();

    // Fail→pass pattern detection
    if (event.type === "terminal") {
      const data = event.data as {
        result?: string;
        command?: string;
        is_test_run?: boolean;
      };
      if (data.is_test_run) {
        if (data.result === "failed") {
          this.lastFailTestTs = event.ts;
        } else if (data.result === "passed" && this.lastFailTestTs !== null) {
          // Fail followed by pass — primary trigger
          const snap = this.drain();
          this.onTrigger(snap, "fail_to_pass");
        }
      }
    }
  }

  /** Manually trigger extraction and drain buffer. */
  extractNow(): void {
    const snap = this.drain();
    this.onTrigger(snap, "manual");
  }

  drain(): BufferEvent[] {
    const snap = [...this.events];
    this.events = [];
    this.lastFailTestTs = null;
    this._clearIdleTimer();
    return snap;
  }

  size(): number {
    return this.events.length;
  }

  private _resetIdleTimer(): void {
    this._clearIdleTimer();
    if (this.events.length > 0) {
      this.idleTimer = setTimeout(() => {
        const snap = this.drain();
        if (snap.length > 0) {
          this.onTrigger(snap, "idle_timeout");
        }
      }, IDLE_TIMEOUT_MS);
    }
  }

  private _clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  dispose(): void {
    this._clearIdleTimer();
  }
}
