/**
 * Module dependencies.
 */

const auth = require('http-auth')
const bodyParser = require('body-parser')
const config = require('lib/config')
const certbotEndpoint = require('express-certbot-endpoint')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const l10n = require('lib/l10n')
const log = require('debug')('setup')
const nowww = require('nowww')
const jwt = require('lib/jwt')
const passport = require('passport')
const resolve = require('path').resolve
const sslRedirect = require('lib/server-factory/ssl-redirect')
const t = require('t-component')

/**
 * Expose `Setup`
 *
 * @api private
 */

module.exports = Setup

/**
 * Configs Express Application with
 * defaults configs
 */

function Setup (app) {

  /**
   * Set `production` settings
   */

  if ('production' === config.env) {
    // Log config settigs load
    log('production settings')

    /**
     * Set `nowww` middleware helper
     */

    app.use(nowww())

    /**
     * Set `native` express compression middleware
     */

    app.use(require('compression')())
  }

  /**
   * Set `common` settings
   */

  // Log config settigs load
  log('common settings')

  /**
   * Save config in app
   */

  app.set('config', config)

  /**
   * Basic HTTP-Auth restriction middleware
   * for production access only.
   */

  if (config.auth.basic && config.auth.basic.username && config.auth.basic.password) {
    const basic = auth({
      authRealm: 'Authentication required',
      authList: [config.auth.basic.username + ':' + config.auth.basic.password]
    })
    app.use(function (req, res, next) {
      basic.apply(req, res, function (username) {
        return next()
      })
    })
  }

  /**
   * Load endpoint for CertBot certificate validation
   */

  app.use(certbotEndpoint(config.certbot))

  /**
   * Set `public-assets` default path
   */

  app.use(express.static(resolve('public')))

  app.use(bodyParser.urlencoded())
  app.use(bodyParser.json())

  /**
   * Cross Origin Resource Sharing
   */

  const domains = config.corsDomains
  if (domains && domains.length) {
    var options
    if (domains.length === 1 && domains[0] === '*') {
      options = null
    } else {
      options = {
        origin: function (origin, callback) {
          const originIsWhitelisted = domains.indexOf(origin) !== -1
          callback(null, originIsWhitelisted)
        }
      }
    }
    app.use(cors(options))
  }

  /**
   * Use `passport` setup & helpers middleware
   */

  app.use(passport.initialize())

  /**
   * Configure native `express` cookie parser
   */

  app.use(cookieParser(config.jwtSecret))

  /**
   * JSON Web Tokens
   */

  app.use(jwt.middlewares.user())

  /**
   * Fetch user locale
   */

  app.use(l10n.middleware)

  /**
   * Set template local variables
   */

  app.use(function (req, res, next) {
    // Set user as local var if authenticated
    if (req.isAuthenticated() && req.user) res.locals.user = req.user

    res.locals.t = t

    // Call next middleware
    next()
  })

  /**
   * Ensure SSL redirection if necessary
   */

  sslRedirect(app, {
    protocol: config.protocol,
    https: config.https
  })

  /**
   * Use `twitter-card` and 'facebook-card' middlewares
   */

  app.use(require('lib/twitter-card/middleware'))
  app.use(require('lib/facebook-card/middleware'))
}
