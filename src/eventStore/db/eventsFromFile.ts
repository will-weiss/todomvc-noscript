import { isCommand } from '../../types'


export default (fileContents: string): Command[] =>
  fileContents.split('\n')
    .filter(line => line)
    .map(line => {
      const eventMatch = line.match(/^(.*)\t({.*})$/)
      if (!eventMatch) throw new Error(`Could not interpret line as command: ${line}`)
      const [type, payloadJSON] = eventMatch.slice(1)
      const payload = JSON.parse(payloadJSON)
      const command = { type, payload }
      if (isCommand(command)) return command
      throw new Error(`Could not interpret line as command: ${line}`)
    })
