import { size, isString } from 'lodash'
import { Handler } from 'express'


export default (readEventsSince: (userId: UserId, since?: EventIndex | undefined) => Promise<EventsSinceQueryResult>): Handler => async (req, res) => {
  const { query } = req
  const { userId } = query
  const since = query.since == null ? -Infinity : Number(query.since)

  if (!userId || !isString(userId)) {
    res.status(400).send('Query must include parameter "userId"')
  } else if (Number.isNaN(since)) {
    res.status(400).send('Query parameter "since" must be a number, if present')
  } else if (size(query) > 2) {
    res.status(400).send('Query includes extraneous parameters. "userId" is required and "since" is optional.')
  } else {
    res.send(await readEventsSince(userId, since))
  }
}
