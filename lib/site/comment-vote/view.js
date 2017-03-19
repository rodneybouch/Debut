import t from 't-component'
import debug from 'debug'
import user from '../../user/user.js'
import request from '../../request/request.js'
import View from '../../view/view.js'
import template from './template.jade'

let log = debug('democracyos:comment-vote')

export default class CommentVote extends View {

  constructor (options = {}) {
    super(template)
    // Posible values: 'upvote','downvote','unvote'
    this.$_status = ''
    this.$_count = 0

    this.options = options
    this.options.canComment = this.options.canComment || false
    this.comment = this.options.comment
    this.upvoteButton = this.find('.vote.up')
    this.downvoteButton = this.find('.vote.down')
    this.counter = this.find('.counter')

    //Calculate the current comment scoring
    this.count(this.comment.upvotes.length - this.comment.downvotes.length)

    if (this.voted(this.comment.upvotes)) {
      this.status('upvote')
    }

    if (this.voted(this.comment.downvotes)) {
      this.status('downvote')
    }
  }

  /**
   * Turn on event bindings
   * called when inserted to DOM
   */

  switchOn () {
    this.bind('click', '.up', 'onUpVote')
    this.bind('click', '.down', 'onDownVote')
  }

  voted (collection) {
    return !!~collection.map((v) => v.author).indexOf(user.id)
  }

  validate () {
    if (!user.logged()) {
      this.loginRequired()
      return false
    } else if (this.comment.author.id === user.id) {
      this.error(t('comments.score.not-allowed'))
      return false
    } else if (!this.options.canComment) {
      this.error(t('comments.score.not-allowed'))
      return false
    }

    // Clean up the error container
    this.emit('message', '')
    return true
  }

  onUpVote (ev) {
    ev.preventDefault()

    if (this.validate()) {
      if (this.status() !== 'upvote') {
        this.vote('upvote')
        if (this.status() === 'downvote') {
          this.count(2) // up 2 times
        } else {
          this.count(1)
        }
        this.status('upvote')
        this.track('upvote')
      } else {
        this.vote('unvote')
        this.count(-1)
        this.status('unvote')
        this.track('unvote')
      }
    }
  }

  onDownVote (ev) {
    ev.preventDefault()

    if (this.validate()) {
      if (this.status() !== 'downvote') {
        this.vote('downvote')

        if (this.status() === 'upvote') {
          this.count(-2) // down 2 times
        } else {
          this.count(-1)
        }
        this.status('downvote')
        this.track('downvote')
      } else {
        this.vote('unvote')
        this.count(1)
        this.status('unvote')
        this.track('unvote')
      }
    }
  }

  track (event) {
    window.analytics.track(`${event} comment`, {
      comment: this.comment.id
    })
  }

  error (error) {
    this.emit('error', error)
  }

  loginRequired () {
    this.emit('loginrequired')
  }

  /**
   * Add or subtract the value on the current count.
   * Update dom element with the current value.
   * @param {Number} value
   */

  count (value) {
    if (arguments.length === 0) {
      return this.$_count
    }

    this.$_count += value
    this.counter.text(this.$_count)
  }

  status (status) {
    if (arguments.length === 0) {
      return this.$_status
    }

    this.$_status = status
    this.upvoteButton.removeClass('selected')
    this.downvoteButton.removeClass('selected')

    if (status === 'upvote') {
      this.upvoteButton.addClass('selected')
    }
    if (status === 'downvote') {
      this.downvoteButton.addClass('selected')
    }
  }

  /**
   * Call the api to update the vote comment .
   */

  vote (voting) {
    var self = this

    request
      .post(this.url(voting))
      .end((err, res) => {
        if (err || !res) {
          log('Fetch error: %s', err)
          return
        }

        if (res.status === 401) {
          self.error(t(res.body.error))
          return
        }

        if (!res.ok) {
          log('Fetch error: %s', res.error)
          return
        }

        if (res.body && res.body.error) {
          log('Fetch response error: %s', res.body.error)
          return
        }

        log('successfull %s %s', voting, self.comment.id)
      })
  }

  url (voting) {
    return '/api/comment/:id/:voting'
      .replace(':id', this.comment.id)
      .replace(':voting', voting)
  }
}
