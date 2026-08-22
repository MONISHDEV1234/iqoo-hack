"use strict";
/**
 * buffer.ts — In-memory ring buffer + trigger logic.
 *
 * Holds at most MAX_EVENTS events per workspace.
 * Fires extraction on:
 *   1. fail→pass test pattern (primary signal)
 *   2. idle timeout (IDLE_TIMEOUT_MS)
 *   3. manual "Extract Now" command
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionBuffer = void 0;
const MAX_EVENTS = 500;
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
class SessionBuffer {
    constructor(onTrigger) {
        this.events = [];
        this.idleTimer = null;
        this.lastFailTestTs = null;
        this.onTrigger = onTrigger;
    }
    push(event) {
        if (this.events.length >= MAX_EVENTS) {
            this.events.shift(); // drop oldest
        }
        this.events.push(event);
        this._resetIdleTimer();
        // Fail→pass pattern detection
        if (event.type === "terminal") {
            const data = event.data;
            if (data.is_test_run) {
                if (data.result === "failed") {
                    this.lastFailTestTs = event.ts;
                }
                else if (data.result === "passed" && this.lastFailTestTs !== null) {
                    // Fail followed by pass — primary trigger
                    const snap = this.drain();
                    this.onTrigger(snap, "fail_to_pass");
                }
            }
        }
    }
    /** Manually trigger extraction and drain buffer. */
    extractNow() {
        const snap = this.drain();
        this.onTrigger(snap, "manual");
    }
    drain() {
        const snap = [...this.events];
        this.events = [];
        this.lastFailTestTs = null;
        this._clearIdleTimer();
        return snap;
    }
    size() {
        return this.events.length;
    }
    _resetIdleTimer() {
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
    _clearIdleTimer() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
    dispose() {
        this._clearIdleTimer();
    }
}
exports.SessionBuffer = SessionBuffer;
//# sourceMappingURL=buffer.js.map