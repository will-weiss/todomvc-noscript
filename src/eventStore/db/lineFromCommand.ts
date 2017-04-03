export default ({ type, payload }: Command) =>
  type + '\t' + JSON.stringify(payload) + '\n'
