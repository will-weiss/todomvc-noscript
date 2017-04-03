type Dependencies = { projectionUrl: Url, requestPromise: RequestPromise }


export default ({ projectionUrl, requestPromise }: Dependencies) => ({
  async readProjection(userId: UserId): Promise<any> {
    return requestPromise({
      url: `${projectionUrl}/todos`,
      method: 'GET',
      json: true,
      qs: { userId }
    })
  }
})
