import { Handler } from 'express'
import templateData from './templateData'


type ReadProjection = (userId: UserId) => Promise<{ todos: Todo[] }>

export default (readProjection: ReadProjection): Handler => async (req, res) => {
  const { sessionID: userId, params: { visibilityFilter = 'all' } } = req
  const { todos } = await readProjection(userId!)
  res.render('index.mustache', templateData({ visibilityFilter, todos }))
}
