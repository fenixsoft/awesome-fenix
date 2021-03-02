<template>
  <footer class="page-edit">
    <div v-if="editLink" class="edit-link">
      <a :href="editLink" target="_blank" rel="noopener noreferrer">{{ editLinkText }}</a>
      <OutboundLink/>
    </div>
    <div class="git-hub-star" v-if="showGitStar">
      <span class="prefix" v-if="pageWords > 0">
        Kudos to
        <github-button href="https://github.com/fenixsoft/awesome-fenix" data-icon="octicon-star" data-show-count="true"
                       aria-label="Star fenixsoft/awesome-fenix on GitHub"
                       style="position: relative; top: 4px; right: -4px;">
        Star
      </github-button>

      </span>
    </div>
    <div v-if="lastUpdated" class="last-updated" v-if="showGitStar">
      <span class="prefix" v-if="pageWords > 0">总字数:</span>
      <span class="words" v-if="pageWords > 0">{{ pageWords.toLocaleString() }}</span>
      <span class="prefix" v-if="pageWords > 0">字　</span>
      <span class="prefix">{{ lastUpdatedText }}:</span>
      <span class="time">{{ lastUpdated }}</span>
    </div>
  </footer>
</template>

<script>
  import isNil from 'lodash/isNil'
  import {endingSlashRE, outboundRE} from '@parent-theme/util'

  export default {
    name: 'PageEdit',

    computed: {
      lastUpdated() {
        return this.$page.lastUpdated
      },

      pageWords() {
        if (this.$page.readingTime && this.$page.readingTime.words)
          return this.$page.readingTime.words
        else
          return 0
      },

      lastUpdatedText() {
        if (typeof this.$themeLocaleConfig.lastUpdated === 'string') {
          return this.$themeLocaleConfig.lastUpdated
        }
        if (typeof this.$site.themeConfig.lastUpdated === 'string') {
          return this.$site.themeConfig.lastUpdated
        }
        return 'Last Updated'
      },

      editLink() {
        const showEditLink = isNil(this.$page.frontmatter.editLink)
          ? this.$site.themeConfig.editLinks
          : this.$page.frontmatter.editLink

        const {
          repo,
          docsDir = '',
          docsBranch = 'master',
          docsRepo = repo
        } = this.$site.themeConfig

        if (showEditLink && docsRepo && this.$page.relativePath) {
          return this.createEditLink(
            repo,
            docsRepo,
            docsDir,
            docsBranch,
            this.$page.relativePath
          )
        }
        return null
      },

      showGitStar() {
        return !this.$frontmatter.githubStar && this.$frontmatter.githubStar !== false
      },

      editLinkText() {
        return (
          this.$themeLocaleConfig.editLinkText
          || this.$site.themeConfig.editLinkText
          || `Edit this page`
        )
      }
    },

    methods: {
      createEditLink(repo, docsRepo, docsDir, docsBranch, path) {
        const bitbucket = /bitbucket.org/
        if (bitbucket.test(repo)) {
          const base = outboundRE.test(docsRepo) ? docsRepo : repo
          return (
            base.replace(endingSlashRE, '')
            + `/src`
            + `/${docsBranch}/`
            + (docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '')
            + path
            + `?mode=edit&spa=0&at=${docsBranch}&fileviewer=file-view-default`
          )
        }

        const base = outboundRE.test(docsRepo)
          ? docsRepo
          : `https://github.com/${docsRepo}`
        return (
          base.replace(endingSlashRE, '')
          + `/edit`
          + `/${docsBranch}/`
          + (docsDir ? docsDir.replace(endingSlashRE, '') + '/' : '')
          + path
        )
      }
    }
  }
</script>

<style lang="stylus">
  @require '../styles/wrapper.styl'

  .page-edit
    @extend $wrapper
    padding-top 1rem
    padding-bottom 1rem
    overflow auto

    .git-hub-star
      display inline-block
      font-weight 400
      color lighten($textColor, 25%)

    .edit-link
      display inline-block

      a
        color lighten($textColor, 25%)
        margin-right 0.25rem

    .last-updated
      float right
      font-size 0.9em

      .prefix
        font-weight 500
        color lighten($textColor, 25%)

      .time
        font-weight 400
        color #aaa

      .words
        font-weight 400
        color #aaa

  @media (max-width: $MQMobile)
    .page-edit
      .edit-link
        margin-bottom 0.5rem

      .last-updated
        font-size 0.8em
        float none
        text-align left

</style>
