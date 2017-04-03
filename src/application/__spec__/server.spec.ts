import { expect, request } from 'chai'
import { Request, Handler } from 'express'
import { stub } from 'sinon'
import { random, sample, range } from 'lodash'
import uuid = require('uuid')
import { load } from 'cheerio'
import server from '../server'


describe('server', () => {

  describe('routing', () => {

    const sendOkIf = (expectation: (req: Request) => void): Handler => (req, res) => {
      expectation(req)
      res.send('OK')
    }

    type RoutingTestCase = {
      method: 'get' | 'post'
      route: string
      status: number
      stubbedHandlers: Partial<{ getPage: Handler, postCommand: Handler }>
    }

    const testCases: RoutingTestCase[] = [
      {
        method: 'get',
        route: '/',
        status: 200,
        stubbedHandlers: { getPage: sendOkIf(req => expect(req.params.visibilityFilter).to.equal(undefined)) }
      },
      {
        method: 'get',
        route: '/all',
        status: 200,
        stubbedHandlers: { getPage: sendOkIf(req => expect(req.params.visibilityFilter).to.equal('all')) }
      },
      {
        method: 'get',
        route: '/active',
        status: 200,
        stubbedHandlers: { getPage: sendOkIf(req => expect(req.params.visibilityFilter).to.equal('active')) }
      },
      {
        method: 'get',
        route: '/completed',
        status: 200,
        stubbedHandlers: { getPage: sendOkIf(req => expect(req.params.visibilityFilter).to.equal('completed')) }
      },
      {
        method: 'get',
        route: '/foo',
        status: 404,
        stubbedHandlers: {}
      },
      {
        method: 'post',
        route: '/',
        status: 404,
        stubbedHandlers: {}
      },
      {
        method: 'post',
        route: '/new-todo',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('new-todo')) }
      },
      {
        method: 'post',
        route: '/delete-todo',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('delete-todo')) }
      },
      {
        method: 'post',
        route: '/edit-todo',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('edit-todo')) }
      },
      {
        method: 'post',
        route: '/toggle-todo',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('toggle-todo')) }
      },
      {
        method: 'post',
        route: '/toggle-all',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('toggle-all')) }
      },
      {
        method: 'post',
        route: '/clear-completed',
        status: 200,
        stubbedHandlers: { postCommand: sendOkIf(req => expect(req.params.command).to.equal('clear-completed')) }
      },
      {
        method: 'post',
        route: '/foo',
        status: 404,
        stubbedHandlers: {}
      },
    ]

    testCases.forEach(({ status, method, stubbedHandlers, route }) => {

      const ok = (status === 200)

      const description = ok
        ? `responds to a ${method.toUpperCase()} at ${route}`
        : `${status}s to a ${method.toUpperCase()} at ${route}`

      it(description, async () => {
        const sessions = stub().callsArg(2)
        const logger = stub().callsArg(2)

        const handlers = { getPage: stub().throws(), postCommand: stub().throws(), ...stubbedHandlers }

        const app = server({ logger, sessions, ...handlers })

        const response = await request(app)[method](route).catch(err => err)

        expect(sessions).to.have.been.calledOnce
        expect(logger).to.have.been.calledOnce

        if (ok) expect(response).property('text', 'OK')
        expect(response).to.have.property('status', status)
      })
    })
  })

  describe('view', () => {

    let templateData: any
    let $: CheerioStatic

    const randomTemplateData = () => {
      const [showingAll, showingActive, showingCompleted] = [false, false, false].splice(random(3), 1, true)
      const itemsLeft = random(5)
      const oneLeft = itemsLeft === 1
      const anyTodos = sample([true, false])
      const anyComplete = sample([true, false])

      const visibleTodos = range(random(100))
        .map(() => ({
          id: uuid(),
          text: uuid(),
          complete: sample([true, false])
        }))

      return { visibleTodos, itemsLeft, oneLeft, anyTodos, anyComplete, showingAll, showingActive, showingCompleted }
    }

    beforeEach(async () => {
      const sessions = stub().callsArg(2)
      const logger = stub().callsArg(2)

      const handlers = { getPage: stub().throws(), postCommand: stub().throws() }

      templateData = randomTemplateData()

      const app = server({ logger, sessions, ...handlers })
        .get('/mock-render', (req, res) => res.render('index', templateData))

      const response = await request(app).get('/mock-render') as ChaiHttp.Response & { text: string }

      expect(sessions).to.have.been.calledOnce
      expect(logger).to.have.been.calledOnce
      expect(response.type).to.equal('text/html')

      $ = load(response.text)
    })

    const thereIsOne = (selector: string) => expect($(selector)).to.have.length(1)

    describe('meta', () => {
      it('has name="viewport"', () => thereIsOne('meta[name="viewport"]'))
    })

    describe('styles', () => {
      it('has main.css', () => thereIsOne('link[rel="stylesheet"][href="main.css"]'))
      it('has todos.css', () => thereIsOne('link[rel="stylesheet"][href="todos.css"]'))
      it('has override.css', () => thereIsOne('link[rel="stylesheet"][href="override.css"]'))
    })

    describe('dialog.modal', () => {

      const modalSelector = (id: string) =>
        'dialog.modal[tabindex="-1"][role="dialog"]#edit-todo-' + id

      const editFormSelector = (id: string) =>
        modalSelector(id) + ' > .modal__box > form[action="/edit-todo"][method="post"]'

      const hiddenIdSelector = (id: string) =>
        editFormSelector(id) + ` > input.hide[name="id"][value="${id}"]`

      const newTextSelector = (id: string, text: string) =>
        editFormSelector(id) + ` > input.edit[required][value="${text}"][name="newText"][maxlength="50"][pattern="[A-Za-z]{1,50}"]`

      const hiddenSubmitSelector = (id: string) =>
        editFormSelector(id) + ' > input.hide[type="submit"]'

      it('has an edit modal for each visible todo', () => {
        for (const { id, text } of templateData.visibleTodos) {
          thereIsOne(modalSelector(id))
        }
      })

      it('each modal has a form to post to /edit-todo', () => {
        for (const { id, text } of templateData.visibleTodos) {
          thereIsOne(editFormSelector(id))
        }
      })

      it('each form has a hidden id field with the id of the todo', () => {
        for (const { id, text } of templateData.visibleTodos) {
          thereIsOne(hiddenIdSelector(id))
        }
      })

      it('each form has a required field for the new text which starts with the previous text of the todo', () => {
        for (const { id, text } of templateData.visibleTodos) {
          thereIsOne(newTextSelector(id, text))
        }
      })

      it('each form has a hidden field to submit', () => {
        for (const { id, text } of templateData.visibleTodos) {
          thereIsOne(hiddenSubmitSelector(id))
        }
      })
    })

    describe('.todoapp', () => {

      const todoappSelector = '.todoapp'

      describe('header', () => {
        const headerSelector = todoappSelector + ' > header.header'

        describe('h1', () => {
          it('has text "todos"', () =>
            expect($(headerSelector + ' > h1').text()).to.equal('todos'))
        })

        describe('form.new-todo', () => {
          const newTodoFormSelector = headerSelector +
            ' > form[action="/new-todo"][method="post"]'

          const newTodoInputSelector = newTodoFormSelector +
            ' > input.new-todo[required][name="text"][placeholder="What needs to be done?"][maxlength="50"][pattern="[A-Za-z]{1,50}"][autofocus]'

          it('posts to /new-todo', () =>
            thereIsOne(newTodoFormSelector))

          it('has a required input field for the text', () => 
            thereIsOne(newTodoInputSelector))
        })
      })

      describe('section.main', () => {
        describe('form.toggle-all', () => {
          it('posts to /toggle-all')
          it('has a label')
          it('has a submit button')
        })

        describe('ul.todo-list > li', () => {

          it('has a completed class if and only if the todo is completed')

          describe('.view', () => {
            describe('form.toggle-todo', () => {
              it('posts to /toggle-todo')
              it('has a hidden field with the id')
              it('has a submit field')
            })

            describe('a.btn', () => {
              it('links to the edit todo modal for that todo')
            })

            describe('form.delete-todo', () => {
              it('posts to /delete-todo')
              it('has a hidden field with the id')
              it('has a submit button')
            })
          })
        })
      })

      describe('footer', () => {
        describe('span.todo-count', () => {
          it('has text for the number of items')
        })

        describe('ul.filters > li', () => {
          describe('a#all-link', () => {
            it('links to /')
            it('has the selected class if showing all todos')
          })

          describe('a#active-link', () => {
            it('links to /')
            it('has the selected class if showing active todos')
          })

          describe('a#completed-link', () => {
            it('links to /completed')
            it('has the selected class if showing completed todos')
          })
        })
      })
    })
  })
})
