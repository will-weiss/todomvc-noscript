import * as symbols from './symbols'
import { isTodosProjection } from '../../types'


type UserDirectoryContents = { metadata: FileContents, todos: FileContents }
type Parser<P> = (projection: Partial<P>, line: string, lineno: number) => Partial<P>
type Interpreter<P> = (projection: Partial<P>, match: string[], lineno: number) => Partial<P>


function lineParser<P>(pattern: RegExp, interpreter: Interpreter<P>): Parser<P> {
  return (projection, line, lineno) => {
    const match = line.match(pattern)
    if (match) {
      return interpreter(projection, match.slice(1), lineno)
    } else {
      throw new Error(`Expected line ${lineno} to match pattern ${pattern}. Found "${line}".`)
    }
  }
}

const parsers = {
  totalEventsProcessed: lineParser<ProjectionMetadata>(
    /^totalEventsProcessed: (\d+)$/, (projection, [totalEventsProcessed]) =>
      ({ ...projection, totalEventsProcessed: Number(totalEventsProcessed) })
  ),

  undoable: lineParser<ProjectionMetadata>(
    /^undoable: (true|false)$/, (projection, [undoable]) =>
      ({ ...projection, undoable: (undoable === 'true') })
  ),

  redoable: lineParser<ProjectionMetadata>(
    /^redoable: (true|false)$/, (projection, [redoable]) =>
      ({ ...projection, redoable: (redoable === 'true') })
  ),

  todo: lineParser<TodosProjection>(
    new RegExp(`^(${symbols.complete}|${symbols.active})\t(.*)$`), (projection, [symbol, text], lineno) => {
      const id = lineno
      const index = id - 1
      if (symbol === symbols.complete) projection.completed!.add(index)
      projection.textLookup![index] = text
      return projection
    }
  ),
}


function parseMetadataLine(projection: Partial<ProjectionMetadata>, line: string, index: number): Partial<ProjectionMetadata> {
  const lineno = index + 1
  switch (lineno) {
    case 1:  return parsers.totalEventsProcessed(projection, line, lineno)
    case 2:  return parsers.undoable(projection, line, lineno)
    case 3:  return parsers.redoable(projection, line, lineno)
    default: throw new Error(`Unexpected line: ${line}`)
  }
}

function parseTodoLine(projection: Partial<TodosProjection>, line: string, index: number): Partial<TodosProjection> {
  const lineno = index + 1
  return parsers.todo(projection, line, lineno)
}

export default function projectionFromFile(fileContents: UserDirectoryContents): WholeProjection {
  const nonEmptyMetadataLines = fileContents.metadata.split('\n').filter(line => line)
  const nonEmptyTodoLines = fileContents.todos.split('\n').filter(line => line)

  const projectionMetadata = nonEmptyMetadataLines.reduce(parseMetadataLine, {} as any) as ProjectionMetadata
  const todosProjection = nonEmptyTodoLines.reduce(parseTodoLine, { textLookup: [], completed: new Set() } as TodosProjection) as TodosProjection

  return {
    metadata: projectionMetadata,
    todos: todosProjection,
  }
}
