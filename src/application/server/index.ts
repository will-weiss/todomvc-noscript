import { Handler } from 'express'
import express = require('express')
import bodyParser = require('body-parser')
import { send500AndErrorMessageOnFailure } from '../../utils'
import { VisibilityFilters, Commands } from '../../types'


type ApplicationServerDependencies = {
  logger: Handler
  sessions: Handler
  getPage: Handler
  postCommand: Handler
}

export default ({ logger, sessions, getPage, postCommand }: ApplicationServerDependencies) =>
  express()
    .use(express.static('public'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(logger)
    .use(sessions)
    .engine('mustache', require('mustache-express')())
    .set('view engine', 'mustache')
    .get(`/:visibilityFilter(${VisibilityFilters.join('|')})?`, send500AndErrorMessageOnFailure(getPage))
    .post(`/:command(${Commands.join('|')})`, send500AndErrorMessageOnFailure(postCommand))
