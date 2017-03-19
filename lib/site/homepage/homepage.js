import debug from 'debug'
import page from 'page'
import dom from 'component-dom'
import { domRender } from '../../render/render'
import user from '../../user/user'
import urlBuilder from '../../url-builder/url-builder'
import { loadCurrentForum } from '../../forum/forum'
import checkReservedNames from '../../forum/check-reserved-names'
import createFirstTopic from './create-first-topic.jade'
import visibility from '../../visibility/visibility'
import forumRouter from '../../forum-router/forum-router'
import { findTopics, clearTopicStore } from '../../middlewares/topic-middlewares/topic-middlewares'
import topicStore from '../../stores/topic-store/topic-store'
import topicFilter from '../topic-filter/topic-filter'
import title from '../../title/title'
import { show as showTopic, exit as exitTopic } from '../topic/topic'
import noTopics from './no-topics.jade'

const log = debug('democracyos:homepage')

function initHomepage (ctx, next) {
  document.body.classList.add('browser-page')
  dom('#browser .app-content, #content').empty()
  next()
}

page(forumRouter('/'),
  checkReservedNames,
  initHomepage,
  loadCurrentForum,
  clearTopicStore,
  user.optional,
  visibility,
  findTopics,
  (ctx) => {
    ctx.topic = topicFilter.filter(ctx.topics)[0]

    if (!ctx.topic) {
      let content = dom('#browser .app-content')
      content.append(domRender(noTopics))

      if (ctx.forum && ctx.forum.privileges.canChangeTopics) {
        content.append(domRender(createFirstTopic, {
          url: urlBuilder.admin(ctx.forum) + '/topics/create'
        }))
      }
      return
    }

    title(ctx.forum ? ctx.forum.title : null)

    log(`render topic ${ctx.topic.id}`)

    topicStore.findOne(ctx.topic.id).then((topic) => {
      showTopic(topic, ctx.forum)
    })
  }
)

page.exit(forumRouter('/'), (ctx, next) => {
  if (ctx.topic) {
    exitTopic(ctx, next)
  } else {
    document.body.classList.remove('browser-page')
    next()
  }
})
