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
 * One row per table: the root order, how many extras have been fired on it, and
 * when it was last touched. Sorted by that last touch so the row most recently
 * added to sits on top, matching the time each row shows.
 *
 * Only correct over a complete set of orders — hand it a slice and any family
 * straddling the cut reports the wrong extra count.
 */
export const summarizeRoots = (orders) =>
  orders
    .filter((order) => !order.extraNumber)
    .map((root) => {
      const family = familyOf(orders, root.rootNumber)
      return {
        ...root,
        extraCount: family.length - 1,
        lastActivityAt: family[family.length - 1].createdAt,
      }
    })
    .sort((a, b) => b.lastActivityAt - a.lastActivityAt || b.rootNumber - a.rootNumber)
