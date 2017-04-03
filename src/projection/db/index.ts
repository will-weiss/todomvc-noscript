import { join } from 'path'
import contentsFromProjection from './contentsFromProjection'
import projectionFromContents from './projectionFromContents'


type Dependencies = {
  directory: Directory
  fs: FileSystem
}

type UserDirectoryContents = { metadata: FileContents, todos: FileContents }


export default async ({ fs, directory }: Dependencies) => {

  if (!await fs.exists(directory)) {
    await fs.mkdirp(directory)
  }

  return { readProjection, writeProjection }

  async function readContentsFor(userId: UserId): Promise<false | UserDirectoryContents> {
    const userDirectory = join(directory, userId)
    const metadataFilepath = join(userDirectory, 'metadata')
    const todosFilepath = join(userDirectory, 'todos')

    const dirExists = fs.exists(userDirectory)
    const metadata = fs.readFile(metadataFilepath, 'utf8')
    const todos = fs.readFile(todosFilepath, 'utf8')

    return (await dirExists && { metadata: await metadata, todos: await todos })
  }

  async function writeContentsFor(userId: UserId, contents: UserDirectoryContents): Promise<void> {
    const userDirectory = join(directory, userId)
    const metadataFilepath = join(userDirectory, 'metadata')
    const todosFilepath = join(userDirectory, 'todos')
    await fs.mkdirp(userDirectory)
    await Promise.all([
      fs.writeFile(metadataFilepath, contents.metadata, 'utf8'),
      fs.writeFile(todosFilepath, contents.todos, 'utf8'),
    ])
  }

  async function readProjection(userId: UserId): Promise<WholeProjection | undefined> {
    const fileContents = await readContentsFor(userId)
    return fileContents ? projectionFromContents(fileContents) : undefined
  }

  async function writeProjection(userId: UserId, projection: WholeProjection): Promise<void> {
    const contents = contentsFromProjection(projection)
    await writeContentsFor(userId, contents)
  }
}
