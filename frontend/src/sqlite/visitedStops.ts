// In-memory storage for visited stops
const visitedStops: Array<{ id: string; name: string; time: string; pending: boolean }> = [];

export async function addVisitedStop(stop: { id: string; name: string; time: string }): Promise<void> {
  console.log('addVisitedStop: adding stop', stop);
  visitedStops.push({ ...stop, pending: true });
  console.log('addVisitedStop: current stops', visitedStops);
}

export async function getVisitedStops(): Promise<Array<{ id: string; name: string; time: string; pending: boolean }>> {
  console.log('getVisitedStops: returning', visitedStops);
  return visitedStops;
}

export async function markStopAsSynced(id: string): Promise<void> {
  console.log('markStopAsSynced: marking stop', id);
  const stop = visitedStops.find(s => s.id === id);
  if (stop) {
    stop.pending = false;
    console.log('markStopAsSynced: updated stop', stop);
  }
}

export async function syncPendingStops(): Promise<void> {
  console.log('syncPendingStops: starting sync');
  for (const stop of visitedStops) {
    if (stop.pending) {
      await markStopAsSynced(stop.id);
    }
  }
  console.log('syncPendingStops: finished sync');
} 