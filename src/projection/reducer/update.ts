const updateProjection = (projection: TodosProjection) => (command: Command) => {
  switch (command.type) {
    case 'new-todo': {
      projection.textLookup.push(command.payload.text)
      return
    }

    case 'delete-todo': {
      const index = command.payload.id - 1
      projection.textLookup[index] = undefined
      projection.completed.delete(index)
      return
    }

    case 'edit-todo': {
      const { id, newText } = command.payload
      const index = id - 1

      if (!projection.textLookup[index]) {
        throw new Error(`No todo with id: ${id}`)
      }

      projection.textLookup[index] = newText
      return
    }

    case 'toggle-todo': {
      const { id } = command.payload
      const index = id - 1

      if (projection.completed.has(index)) {
        projection.completed.delete(index)
      } else if (projection.textLookup[index]) {
        projection.completed.add(index)
      } else {
        throw new Error(`No todo with id: ${id}`)
      }
      return
    }

    case 'toggle-all': {
      if (projection.textLookup.length !== projection.completed.size) {
        for (const index of projection.textLookup.keys()) {
          projection.completed.add(index)
        }
      } else {
        projection.completed.clear()
      }
      return
    }

    case 'clear-completed': {
      for (const index of projection.completed) {
        projection.textLookup[index] = undefined
      }
      projection.completed.clear()
      return
    }
  }
}

export default (projection: TodosProjection, commands: Command[]): void => {
  commands.forEach(updateProjection(projection))
}
