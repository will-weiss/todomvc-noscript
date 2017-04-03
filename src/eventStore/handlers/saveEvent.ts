import { Handler } from 'express'
import { isString } from 'lodash'
import { isCommand } from '../../types'


export default (saveEvent: (userId: UserId, command: Command) => Promise<void>): Handler => async (req, res) => {
  const { userId, command } = req.body

  if (!isString(userId)) {
    res.status(400).send('Body must include userId, a string')
  } else if (!isCommand(command)) {
    res.status(400).send('Invalid command')
  } else {
    await saveEvent(userId, command)
    res.sendStatus(204)
  }
}
