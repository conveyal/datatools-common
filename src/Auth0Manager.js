import fetch from 'isomorphic-fetch'

import UserPermissions from './UserPermissions'

class Auth0Manager {

  constructor (props) {
    this.props = props
    this.lock = new Auth0Lock(this.props.auth0ClientId, this.props.auth0Domain)
  }

  checkExistingLogin () {
    // Get the user token if we've saved it in localStorage before
    var userToken = localStorage.getItem('userToken')

    if(userToken) return this.loginFromToken(userToken)

    // check if we have returned from an SSO redirect
    var hash = this.lock.parseHash(window.location.hash)
    if (hash && hash.id_token) { // the user came back from the login (either SSO or regular login)
      // save the token
      localStorage.setItem('userToken', hash.id_token)

      // redirect to "targetUrl" if any
      window.location.href = hash.state || ''
    }
    else {
      // check if logged in elsewhere via SSO
      this.lock.$auth0.getSSOData((err, data) => {
        if (!err && data.sso) {
          // there is! redirect to Auth0 for SSO
          this.lock.$auth0.signin({
            callbackOnLocationHash: true
          })
        } else { // assume that we are not logged in
        }
      })
    }

    return null
  }

  loginFromToken (token) {
    return fetch('https://' + this.props.auth0Domain + '/tokeninfo?id_token=' + token, {
      method: 'post'
    }).then((res) => {
      if(res.status >= 400) { // check for bad response, generally an expired token
        // TODO: better handling of expired tokens
        this.logout()
      }
      return res.json()
    }).then((profile) => {
      return constructUserObj(token, profile)
    }).catch((err) => {
      console.log('error getting profile', err)
    })
  }

  loginViaLock () {
    return new Promise((resolve, reject) => {
      var lockOptions = {
        connections: ['Username-Password-Authentication']
      }
      if (this.props.logo) lockOptions.icon = this.props.logo
      this.lock.show(lockOptions, (err, profile, token) => {
        if (err) {
          console.log('Error w/ lock login', err)
          reject(err)
        }

        // save token to localStorage
        localStorage.setItem('userToken', token)

        this.setupSingleLogout()
        //this.userLoggedIn(token, profile)
        resolve(constructUserObj(token, profile))
      })
    })
  }

  logout () {
    localStorage.removeItem('userToken')
    window.location.replace('https://' + this.props.auth0Domain + '/v2/logout?returnTo=' + window.location.href)
  }

  resetPassword() {
    this.lock.showReset((err) => {
      if (!err) this.lock.hide()
    })
  }

  setupSingleLogout () {
    setInterval(() => {
      // if the token is not in local storage, there is nothing to check (i.e. the user is already logged out)
      if (!localStorage.getItem('userToken')) return

      this.lock.$auth0.getSSOData((err, data) => {
        // if there is still a session, do nothing
        if (err || (data && data.sso)) return

        // if we get here, it means there is no session on Auth0,
        // then remove the token and redirect to #login
        localStorage.removeItem('userToken')
        window.location.href = '/'
      })
    }, 5000)
  }
}

function constructUserObj (token, profile) {
  return {
    token,
    profile,
    permissions: new UserPermissions(profile.app_metadata.datatools)
  }
}

module.exports = Auth0Manager
