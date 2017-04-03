import { Handler, Application } from 'express'
import * as handlers from './handlers'
import connect from './db'
import server from './server'


type EventStoreDependencies = {
  directory: Directory
  fs: FileSystem
  logger: Handler
}


export default async ({ directory, fs, logger }: EventStoreDependencies): Promise<Application> => {
  const db = await connect({ directory, fs })
  return server({
    logger,
    readEvents: handlers.readEvents(db.readEventsSince),
    saveEvent: handlers.saveEvent(db.saveEvent),
  })
}
