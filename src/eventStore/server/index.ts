import { Handler } from 'express'
import express = require('express')
import bodyParser = require('body-parser')
import { send500AndErrorMessageOnFailure } from '../../utils'


type EventStoreServerDependencies = {
  logger: Handler
  readEvents: Handler
  saveEvent: Handler
}

export default ({ logger, readEvents, saveEvent }: EventStoreServerDependencies) =>
  express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(logger)
    .get(`/events`, send500AndErrorMessageOnFailure(readEvents))
    .post(`/events`, send500AndErrorMessageOnFailure(saveEvent))
