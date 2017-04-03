import { expect, request } from 'chai'
import { stub } from 'sinon'
import { Handler, Application } from 'express'
import { load } from 'cheerio'
import { range } from 'lodash'
import create from '../create'


interface TestCase {
  description: string
  expectedClientRequest?: any
  provideClientResponse?: any
  makeRequest(app: Application): ChaiHttp.Request
  validateResponse(response: ChaiHttp.Response): void
}

const projectionUrl = 'http://projection.com'
const eventStoreUrl = 'http://eventStore.com'
const userId = 'jimbo'

const expectedProjectionQuery =
  ({ url: `${projectionUrl}/todos`, method: 'GET', json: true, qs: { userId } })

const expectedEventsPost = (body: any) =>
  ({ url: `${eventStoreUrl}/events`, method: 'POST', json: true, body: { ...body, userId } })

const todos = (activeCount: number, completedCount: number): { todos: Todo[] } => {
  const totalCount = activeCount + completedCount

  const todos =
    range(totalCount).map(id => {
      const complete = id >= completedCount
      const text = (complete ? 'complete' : 'active') + `-${id}`
      return { id, text, complete }
    })

  return { todos }
}

const prototypeProjectionResponse = {
  todos: [
    { id: '1', text: 'An Active Todo', complete: false },
    { id: '2', text: 'A Completed Todo', complete: true },
  ],
}

const testCases: TestCase[] = [
  {
    description: 'responds to a GET at /',
    makeRequest: app => request(app).get('/'),
    expectedClientRequest: expectedProjectionQuery,
    provideClientResponse: prototypeProjectionResponse,
    validateResponse: validateWebPage({
      visibilityFilter: 'all',
      footerShowing: false,
      todosShowing: false,
      clearCompletedShowing: false,
    }),
  },
  {
    description: 'responds to a GET at /all',
    makeRequest: app => request(app).get('/all'),
    expectedClientRequest: expectedProjectionQuery,
    provideClientResponse: prototypeProjectionResponse,
    validateResponse: validateWebPage({
      visibilityFilter: 'all',
      footerShowing: false,
      todosShowing: false,
      clearCompletedShowing: false,
    }),
  },
  {
    description: 'responds to a GET at /active',
    makeRequest: app => request(app).get('/active'),
    expectedClientRequest: expectedProjectionQuery,
    provideClientResponse: prototypeProjectionResponse,
    validateResponse: validateWebPage({
      visibilityFilter: 'active',
      footerShowing: false,
      todosShowing: false,
      clearCompletedShowing: false,
    }),
  },
  {
    description: 'responds to a GET at /completed',
    makeRequest: app => request(app).get('/completed'),
    expectedClientRequest: expectedProjectionQuery,
    provideClientResponse: prototypeProjectionResponse,
    validateResponse: validateWebPage({
      visibilityFilter: 'completed',
      footerShowing: false,
      todosShowing: false,
      clearCompletedShowing: false,
    }),
  },
  {
    description: '404s to a GET at an unknown route',
    makeRequest: app => request(app).get('/unknown'),
    validateResponse: response => expect(response).to.have.status(404)
  },
  {
    description: 'responds to a valid POST at /new-todo',
    makeRequest: app => request(app).post('/new-todo').send({ text: 'zing' }),
    expectedClientRequest: expectedEventsPost({ command: 'new-todo', payload: { text: 'zing' } }),
    provideClientResponse: { ok: true },
    validateResponse: response => expect(response).to.have.status(201),
  },
  {
    description: 'responds to a valid POST at /delete-todo',
    makeRequest: app => request(app).post('/delete-todo').send({ id: 1 }),
    expectedClientRequest: expectedEventsPost({ command: 'delete-todo', payload: { id: 1 } }),
    provideClientResponse: { ok: true },
    validateResponse: response => expect(response).to.have.status(201),
  },
  {
    description: 'responds to a valid POST at /edit-todo',
    makeRequest: app => request(app).post('/edit-todo').send({ id: 1, newText: 'zing' }),
    expectedClientRequest: expectedEventsPost({ command: 'edit-todo', payload: { id: 1, newText: 'zing' } }),
    provideClientResponse: { ok: true },
    validateResponse: response => expect(response).to.have.status(201),
  },
  {
    description: 'responds to a valid POST at /toggle-todo',
    makeRequest: app => request(app).post('/toggle-todo').send({ id: 1 }),
    expectedClientRequest: expectedEventsPost({ command: 'toggle-todo', payload: { id: 1 } }),
    provideClientResponse: { ok: true },
    validateResponse: response => expect(response).to.have.status(201),
  },
  {
    description: '400s when a POST at /new-todo does not include text',
    makeRequest: app => request(app).post('/new-todo').send({}),
    validateResponse: response => expect(response).to.have.status(400),
  },
  {
    description: '400s when a POST at /delete-todo does not include an id',
    makeRequest: app => request(app).post('/delete-todo').send({}),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
  {
    description: '400s when a POST at /edit-todo does not include an id',
    makeRequest: app => request(app).post('/edit-todo').send({}),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
  {
    description: '400s when POST at /edit-todo does not include new text',
    makeRequest: app => request(app).post('/new-todo').send({ id: 1 }),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
  {
    description: '400s when a POST at /toggle-todo does not include an id',
    makeRequest: app => request(app).post('/toggle-todo').send({}),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
  {
    description: '400s when a POST at /toggle-all has any keys',
    makeRequest: app => request(app).post('/toggle-all').send({ id: 1 }),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
  {
    description: '400s when a POST at /clear-completed has any keys',
    makeRequest: app => request(app).post('/clear-completed').send({ id: 1 }),
    validateResponse: response =>  expect(response).to.have.status(400),
  },
]

interface ValidateWebPageOpts {
  visibilityFilter: VisibilityFilter
  footerShowing: boolean
  todosShowing: boolean
  clearCompletedShowing: boolean
}

function validateWebPage({
  visibilityFilter,
  footerShowing,
  todosShowing,
  clearCompletedShowing,
}: ValidateWebPageOpts) {
  return (response: ChaiHttp.Response) => {
    expect(response.type).to.equal('text/html')

    const $ = load((response as any).text)
    const active = $('#begin-edit-1')
    const completed = $('#begin-edit-2')
    const allLink = $('#all-link')
    const activeLink = $('#active-link')
    const completedLink = $('#completed-link')

    expect(active.text().trim()).to.equal(visibilityFilter === 'completed' ? '' : 'An Active Todo')
    expect(completed.text().trim()).to.equal(visibilityFilter === 'active' ? '' : 'A Completed Todo')
    expect(allLink.hasClass('selected')).to.equal(visibilityFilter === 'all')
    expect(activeLink.hasClass('selected')).to.equal(visibilityFilter === 'active')
    expect(completedLink.hasClass('selected')).to.equal(visibilityFilter === 'completed')
  }
}

function createTest(testCase: TestCase): void {
  const { description, expectedClientRequest, provideClientResponse, makeRequest, validateResponse } = testCase

  it(description, async () => {
    const logger = stub().callsArg(2)

    const requestPromise = expectedClientRequest
      ? stub().withArgs(expectedClientRequest).returns(Promise.resolve(provideClientResponse))
      : stub().throws()

    const sessions: Handler = (req, res, next) => {
      req.sessionID = userId
      next()
    }

    const app = create({ logger, sessions, projectionUrl, eventStoreUrl, requestPromise })

    const response = await makeRequest(app).catch(error => error.response)

    expect(logger).to.have.been.calledOnce

    validateResponse(response)
  })
}

describe.skip('application', () => testCases.forEach(createTest))
