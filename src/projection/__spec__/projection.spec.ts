import { expect, request } from 'chai'
import { stub } from 'sinon'
import create from '../create'


interface TestCase {
  it?: string
  when: string
  query?: string
  existingUserDirectory?: { metadataLines: string[], todoFileLines: string[] }
  expectedFirstClientRequest?: any,
  provideFirstClientResponse?: { totalEvents: number, eventsInRange: Command[] }
  expectedSecondClientRequest?: any,
  provideSecondClientResponse?: { totalEvents: number, eventsInRange: Command[] }
  expectedUserDirectoryWritten?: { metadataLines: string[], todoFileLines: string[] }
  expectedResponseStatus: number
  expectedResponseBody?: { undoable: boolean, redoable: boolean, todos: Todo[] }
  expectedResponseText?: string
  only?: boolean
}

const eventStoreUrl = 'http://eventStore.com'
const directory = 'someProjectionDir'
const route = '/todos'
const userId = 'jimbo'
const userDirectory = `${directory}/${userId}`
const userTodosFilepath = `${userDirectory}/todos`
const userMetadataFilepath = `${userDirectory}/metadata`

const expectedEventsQuery = (query: any) =>
  ({ url: `${eventStoreUrl}/events`, method: 'GET', json: true, qs: query })

