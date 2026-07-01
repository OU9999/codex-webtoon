interface LatestSaveJob<Payload> {
  sequence: number;
  payload: Payload;
}

interface LatestSaveQueue<Payload> {
  latestSequence: number;
  pending: LatestSaveJob<Payload> | null;
  inFlight: LatestSaveJob<Payload> | null;
}

interface LatestSaveFinishResult<Payload> {
  isLatest: boolean;
  next: LatestSaveJob<Payload> | null;
}

const createLatestSaveQueue = <Payload>(): LatestSaveQueue<Payload> => ({
  latestSequence: 0,
  pending: null,
  inFlight: null,
});

const queueLatestSave = <Payload>(
  queue: LatestSaveQueue<Payload>,
  payload: Payload,
): LatestSaveJob<Payload> => {
  const job = {
    sequence: queue.latestSequence + 1,
    payload,
  };

  queue.latestSequence = job.sequence;
  queue.pending = job;
  return job;
};

const startNextLatestSave = <Payload>(
  queue: LatestSaveQueue<Payload>,
): LatestSaveJob<Payload> | null => {
  if (queue.inFlight || !queue.pending) return null;

  queue.inFlight = queue.pending;
  queue.pending = null;
  return queue.inFlight;
};

const finishLatestSave = <Payload>(
  queue: LatestSaveQueue<Payload>,
  job: LatestSaveJob<Payload>,
): LatestSaveFinishResult<Payload> => {
  const isInFlight = queue.inFlight?.sequence === job.sequence;
  if (isInFlight) {
    queue.inFlight = null;
  }

  const isLatest = job.sequence === queue.latestSequence && !queue.pending;
  const next = isInFlight ? startNextLatestSave(queue) : null;
  return { isLatest, next };
};

export {
  createLatestSaveQueue,
  finishLatestSave,
  queueLatestSave,
  startNextLatestSave,
};
export type { LatestSaveFinishResult, LatestSaveJob, LatestSaveQueue };
