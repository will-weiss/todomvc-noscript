import { Handler } from 'express'


export function send500AndErrorMessageOnFailure(handler: Handler): Handler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next)
    } catch (err) {
      console.error(err)
      res.status(500).send(err.message)
    }
  }
}