const testCases: TestCase[] = [
  // {
  //   when: 'there is no query',
  //   expectedResponseStatus: 400,
  //   expectedResponseText: 'Query must include parameter "userId".',
  // },
  // {
  //   when: 'the query does not include a userId',
  //   query: `foo=bar`,
  //   expectedResponseStatus: 400,
  //   expectedResponseText: 'Query must include parameter "userId".',
  // },
  // {
  //   when: 'there are extraneous query parameters',
  //   query: `userId=${userId}&foo=bar`,
  //   expectedResponseStatus: 400,
  //   expectedResponseText: 'Query contains extraneous parameters. Query must only include parameter "userId".',
  // },
  // {
  //   it: 'writes a new projection file',
  //   when: 'there is no projection file yet for the user and there are new events for that user',
  //   query: `userId=${userId}`,
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 0 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: [
  //       { type: 'new-todo', payload: { text: 'foo' } },
  //       { type: 'new-todo', payload: { text: 'bar' } },
  //       { type: 'new-todo', payload: { text: 'baz' } },
  //       { type: 'toggle-todo', payload: { id: 1 } },
  //     ]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'foo', complete: true },
  //       { id: 2, text: 'bar', complete: false },
  //       { id: 3, text: 'baz', complete: false },
  //     ],
  //   }
  // },
  // {
  //   it: 'writes an updated projection directory',
  //   when: 'there is a projection directory for the user and there is a new event since the last event processed',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 4 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 5,
  //     eventsInRange: [
  //       { type: 'edit-todo', payload: { id: 1, newText: 'bing' } },
  //     ]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 5',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tbing',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'bing', complete: true },
  //       { id: 2, text: 'bar', complete: false },
  //       { id: 3, text: 'baz', complete: false },
  //     ],
  //   }
  // },
  // {
  //   it: "doesn't update the projection directory",
  //   when: 'there is a projection directory for the user and there are no new events since the last event processed',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 4 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: []
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'foo', complete: true },
  //       { id: 2, text: 'bar', complete: false },
  //       { id: 3, text: 'baz', complete: false },
  //     ]
  //   }
  // },
  // {
  //   when: 'the eventStore responds that the number of events is unequal to the total processed + the length of the events returned',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 4 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: [{ type: 'toggle-todo', payload: { id: 1 } }]
  //   },
  //   expectedResponseStatus: 500,
  //   expectedResponseText: 'Event Store response unexpected {"totalEvents":4,"eventsInRange":[{"type":"toggle-todo","payload":{"id":1}}]}',
  // },
  // {
  //   when: 'there is a metadata file for the user, but it is malformed because the totalEventsProcessed listed is not a number',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: abc',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       '○\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedResponseStatus: 500,
  //   expectedResponseText: 'Expected line 1 to match pattern /^totalEventsProcessed: (\\d+)$/. Found "totalEventsProcessed: abc".',
  // },
  // {
  //   when: 'there is a todos file for the user, but it is malformed because there is a todo without a symbol',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tfoo',
  //       'not-a-symbol\tbar',
  //       '○\tbaz',
  //     ],
  //   },
  //   expectedResponseStatus: 500,
  //   expectedResponseText: 'Expected line 2 to match pattern /^(✓|○)\t(.*)$/. Found "not-a-symbol\tbar".',
  // },
  // {
  //   it: 'writes a new, active todo',
  //   when: 'processing a new-todo event',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 2 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [{ type: 'new-todo', payload: { text: 'My New Todo' } }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //       '○\tMy New Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My Existing Todo', complete: true },
  //       { id: 2, text: 'My New Todo', complete: false },
  //     ]
  //   }
  // },
  // {
  //   it: 'deletes a todo',
  //   when: 'processing a delete-todo event',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 2 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [{ type: 'delete-todo', payload: { id: 1 } }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '--deleted--',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: []
  //   }
  // },
  // {
  //   it: 'edits the text of an existing todo',
  //   when: 'processing an edit-todo event',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 2 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [{ type: 'edit-todo', payload: { id: 1, newText: 'My Edited Todo' } }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Edited Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My Edited Todo', complete: true },
  //     ]
  //   }
  // },
  // {
  //   it: 'toggles a todo to active',
  //   when: 'processing a toggle-todo event for a completed todo',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 2 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [{ type: 'toggle-todo', payload: { id: 1 } }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy Existing Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My Existing Todo', complete: false },
  //     ]
  //   }
  // },
  // {
  //   it: 'toggles a todo to completed',
  //   when: 'processing a toggle-todo event for an active todo',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 3 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: [{ type: 'toggle-todo', payload: { id: 1 } }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy Existing Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My Existing Todo', complete: true },
  //     ]
  //   }
  // },
  // {
  //   it: 'toggles all todos to completed',
  //   when: 'processing a toggle-all event when there is at least one active todo',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy First Existing Todo',
  //       '○\tMy Second Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 2 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [{ type: 'toggle-all', payload: {} }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy First Existing Todo',
  //       '✓\tMy Second Existing Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My First Existing Todo', complete: true },
  //       { id: 2, text: 'My Second Existing Todo', complete: true },
  //     ]
  //   }
  // },
  // {
  //   it: 'toggles all todos to active',
  //   when: 'processing a toggle-all event when all todos are completed',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '✓\tMy First Existing Todo',
  //       '✓\tMy Second Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 3 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: [{ type: 'toggle-all', payload: {} }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy First Existing Todo',
  //       '○\tMy Second Existing Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My First Existing Todo', complete: false },
  //       { id: 2, text: 'My Second Existing Todo', complete: false },
  //     ]
  //   }
  // },
  // {
  //   it: 'clears all completed todos',
  //   when: 'processing a clear-completed event',
  //   query: `userId=${userId}`,
  //   existingUserDirectory: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy First Existing Todo',
  //       '✓\tMy Second Existing Todo',
  //     ],
  //   },
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 3 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 4,
  //     eventsInRange: [{ type: 'clear-completed', payload: {} }]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 4',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy First Existing Todo',
  //       '--deleted--',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My First Existing Todo', complete: false },
  //     ]
  //   }
  // },
  // {
  //   it: 'undoes the last action',
  //   when: 'processing an undo event',
  //   query: `userId=${userId}`,
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 0 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 2,
  //     eventsInRange: [
  //       { type: 'new-todo', payload: { text: 'My New Todo' } },
  //       { type: 'undo', payload: {} },
  //     ]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 2',
  //       'undoable: false',
  //       'redoable: true',
  //     ],
  //     todoFileLines: [],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: false,
  //     redoable: true,
  //     todos: []
  //   }
  // },
  // {
  //   it: 'redoes the last action',
  //   when: 'processing a redo event',
  //   query: `userId=${userId}`,
  //   expectedFirstClientRequest: expectedEventsQuery({ userId, since: 0 }),
  //   provideFirstClientResponse: {
  //     totalEvents: 3,
  //     eventsInRange: [
  //       { type: 'new-todo', payload: { text: 'My New Todo' } },
  //       { type: 'undo', payload: {} },
  //       { type: 'redo', payload: {} },
  //     ]
  //   },
  //   expectedUserDirectoryWritten: {
  //     metadataLines: [
  //       'totalEventsProcessed: 3',
  //       'undoable: true',
  //       'redoable: false',
  //     ],
  //     todoFileLines: [
  //       '○\tMy New Todo',
  //     ],
  //   },
  //   expectedResponseStatus: 200,
  //   expectedResponseBody: {
  //     undoable: true,
  //     redoable: false,
  //     todos: [
  //       { id: 1, text: 'My New Todo', complete: false },
  //     ]
  //   }
  // },
  {
    it: 'refetches all events and undoes the last action',
    when: 'processing an undo event when there is an existing projection',
    query: `userId=${userId}`,
    existingUserDirectory: {
      metadataLines: [
        'totalEventsProcessed: 3',
        'undoable: true',
        'redoable: false',
      ],
      todoFileLines: [
        '○\tMy First Existing Todo',
        '✓\tMy Second Existing Todo',
      ],
    },
    expectedFirstClientRequest: expectedEventsQuery({ userId, since: 3 }),
    provideFirstClientResponse: {
      totalEvents: 4,
      eventsInRange: [
        { type: 'undo', payload: {} },
      ]
    },
    expectedSecondClientRequest: expectedEventsQuery({ userId, since: 3 }),
    provideSecondClientResponse: {
      totalEvents: 4,
      eventsInRange: [
        { type: 'new-todo', payload: { text: 'My First Existing Todo' } },
        { type: 'new-todo', payload: { text: 'My Second Existing Todo' } },
        { type: 'toggle-todo', payload: { id: 2 } },
        { type: 'undo', payload: {} },
      ]
    },
    expectedUserDirectoryWritten: {
      metadataLines: [
        'totalEventsProcessed: 4',
        'undoable: true',
        'redoable: true',
      ],
      todoFileLines: [
        '○\tMy First Existing Todo',
        '○\tMy Second Existing Todo',
      ],
    },
    expectedResponseStatus: 200,
    expectedResponseBody: {
      undoable: true,
      redoable: true,
      todos: [
        { id: 1, text: 'My First Existing Todo', complete: false },
        { id: 2, text: 'My Second Existing Todo', complete: false },
      ]
    }
  },
]


