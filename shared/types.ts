export interface ServerAdvertisement {
  port: number;
  url: string;
  pid: number;
  startedAt: number;
  version: string;
}

export interface HealthResponse {
  ok: true;
  version: string;
  startedAt: number;
}
