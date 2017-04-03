import { join } from 'path'
import { fromNode } from 'bluebird'
import eventStore from './eventStore'
import projection from './projection'
import application from './application'


export default async (testing: boolean = false) => {
  const {
    EVENT_STORE_DIR  = join(process.cwd(), 'events'),
    PROJECTION_DIR   = join(process.cwd(), 'projections'),
    EVENT_STORE_PORT = 8002,
    PROJECTION_PORT  = 8001,
    APPLICATION_PORT = 8000,
  } = process.env

  const localhostAt = (port: number) => `http://localhost:${port}`

  const eventStoreUrl  = localhostAt(EVENT_STORE_PORT)
  const projectionUrl  = localhostAt(PROJECTION_PORT)
  const applicationUrl = localhostAt(APPLICATION_PORT)

  if (!testing) {
    process.on('unhandledRejection', console.error)
  }

  await fromNode(cb => eventStore({ port: EVENT_STORE_PORT, directory: EVENT_STORE_DIR }, cb))
  await fromNode(cb => projection({ port: PROJECTION_PORT, directory: PROJECTION_DIR, eventStoreUrl }, cb))
  await fromNode(cb => application({ projectionUrl, eventStoreUrl, port: APPLICATION_PORT }, cb))

  console.log(`Listening at: ${applicationUrl}`)
}
