/** A pending write has no server time yet; estimate it so nothing renders blank. */
const SNAPSHOT_OPTIONS = { serverTimestamps: 'estimate' }

export const orderFromDoc = (snapshot) => {
  const data = snapshot.data(SNAPSHOT_OPTIONS)
  return { ...data, id: snapshot.id, createdAt: data.createdAt.toDate() }
}

/** Root order plus every extra on it, oldest first — the full running bill. */
export const familyOf = (orders, rootNumber) =>
  orders
    .filter((order) => order.rootNumber === rootNumber)
    .slice()
    .reverse()

/**
 * One row per table: the root order and how many extras have been fired on it.
 * Sorted by root number, which rises with the hour a table was opened, so a row
 * never moves once it appears — later activity grows a bill in place instead of
 * pulling it to the top under whoever is reading it.
 *
 * `createdAt` and `id` only break ties between duplicate root numbers, which
 * pre-date server-assigned numbering; without them such rows would swap places
 * between snapshots.
 *
 * Only correct over a complete set of orders — hand it a slice and any family
 * straddling the cut reports the wrong extra count.
 */
export const summarizeRoots = (orders) =>
  orders
    .filter((order) => !order.extraNumber)
    .map((root) => ({ ...root, extraCount: familyOf(orders, root.rootNumber).length - 1 }))
    .sort(
      (a, b) =>
        a.rootNumber - b.rootNumber || a.createdAt - b.createdAt || a.id.localeCompare(b.id),
    )
