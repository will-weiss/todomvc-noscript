/* Aliases */

type Maybe<T> = T | undefined
type UserId = string
type Url = string
type Port = number
type EventIndex = number
type TodoId = number
type TodoText = string
type TodoComplete = boolean
type Directory = string
type FilePath = string
type FileContents = string

// enum Either {  }

type Try<T> = T | Error

interface FileSystem {
  exists: (dir: Directory) => Promise<boolean>
  mkdirp: (dir: Directory) => Promise<any>
  appendFile: (filepath: FilePath, contents: FileContents, encoding: 'utf8') => Promise<void>
  writeFile: (filepath: FilePath, contents: FileContents, encoding: 'utf8') => Promise<void>
  readFile: (filepath: string, encoding: 'utf8') => Promise<FileContents>
}

type ClientGetRequestOptions = {
  url: Url
  method: 'GET'
  json: true
  qs: any
}

type ClientPostRequestOptions = {
  url: Url
  method: 'POST'
  json: true
  body: any
}

type ClientRequestOptions = ClientGetRequestOptions | ClientPostRequestOptions

type RequestPromise = (opts: ClientRequestOptions) => any

type Todo = {
  id: TodoId
  text: TodoText
  complete: TodoComplete
}

type TodoTextLookup = (TodoText | undefined)[]

type VisibilityFilter = 'all' | 'active' | 'completed'

type TodosProjection = {
  textLookup: TodoTextLookup
  completed: Set<TodoId>
}

type ProjectionMetadata = {
  totalEventsProcessed: number
  undoable: boolean
  redoable: boolean
}

type WholeProjection = {
  metadata: ProjectionMetadata
  todos: TodosProjection
}

type Command =
  { type: 'new-todo', payload: { text: TodoText } } |
  { type: 'delete-todo', payload: { id: TodoId } } |
  { type: 'toggle-todo', payload: { id: TodoId } } |
  { type: 'edit-todo', payload: { id: TodoId, newText: TodoText } } |
  { type: 'toggle-all', payload: {} } |
  { type: 'clear-completed', payload: {} } |
  { type: 'undo', payload: {} } |
  { type: 'redo', payload: {} }

type EventsSinceQueryResult = {
  totalEvents: EventIndex
  eventsInRange: Command[]
}
