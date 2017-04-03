import { Handler, Application } from 'express'
import * as clients from './clients'
import * as handlers from './handlers'
import reducer from './reducer'
import connect from './db'
import server from './server'


type Dependencies = {
  directory: Directory
  eventStoreUrl: Url
  fs: FileSystem
  logger: Handler
  requestPromise: RequestPromise
}


export default async ({ fs, logger, requestPromise, directory, eventStoreUrl }: Dependencies): Promise<Application> => {
  const db = await connect({ fs, directory })

  return server({
    logger,
    readTodos: handlers.readTodos(reducer({
      readProjection: db.readProjection,
      writeProjection: db.writeProjection,
      readEventsSince: clients.eventStore({ eventStoreUrl, requestPromise }).readEventsSince,
    }))
  })
}
