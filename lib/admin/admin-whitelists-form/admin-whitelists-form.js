import FormView from './form-view'
import debug from 'debug'
import page from 'page'
import request from '../../request/request'
import forumRouter from '../../forum-router/forum-router'
import { privileges } from '../../middlewares/forum-middlewares/forum-middlewares'

const log = debug('democracyos:admin-whitelists-form')

page(forumRouter('/admin/users/create'), privileges('canEdit'), function (ctx, next) {
  var form = new FormView()
  form.replace('.admin-content')
})

page(forumRouter('/admin/users/:id'), privileges('canEdit'), load, function (ctx, next) {
  var form = new FormView(ctx.whitelist)
  form.replace('.admin-content')
})

/**
 * Load specific whitelist from context params
 */

function load (ctx, next) {
  request
    .get('/api/whitelists/' + ctx.params.id)
    .end(function (err, res) {
      if (err || !res.ok) {
        var message = 'Unable to load whitelists for ' + ctx.params.id
        return log(message)
      }

      ctx.whitelist = res.body
      return next()
    })
}
