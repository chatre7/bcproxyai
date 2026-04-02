import { startWorker } from "./index";

let started = false;

export function ensureWorkerStarted(): void {
  if (started) return;
  started = true;
  startWorker();
}
