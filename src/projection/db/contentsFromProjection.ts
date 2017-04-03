import * as symbols from './symbols'


type UserDirectoryContents = { metadata: FileContents, todos: FileContents }

function* metadataLines({ totalEventsProcessed, undoable, redoable }: ProjectionMetadata): IterableIterator<string> {
  yield `totalEventsProcessed: ${totalEventsProcessed}`
  yield `undoable: ${undoable}`
  yield `redoable: ${redoable}`
}


function* todoLines({ textLookup, completed }: TodosProjection): IterableIterator<string> {
  for (const [index, text] of textLookup.entries()) {
    if (!text) {
      yield symbols.deleted
    } else {
      const symbol = completed.has(index) ? symbols.complete : symbols.active
      yield `${symbol}\t${text}`
    }
  }
}

export default function contentsFromProjection(projection: WholeProjection): UserDirectoryContents {
  console.log('contentsFromProjection', projection)

  return {
    metadata: Array.from(metadataLines(projection.metadata)).join('\n'),
    todos: Array.from(todoLines(projection.todos)).join('\n'),
  }
}
