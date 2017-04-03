import { partition } from 'lodash'

export type UserData = {
  visibilityFilter: VisibilityFilter
  todos: Todo[]
}

export type TemplateData = {
  visibleTodos: Todo[]
  itemsLeft: number
  oneLeft: boolean
  anyTodos: boolean
  anyComplete: boolean
  showingAll: boolean
  showingActive: boolean
  showingCompleted: boolean
  undo: any
  redo: any
}

export default function templateData({ visibilityFilter, todos }: UserData): TemplateData {
  const [active, completed] = partition(todos, todo => todo.complete)

  const all = active.concat(completed)
  const itemsLeft = active.length
  const oneLeft = itemsLeft === 1

  const showingAll       = visibilityFilter === 'all'
  const showingActive    = visibilityFilter === 'active'
  const showingCompleted = visibilityFilter === 'completed'

  const visibleTodos =
    showingAll ? all : (showingActive ? active : completed)

  const anyTodos    = !!all.length
  const anyComplete = !!completed.length

  const undo = false
  const redo = false

  return { visibleTodos, itemsLeft, oneLeft, anyTodos, anyComplete, showingAll, showingActive, showingCompleted, undo, redo }
}
