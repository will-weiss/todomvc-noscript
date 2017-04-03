import { Handler } from 'express'
import asyncFile = require('async-file')
import mkdirp = require('mkdirp')
import create from './create'

type EventStoreConfig = { port: Port, directory: Directory }

const logger: Handler = (req, res, next) => {
  console.log(req.url, req.method, req.body)
  next()
}


const fs = {
  ...asyncFile,
  mkdirp: (filepath: string) =>
    new Promise((resolve, reject) => mkdirp(filepath, err => err ? reject(err) : resolve()))
}


export default async ({ port, directory }: EventStoreConfig, cb: (err?: Error) => void) =>
  (await create({ directory, fs, logger }))
    .listen(port, cb)
