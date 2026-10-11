import type {ColorName} from '../../spec/vocab';

// Software / system design: clients, servers, data, messaging, infrastructure.
export const ICONS = [
  'client', 'api', 'gateway', 'instances', 'lambda', 'container',
  'db', 'replica', 'cache', 'storage',
  'queue', 'broker', 'worker', 'scheduler',
  'cdn', 'external', 'ratelimit', 'lock', 'code',
] as const;
export type Name = (typeof ICONS)[number];

// Values may name a common icon (search, bell, chart); checked at load time.
export const ALIASES: Record<string, string> = {
  browser: 'client', web: 'client', frontend: 'client',
  server: 'api', backend: 'api', service: 'api', microservice: 'api', app_server: 'api',
  loadbalancer: 'gateway', 'load-balancer': 'gateway', lb: 'gateway', proxy: 'gateway', nginx: 'gateway', 'api-gateway': 'gateway',
  cluster: 'instances', servers: 'instances', pods: 'instances',
  function: 'lambda', serverless: 'lambda', docker: 'container', kubernetes: 'container', k8s: 'container',
  database: 'db', postgres: 'db', mysql: 'db', sql: 'db', mongodb: 'db', mongo: 'db',
  redis: 'cache', memcached: 'cache',
  s3: 'storage', bucket: 'storage', blob: 'storage', disk: 'storage',
  elasticsearch: 'search', index: 'search',
  sqs: 'queue', rabbitmq: 'queue', kafka: 'broker', pubsub: 'broker', stream: 'broker',
  job: 'worker', consumer: 'worker', cron: 'scheduler', timer: 'scheduler',
  thirdparty: 'external', 'third-party': 'external', stripe: 'external', cloud: 'external',
  limiter: 'ratelimit', 'rate-limiter': 'ratelimit', auth: 'lock', security: 'lock', jwt: 'lock',
  websocket: 'bell', monitoring: 'chart', editor: 'code',
};

export const COLOR: Record<Name, ColorName> = {
  client: 'blue', api: 'purple', gateway: 'orange', instances: 'purple', lambda: 'orange', container: 'teal',
  db: 'teal', replica: 'teal', cache: 'red', storage: 'green',
  queue: 'yellow', broker: 'yellow', worker: 'green', scheduler: 'gray',
  cdn: 'blue', external: 'gray', ratelimit: 'red', lock: 'gray', code: 'purple',
};

// Maps a generic node status to the illustration's own animated state.
export const STATES: Record<string, Partial<Record<Name, string>>> = {
  busy: {
    client: 'loading', api: 'busy', db: 'scanning', worker: 'working', queue: 'msg',
    gateway: 'waiting', cdn: 'serving', storage: 'uploading', replica: 'syncing', instances: 'busy',
    broker: 'flowing', ratelimit: 'throttling', external: 'slow',
    scheduler: 'tick', lambda: 'busy', container: 'busy', code: 'busy',
  },
  error: {client: 'error', gateway: 'cut', external: 'down', instances: 'one-down', broker: 'backlog', cache: 'miss', lock: 'error', replica: 'lagging'},
  warn: {cache: 'cold', external: 'slow', replica: 'lagging', broker: 'backlog', gateway: 'waiting'},
  ok: {client: 'done', worker: 'done', cache: 'hit', lock: 'ok'},
};

// State when the status has no mapping above.
export const DEFAULT_STATE: Partial<Record<Name, string>> = {queue: 'empty'};
