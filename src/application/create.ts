import { Handler } from 'express'
import * as clients from './clients'
import * as handlers from './handlers'
import server from './server'


export type ApplicationDependencies = {
  projectionUrl: Url
  eventStoreUrl: Url
  logger: Handler
  sessions: Handler
  requestPromise: RequestPromise
}

export default ({ projectionUrl, eventStoreUrl, logger, sessions, requestPromise }: ApplicationDependencies) =>
  server({
    logger,
    sessions,
    getPage: handlers.getPage(clients.projection({ projectionUrl, requestPromise }).readProjection),
    postCommand: handlers.postCommand(clients.eventStore({ eventStoreUrl, requestPromise }).saveCommand)
  })
