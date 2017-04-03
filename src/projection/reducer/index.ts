import update from './update'


type Response = {
  undoable: boolean
  redoable: boolean
  todos: Todo[]
}


interface Dependencies {
  readEventsSince(userId: UserId, since: EventIndex | undefined): Promise<{ totalEvents: number, eventsInRange: Command[] }>
  readProjection(userId: UserId): Promise<WholeProjection | undefined>
  writeProjection(userId: UserId, projection: WholeProjection): Promise<void>
}

function* todos(projection: TodosProjection): IterableIterator<Todo> {
  for (const [index, text] of projection.textLookup.entries()) {
    if (text) {
      const id = index + 1
      yield { id, text, complete: projection.completed.has(index) }
    }
  }
}

function responseOf(projection: WholeProjection): Response {
  return {
    undoable: projection.metadata.undoable,
    redoable: projection.metadata.redoable,
    todos: Array.from(todos(projection.todos)),
  }
}

function eventStacks(eventsInRange: Command[]): { done: Command[], undone: Command[] } {
  const done: Command[] = []
  let undone: Command[] = []

  for (const event of eventsInRange) {
    switch (event.type) {
      case 'undo':
        undone.unshift(done.shift()!)
        break
      case 'redo':
        done.unshift(undone.shift()!)
        break
      default:
        done.unshift(event)
        undone = []
        break
    }
  }

  done.reverse()
  undone.reverse()

  return { done, undone }
}


export default ({ readEventsSince, readProjection, writeProjection }: Dependencies) => {

  return reduceTodos

  async function fetchEventsAndReturnUpdatedProjection(
    userId: UserId,
    existingProjection: WholeProjection = {
      metadata: { totalEventsProcessed: 0, undoable: false, redoable: false },
      todos: { textLookup: [], completed: new Set() },
    }
  ): Promise<WholeProjection> {
    console.log(arguments)

    const eventsProcessedSoFar = existingProjection.metadata.totalEventsProcessed
    const originalEventsResponse = await readEventsSince(userId, eventsProcessedSoFar)

    const historyChanged =
      originalEventsResponse.eventsInRange
        .some(event => event.type === 'undo' || event.type === 'redo')

    const pastProjectionInvalid = !!(historyChanged && eventsProcessedSoFar)

    if (pastProjectionInvalid) {
      return fetchEventsAndReturnUpdatedProjection(userId)
    }

    const response =
      pastProjectionInvalid
        ? (await readEventsSince(userId, 0))
        : originalEventsResponse

    const { totalEvents, eventsInRange } = response
    const { done, undone } = eventStacks(eventsInRange)

    console.log(done, undone)

    if (eventsProcessedSoFar + eventsInRange.length !== totalEvents) {
      throw new Error('Event Store response unexpected ' + JSON.stringify(response))
    }

    const undoable = eventsInRange.length ? !!done.length : existingProjection.metadata.undoable
    const redoable = eventsInRange.length ? !!undone.length : existingProjection.metadata.redoable

    const projectionMetadata = { undoable, redoable, totalEventsProcessed: totalEvents }
    const todosProjection = existingProjection.todos
    update(todosProjection, done)

    return { metadata: projectionMetadata, todos: todosProjection }
  }

  async function reduceTodos(userId: UserId): Promise<Response> {

    const existingProjection =
      (await readProjection(userId)) || {
        metadata: { totalEventsProcessed: 0, undoable: false, redoable: false },
        todos: { textLookup: [], completed: new Set() },
      }

    const eventsProcessedSoFar = existingProjection.metadata.totalEventsProcessed

    const nextProjection = await fetchEventsAndReturnUpdatedProjection(userId, existingProjection)

    if (nextProjection.metadata.totalEventsProcessed > eventsProcessedSoFar) {
      await writeProjection(userId, nextProjection)
    }

    return responseOf(nextProjection)
  }
}
