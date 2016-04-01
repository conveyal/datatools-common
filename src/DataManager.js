import fetch from 'isomorphic-fetch'

export default class DataManager {
  constructor (props) {
    this.props = props
  }

  getProjectsAndFeeds (user) {
    var getProjects = fetch(this.props.managerUrl + '/api/manager/secure/project', {
      headers: { 'Authorization': 'Bearer ' + user.token }
    }).then((res) => { return res.json() })

    var getFeedSources = fetch(this.props.managerUrl + '/api/manager/secure/feedsource', {
      headers: { 'Authorization': 'Bearer ' + user.token }
    }).then((res) => { return res.json() })

    return Promise.all([getProjects, getFeedSources]).then((results) => {
      let projects = results[0]
      var projectLookup = {}
      for (var project of projects) {
        projectLookup[project.id] = project
        project.feeds = []
      }

      // populate project-level feed arrays
      for (var feed of results[1]) {
        projectLookup[feed.feedCollection.id].feeds.push(feed)
      }

      return projects
    }).catch((err) => {
      console.error(err)
      console.error(err.stack)
    })
  }
}
