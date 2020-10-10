<template>
  <span v-if="type==='span'">{{globalWords}}</span>
  <SvgBadge v-else-if="type==='badge'" label="Words" :value="globalWords" :color="'#ff69b4'"/>
  <SvgBadge v-else-if="type==='updated'" label="Release" :value="'v1.0.'+updateDate.replace(/-/g, '')" :color="'#9cf'"/>
  <span v-else-if="type==='updatedText'">{{updateDate}}</span>
  <span v-else-if="type==='total'">{{totalPageRoot}}</span>
  <span v-else-if="type==='finish'">{{finishPage}}</span>
  <Badge v-else :text="globalWordsText"></Badge>
</template>

<script>
  import Badge from '@vuepress/theme-default/global-components/Badge'
  import SvgBadge from './SvgBadge.vue'

  const moment = require('moment')

  export default {
    name: "words",
    props: {
      chapter: String,
      type: String,
    },
    computed: {
      globalWords: function () {
        const statistics = this.$page.readingTime.globalWords;
        let words = 0;
        for (let key in statistics) {
          if (key.startsWith(this.chapter)) {
            words += statistics[key];
          }
        }
        return words.toLocaleString();
      },
      globalWordsText: function () {
        return '字数: ' + this.globalWords + ' 字'
      },
      updateDate: function () {
        let rootPage = this.$site.pages.find(p => p.path === '/')
        return rootPage.siteLastUpdated;
      },
      finishPage: function () {
        const statistics = this.$page.readingTime.globalWords;
        let page = 0;
        for (let key in statistics) {
          if (key.startsWith(this.chapter) && statistics[key] > 100) {
            page++
          }
        }
        return page;
      },
      totalPageRoot: function () {
        const totalPage = function (sidebar) {
          let page = 0;
          for (let key in sidebar) {
            let item = sidebar[key];
            if (typeof item === "object") {
              if (item.path) page++
              if (item.children) {
                page += totalPage(item.children)
              }
            } else {
              page++;
            }
          }
          return page;
        }
        return totalPage(this.$themeConfig.sidebar) + 2;
      },
    }
  }
</script>

<style scoped>

</style>
