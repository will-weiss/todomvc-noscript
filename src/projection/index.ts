import { Handler } from 'express'
import requestPromise = require('request-promise')
import asyncFile = require('async-file')
import mkdirp = require('mkdirp')
import create from './create'



type ProjectionConfig = {
  port: Port
  directory: Directory
  eventStoreUrl: Url
}

const logger: Handler = (req, res, next) => {
  console.log(req.url, req.method, req.body)
  next()
}

const fs = {
  ...asyncFile,
  mkdirp: (filepath: string) =>
    new Promise((resolve, reject) => mkdirp(filepath, err => err ? reject(err) : resolve()))
}

export default async ({ port, directory, eventStoreUrl }: ProjectionConfig, cb: (err?: Error) => void) =>
  (await create({
    logger,
    fs,
    directory,
    eventStoreUrl,
    requestPromise
  })).listen(port, cb)
