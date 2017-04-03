import { expect, request } from 'chai'
import { stub } from 'sinon'
import { Application } from 'express'
import create from '../create'


interface TestCase {
  description: string
  eventFileContents?: string[]
  expectResponseStatus: number
  expectResponseBody?: any
  expectAppendedLine?: string
  makeRequest(app: Application): ChaiHttp.Request
}

const directory = 'someEventsDir'
const userId = 'jimbo'
const filepath = `${directory}/${userId}`

const postEvent = (body: any) => (app: Application) => request(app).post('/events').send(body)

const testCases: TestCase[] = [
  {
    description: 'handles a GET when there are no events for the user',
    makeRequest: app => request(app).get(`/events?userId=${userId}`),
    expectResponseStatus: 200,
    expectResponseBody: {
      totalEvents:  0,
      eventsInRange: []
    },
  },
  {
    description: 'handles a GET when there are events for the user',
    makeRequest: app => request(app).get(`/events?userId=${userId}&since=1`),
    eventFileContents: [
      'new-todo	{"text":"abc"}',
      'edit-todo	{"id":"1","newText":"xyz"}',
      'toggle-todo	{"id":"1"}'
    ],
    expectResponseStatus: 200,
    expectResponseBody: {
      totalEvents: 3,
      eventsInRange: [
        { type: 'edit-todo', payload: { id: '1', newText: 'xyz' } },
        { type: 'toggle-todo', payload: { id: '1' } },
      ]
    },
  },
  {
    description: 'handles a successful POST',
    makeRequest: postEvent({ userId, command: { type: 'edit-todo', payload: { id: 'xyz', newText: 'cool' } } }),
    expectAppendedLine: 'edit-todo	{"id":"xyz","newText":"cool"}\n',
    expectResponseStatus: 204,
  },
  {
    description: '400s when a post has an invalid command',
    makeRequest: postEvent({ userId, command: { type: 'edit-todo', payload: { foo: 'bar' } } }),
    expectResponseStatus: 400,
  },
  {
    description: '400s when a post has no userId',
    makeRequest: postEvent({ command: { type: 'edit-todo', payload: { id: 'xyz', newText: 'cool' } } }),
    expectResponseStatus: 400,
  },
]

function createTest(testCase: TestCase): void {
  const { description, makeRequest, eventFileContents, expectAppendedLine, expectResponseStatus, expectResponseBody } = testCase

  it(description, async () => {
    const logger = stub().callsArg(2)

    const exists = stub()
    exists.withArgs(directory).returns(Promise.resolve(true))
    exists.withArgs(filepath).returns(Promise.resolve(!!eventFileContents))

    const readFile = eventFileContents
      ? stub().withArgs(filepath, 'utf8').returns(Promise.resolve(eventFileContents.join('\n')))
      : stub().throws()

    const appendFile = expectAppendedLine
      ? stub().withArgs(filepath, expectAppendedLine).returns(Promise.resolve())
      : stub().throws()

    const fs = { exists, readFile, appendFile, mkdirp: stub().throws(), writeFile: stub().throws() }

    const eventStore = await create({ logger, fs, directory })

    const response = await makeRequest(eventStore).catch(error => error.response)

    expect(response).to.have.status(expectResponseStatus)

    if (expectResponseBody) {
      expect(response.body).to.deep.equal(expectResponseBody)
    }
  })
}

describe('eventStore', () => testCases.forEach(createTest))
