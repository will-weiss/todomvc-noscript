import { expect } from 'chai'
import { stub, SinonStub } from 'sinon'
import { range } from 'lodash'
import * as handlers from '../handlers'


describe.skip('handlers', () => {
  describe('postCommand', () => {

    const testCases = [
      {
        description: 'sends a 201 when there is no referer',
        headers: {},
        validateResponse: (res: any) => {
          expect(res.sendStatus).to.have.been.calledOnce
          expect(res.sendStatus).to.have.been.calledWithExactly(201)
        }
      },
      {
        description: 'redirects to the referer when there is one',
        headers: { referer: '/referer' },
        validateResponse: (res: any) => {
          expect(res.redirect).to.have.been.calledOnce
          expect(res.redirect).to.have.been.calledWithExactly('/referer')
        }
      }
    ]

    testCases.forEach(({ description, headers, validateResponse }) => {
      it(description, async () => {
        const saveCommand = stub()
        const postCommand: any = handlers.postCommand(saveCommand)
        const body = { text: 'bar' }
        const req: any = { sessionID: 'sessionId', body, params: { command: 'new-todo' }, headers }
        const res: any = { redirect: stub(), sendStatus: stub() }

        await postCommand(req, res)

        expect(saveCommand).to.have.been.calledOnce
        expect(saveCommand).to.have.been.calledWithExactly('sessionId', { type: 'new-todo', payload: { text: 'bar' } })

        validateResponse(res)
      })
    })
  })

  describe('getPage', () => {

    const todos = (activeCount: number, completedCount: number) =>
      range(activeCount).map(id => ({ id: `active-${id}`, text: `active-${id}`, complete: false }))
        .concat(range(completedCount).map(id => ({ id: `completed-${id}`, text: `completed-${id}`, complete: true })))

    const testCases = [
      {
        params: {} as { visibilityFilter?: VisibilityFilter },
        todos: todos(0, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: false,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: []
        }
      },
      {
        params: { visibilityFilter: 'all' },
        todos: todos(0, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: false,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: []
        }
      },
      {
        params: { visibilityFilter: 'active' },
        todos: todos(0, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: false,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: true,
          showingCompleted: false,
          visibleTodos: []
        }
      },
      {
        params: { visibilityFilter: 'completed' },
        todos: todos(0, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: false,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: false,
          showingCompleted: true,
          visibleTodos: []
        }
      },
      {
        params: {} as { visibilityFilter?: VisibilityFilter },
        todos: todos(1, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: true,
          itemsLeft: 1,
          oneLeft: true,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'active-0', text: 'active-0', complete: false }]
        }
      },
      {
        params: { visibilityFilter: 'all' },
        todos: todos(1, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: true,
          itemsLeft: 1,
          oneLeft: true,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'active-0', text: 'active-0', complete: false }]
        }
      },
      {
        params: { visibilityFilter: 'active' },
        todos: todos(1, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: true,
          itemsLeft: 1,
          oneLeft: true,
          showingAll: false,
          showingActive: true,
          showingCompleted: false,
          visibleTodos: [{ id: 'active-0', text: 'active-0', complete: false }]
        }
      },
      {
        params: { visibilityFilter: 'completed' },
        todos: todos(1, 0),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: false,
          anyTodos: true,
          itemsLeft: 1,
          oneLeft: true,
          showingAll: false,
          showingActive: false,
          showingCompleted: true,
          visibleTodos: []
        }
      },
      {
        params: {} as { visibilityFilter?: VisibilityFilter },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: { visibilityFilter: 'all' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: { visibilityFilter: 'active' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: true,
          showingCompleted: false,
          visibleTodos: []
        }
      },
      {
        params: { visibilityFilter: 'completed' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: false,
          showingCompleted: true,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: {} as { visibilityFilter?: VisibilityFilter },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: { visibilityFilter: 'all' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: { visibilityFilter: 'active' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: true,
          showingCompleted: false,
          visibleTodos: []
        }
      },
      {
        params: { visibilityFilter: 'completed' },
        todos: todos(0, 1),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 0,
          oneLeft: false,
          showingAll: false,
          showingActive: false,
          showingCompleted: true,
          visibleTodos: [{ id: 'completed-0', text: 'completed-0', complete: true }]
        }
      },
      {
        params: {} as { visibilityFilter?: VisibilityFilter },
        todos: todos(2, 2),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 2,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [
            { id: 'active-0', text: 'active-0', complete: false },
            { id: 'active-1', text: 'active-1', complete: false },
            { id: 'completed-0', text: 'completed-0', complete: true },
            { id: 'completed-1', text: 'completed-1', complete: true },
          ]
        }
      },
      {
        params: { visibilityFilter: 'all' },
        todos: todos(2, 2),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 2,
          oneLeft: false,
          showingAll: true,
          showingActive: false,
          showingCompleted: false,
          visibleTodos: [
            { id: 'active-0', text: 'active-0', complete: false },
            { id: 'active-1', text: 'active-1', complete: false },
            { id: 'completed-0', text: 'completed-0', complete: true },
            { id: 'completed-1', text: 'completed-1', complete: true },
          ]
        }
      },
      {
        params: { visibilityFilter: 'active' },
        todos: todos(2, 2),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 2,
          oneLeft: false,
          showingAll: false,
          showingActive: true,
          showingCompleted: false,
          visibleTodos: [
            { id: 'active-0', text: 'active-0', complete: false },
            { id: 'active-1', text: 'active-1', complete: false },
          ]
        }
      },
      {
        params: { visibilityFilter: 'completed' },
        todos: todos(2, 2),
        expectedTemplateData: {
          undo: false,
          redo: false,
          anyComplete: true,
          anyTodos: true,
          itemsLeft: 2,
          oneLeft: false,
          showingAll: false,
          showingActive: false,
          showingCompleted: true,
          visibleTodos: [
            { id: 'completed-0', text: 'completed-0', complete: true },
            { id: 'completed-1', text: 'completed-1', complete: true },
          ]
        }
      },
    ]

    for (const { todos, params, expectedTemplateData } of testCases) {
      const { visibilityFilter } = params

      const description = `responds correctly for visibilityFilter: ${visibilityFilter}`

      it(description, async () => {
        const readProjection = stub().returns(Promise.resolve({ todos }))
        const getPage: any = handlers.getPage(readProjection)
        const req: any = { sessionID: 'sessionId', params: params }
        const res: any = { render: stub() }

        await getPage(req, res)

        expect(readProjection).to.have.been.calledOnce
        expect(readProjection).to.have.been.calledWithExactly('sessionId')

        expect(res.render).to.have.been.calledOnce
        expect(res.render).to.have.been.calledWithExactly('index.mustache', expectedTemplateData)
      })
    }
  })
})
