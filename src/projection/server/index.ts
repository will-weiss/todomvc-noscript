import { Handler } from 'express'
import express = require('express')
import bodyParser = require('body-parser')
import { send500AndErrorMessageOnFailure } from '../../utils'


type Dependencies = {
  logger: Handler
  readTodos: Handler
}


export default ({ logger, readTodos }: Dependencies) =>
  express()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true }))
    .use(logger)
    .get(`/todos`, send500AndErrorMessageOnFailure(readTodos))
