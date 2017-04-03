import { size, isString, isPlainObject, isNumber, isBoolean } from 'lodash'


export const Commands: string[] =
  ['new-todo', 'delete-todo', 'edit-todo', 'toggle-todo', 'toggle-all', 'clear-completed', 'undo', 'redo']

export const VisibilityFilters: VisibilityFilter[] =
  ['all', 'active', 'completed']


const size0 = (obj: any) => size(obj) === 0
const size1 = (obj: any) => size(obj) === 1
const size2 = (obj: any) => size(obj) === 2
const size3 = (obj: any) => size(obj) === 3
const size4 = (obj: any) => size(obj) === 4
const size5 = (obj: any) => size(obj) === 5
const size6 = (obj: any) => size(obj) === 6


export function isCommand(command: any): command is Command {
  const hasTypeAndPayload =
    isPlainObject(command)
      && size2(command)
      && isString(command.type)
      && isPlainObject(command.payload)

  if (!hasTypeAndPayload) return false

  const { type, payload } = command

  switch (type) {
    case 'new-todo':
      return size1(payload) && isString(payload.text)

    case 'delete-todo':
    case 'toggle-todo':
      return size1(payload) && isString(payload.id)

    case 'edit-todo':
      return size2(payload) && isString(payload.id) && isString(payload.newText)

    case 'toggle-all':
    case 'clear-completed':
    case 'undo':
    case 'redo':
      return size0(payload)

    default:
      return false
  }
}


export function isTodosProjection(projection: any): projection is TodosProjection {
  return isPlainObject(projection)
    && size2(projection)
    && Array.isArray(projection.textLookup)
    && projection.completed instanceof Set
    && Array.from(projection.textLookup).every(text => text === undefined || isString(text))
    && Array.from(projection.completed).every(index => isNumber(index) && index < projection.textLookup.length)
}
