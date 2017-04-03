import { Handler } from 'express'
import requestPromise = require('request-promise')
import session = require('express-session')
import create from './create'

const FileStore = require('session-file-store')(session)
const sessions = session({ store: new FileStore(), secret: 'keyboard cat' })

const logger: Handler = (req, res, next) => {
  console.log(req.url, req.method, req.body)
  next()
}

type ApplicationConfig = {
  projectionUrl: Url
  eventStoreUrl: Url
  port: Port
}

export default ({ projectionUrl, eventStoreUrl, port }: ApplicationConfig, cb: (err?: Error) => void) =>
  create({ projectionUrl, eventStoreUrl, logger, sessions, requestPromise })
    .listen(port, cb)
