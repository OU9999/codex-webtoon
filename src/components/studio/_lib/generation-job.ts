interface GenerationJobOwner {
  projectName: string;
  panelId: string;
}

interface GenerationJob extends GenerationJobOwner {
  id: string;
  controller: AbortController;
}

interface GenerationJobRegistry {
  current: GenerationJob | null;
  nextId: number;
}

const createGenerationJobRegistry = (): GenerationJobRegistry => ({
  current: null,
  nextId: 1,
});

const startGenerationJob = (
  registry: GenerationJobRegistry,
  owner: GenerationJobOwner,
): GenerationJob => {
  registry.current?.controller.abort();

  const job: GenerationJob = {
    ...owner,
    id: `generation-${registry.nextId}`,
    controller: new AbortController(),
  };
  registry.nextId += 1;
  registry.current = job;

  return job;
};

const getActiveGenerationJob = (
  registry: GenerationJobRegistry,
): GenerationJob | null => registry.current;

const isActiveGenerationJob = (
  registry: GenerationJobRegistry,
  job: GenerationJob,
): boolean => registry.current?.id === job.id;

const clearGenerationJob = (
  registry: GenerationJobRegistry,
  job: GenerationJob,
): boolean => {
  if (!isActiveGenerationJob(registry, job)) return false;

  registry.current = null;
  return true;
};

export {
  clearGenerationJob,
  createGenerationJobRegistry,
  getActiveGenerationJob,
  isActiveGenerationJob,
  startGenerationJob,
};
export type { GenerationJob, GenerationJobOwner, GenerationJobRegistry };
