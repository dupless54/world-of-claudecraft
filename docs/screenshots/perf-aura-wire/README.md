# Evidence: per-tick wire-serialization GC pressure

Grafana screenshots captured from prod (`world-of-claudecraft-prod`, ~555 sim entities,
~42 players online) showing the correlated spike pattern that motivated this fix:

- `grafana-triage-correlation-tick-vs-eventloop-lag.png`: Sim tick p95/p99 breaching the
  50 ms/20 Hz budget (spiking toward 200 ms) in the same windows the WS event-loop lag
  p99 spikes toward 100 ms.
- `grafana-game-server-health-gc-heap.png`: GC time/sec and heap-used sawtoothing
  (roughly 64 MiB baseline to 192 MiB peaks) in lockstep with the tick-time spikes, while
  host CPU/memory/disk stayed low the whole time (ruling out host resource starvation).

See the PR description for the root cause (`wireEntity`'s per-aura serializer in
`server/game.ts` allocated 9 throwaway object literals per aura, per entity, every tick)
and the local microbenchmark verifying the fix.
