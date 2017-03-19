/**
 * Module Dependencies
 */

import debug from 'debug'
import o from 'component-dom'
import page from 'page'
import t from 't-component'
import title from '../../title/title'
import Notifications from './view'
import notificationsStore from '../../stores/notification-store/notification-store'

/**
 * Constants definition
 */

const log = debug('democracyos:notifications')

page('/notifications', notificationsMiddleware, (ctx, next) => {
  o(document.body).addClass('notifications-page')
  // Update page's title
  title(t('notifications.title'))

  // Empty container and render form
  const notifications = new Notifications(ctx.notifications)
  notifications.replace('#content')

  notifications.find('table tr').on('click', function () {
    const url = o(this).attr('data-url')
    page(url)
  })
})

function notificationsMiddleware (ctx, next) {
  notificationsStore
    .findAll()
    .then((notifications) => {
      ctx.notifications = notifications
      next()
    })
    .catch((err) => {
      if (err.status !== 404) throw err
      log(`Unable to load notifications for user ${ctx.user}`)
    })
}
