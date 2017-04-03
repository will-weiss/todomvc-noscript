import { Handler } from 'express'
import { isCommand } from '../../types'


type SaveCommand = (userId: UserId, command: Command) => Promise<void>


export default (saveCommand: SaveCommand): Handler => async (req, res) => {
  const { sessionID: userId, body: payload, params: { command: type }, headers: { referer } } = req
  const command = { type, payload }

  if (!isCommand({ type, payload })) {
    res.sendStatus(400)
  } else if (referer) {
    await saveCommand(userId!, command)
    res.redirect(referer)
  } else {
    await saveCommand(userId!, command)
    res.sendStatus(201)
  }
}