function createTest(testCase: TestCase): void {
  const additionalDescription = testCase.it ? ` and ${testCase.it}` : ''

  const run = testCase.only ? it.only : it

  run(`sends ${testCase.expectedResponseStatus}${additionalDescription} on a GET at ${route} when ${testCase.when}`, async () => {

    const logger = stub().callsArg(2)

    const requestPromise = stub()

    if (testCase.expectedFirstClientRequest) {
      requestPromise.onFirstCall().returns(Promise.resolve(testCase.provideFirstClientResponse))
    }

    if (testCase.expectedSecondClientRequest) {
      requestPromise.onSecondCall().returns(Promise.resolve(testCase.provideSecondClientResponse))
    }

    const exists = stub()
    const readFile = stub()
    const writeFile = stub()
    const mkdirp = stub().returns(Promise.resolve())
    const appendFile = stub().throws(new Error('Should not get called as files are completely replaced by the projection'))

    exists.withArgs(directory).returns(Promise.resolve(true))
    exists.withArgs(userDirectory).returns(Promise.resolve(!!testCase.existingUserDirectory))

    if (testCase.existingUserDirectory) {
      readFile.withArgs(userMetadataFilepath, 'utf8').returns(Promise.resolve(testCase.existingUserDirectory.metadataLines.join('\n')))
      readFile.withArgs(userTodosFilepath, 'utf8').returns(Promise.resolve(testCase.existingUserDirectory.todoFileLines.join('\n')))
    }

    if (testCase.expectedUserDirectoryWritten) {
      writeFile.returns(Promise.resolve())
    } else {
      writeFile.throws()
    }

    const fs = { exists, readFile, writeFile, mkdirp, appendFile }

    const projection = await create({ logger, fs, directory, requestPromise, eventStoreUrl })

    const url = route + (testCase.query ? `?${testCase.query}` : '')

    const response = await request(projection).get(url).catch(error => error.response)

    expect(logger).to.have.been.calledOnce

    expect(response).to.have.status(testCase.expectedResponseStatus)

    if (testCase.expectedFirstClientRequest) {
      expect(requestPromise.firstCall.args[0]).to.deep.equal(testCase.expectedFirstClientRequest)
    }

    if (testCase.expectedSecondClientRequest) {
      expect(requestPromise.firstCall.args[0]).to.deep.equal(testCase.expectedSecondClientRequest)
    }

    if (testCase.expectedUserDirectoryWritten) {
      expect(writeFile).to.have.been.calledTwice

      expect(writeFile).to.have.been
        .calledWithExactly(userMetadataFilepath, testCase.expectedUserDirectoryWritten.metadataLines.join('\n'), 'utf8')

      expect(writeFile).to.have.been
        .calledWithExactly(userTodosFilepath, testCase.expectedUserDirectoryWritten.todoFileLines.join('\n'), 'utf8')
    }

    if (testCase.expectedResponseBody) {
      expect(response).to.have.property('body').that.deep.equals(testCase.expectedResponseBody)
    }

    if (testCase.expectedResponseText) {
      expect(response).to.have.property('text', testCase.expectedResponseText)
    }
  })
}


describe.only('projection', () => testCases.forEach(createTest))
