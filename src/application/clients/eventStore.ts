type Dependencies = { eventStoreUrl: Url, requestPromise: RequestPromise }


export default ({ eventStoreUrl, requestPromise }: Dependencies) => ({
  async saveCommand(userId: UserId, command: Command): Promise<any> {
    return requestPromise({
      url: `${eventStoreUrl}/events`,
      method: 'POST',
      json: true,
      body: { userId, command }
    })
  }
})
