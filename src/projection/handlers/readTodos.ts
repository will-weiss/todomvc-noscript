import { isString, size } from 'lodash'
import { Handler } from 'express'

type ReduceTodos = (userId: UserId) => Promise<{ todos: Todo[] }>


export default (reduceTodos: ReduceTodos): Handler => async (req, res) => {
  const { query } = req
  const { userId } = query

  if (!userId || !isString(userId)) {
    res.status(400).send('Query must include parameter "userId".')
  } else if (size(query) !== 1) {
    res.status(400).send('Query contains extraneous parameters. Query must only include parameter "userId".')
  } else {
    res.send(await reduceTodos(userId))
  }
}
