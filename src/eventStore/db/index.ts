import { join } from 'path'
import eventsFromFile from './eventsFromFile'
import lineFromCommand from './lineFromCommand'


interface Dependencies {
  directory: Directory
  fs: FileSystem
}

export default async ({ fs, directory }: Dependencies) => {

  if (!await fs.exists(directory)) {
    await fs.mkdirp(directory)
  }

  return { readEventsSince, saveEvent }

  async function readContentsFor(userId: UserId): Promise<string | false> {
    const filepath = join(directory, userId)
    return (await fs.exists(filepath) && fs.readFile(filepath, 'utf8'))
  }

  async function appendContentsFor(userId: UserId, contents: FileContents): Promise<void> {
    const filepath = join(directory, userId)
    await fs.appendFile(filepath, contents, 'utf8')
  }

  async function readEventsSince(userId: UserId, since: EventIndex): Promise<EventsSinceQueryResult> {
    const fileContents = (await readContentsFor(userId)) || ''
    const events = eventsFromFile(fileContents)
    const eventsInRange = events.filter((event, index) => index >= since)
    return { eventsInRange, totalEvents: events.length }
  }

  async function saveEvent(userId: UserId, command: Command): Promise<void> {
    const line = lineFromCommand(command)
    await appendContentsFor(userId, line)
  }
}
