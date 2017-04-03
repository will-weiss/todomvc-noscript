type Dependencies = { eventStoreUrl: Url, requestPromise: Function }


export interface ProjectionEventStoreClient {
  readEventsSince(userId: UserId, since?: EventIndex): Promise<any>
}


export default ({ eventStoreUrl, requestPromise }: Dependencies): ProjectionEventStoreClient => ({
  async readEventsSince(userId, since): Promise<any> {
    const query = since == null ? { userId } : { userId, since }

    return requestPromise({
      url: `${eventStoreUrl}/events`,
      method: 'GET',
      json: true,
      qs: query
    })
  }
})
