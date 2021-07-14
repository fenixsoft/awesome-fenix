<template>
  <div>
    <!-- div v-if="level===0" class="updateInfo not-print">
      标记显示出
      <select style="height: 23px;" v-model="updateDays">
        <option value="0" selected>当天</option>
        <option value="3">3天</option>
        <option value="7">7天</option>
        <option value="30">1月</option>
        <option value="180">半年</option>
        <option value="99999">全部</option>
      </select>
      内更新的内容
    </div -->
    <ol>
      <li v-for="page in information">
        <span v-if="page.links != null">
          <a :href="page.links">
            <span :class="'level'+level">{{page.title}}</span>
          </a>
          <div class="not-print" style="display: inline-block">
            <badge type="error" v-if="checkUpdate(page)">
                {{page.update === 0 ? '当天更新': page.update+'天前更新'}}
            </badge>
          </div>
          <span class="words">{{page.words}}</span>
        </span>
        <span v-else :class="'level'+level">
          {{page.title}}
          <span class="words">{{page.words}}</span>
        </span>
        <GlobalTOC v-if="showDays === undefined" :pages="page.children" :level="level + 1" :showDays="updateDays"/>
        <GlobalTOC v-else :pages="page.children" :level="level + 1" :showDays="showDays"/>
      </li>
    </ol>
  </div>
</template>

<script>
  import Badge from '@vuepress/theme-default/global-components/Badge'
  import moment from 'moment'

  import {resolvePage} from '@parent-theme/util'

  export default {
    name: "GlobalTOC",
    data() {
      return {
        updateDays: 0,
        items: [],
        information: []
      }
    },
    props: ['pages', 'level', 'showDays'],
    created: function () {
      if (this.pages) {
        let origin = (this.pages === '/' ? this.$themeConfig.sidebar : this.pages);
        this.items = origin.map(item => {
          let page
          if (item.path) {
            page = resolvePage(this.$site.pages, item.path, this.$route.path)
          } else if (typeof (item) === 'string') {
            page = resolvePage(this.$site.pages, item, this.$route.path)
          } else {
            page = item;
          }
          page.children = item.children
          return page;
        })
        this.information = this.items.map(item => {
          return {
            title: this.getTitle(item),
            words: this.getWords(item),
            links: this.getLinks(item),
            update: this.getUpdate(item),
            lastUpdated: item.lastUpdated,
            children: item.children
          }
        })
      }
    },
    methods: {
      checkUpdate: function (page) {
        return false
        //return page.update <= Math.max(this.updateDays, this.showDays);
      },
      getTitle: function (page) {
        try {
          return page.title.replace('✔️ ', '')
        } catch (e) {
          return "标题错误"
        }
      },
      getWords: function (page) {
        if (page && page.readingTime) {
          return `${page.readingTime.words.toLocaleString()} 字　`
        } else {
          return ""
        }
      },
      getLinks: function (page) {
        return (page.readingTime && page.readingTime.words > 100) ? page.path : null
      },
      getUpdate: function (page) {
        let lastDay = new moment(page.lastUpdated, 'L');
        return Math.floor(-1 * moment.duration(lastDay.diff(new Date())).asDays())
      }
    }
  }
</script>

<style scoped>
  ol {
    padding: 0 0 0 20px;
    margin: 0;
    list-style: none;
    counter-reset: a;
  }

  li:before {
    counter-increment: a;
    content: counters(a, ".") ". ";
    line-height: 35px;
  }

  .words {
    font-size: 14px;
    color: #999;
    float: right;
  }

  .level0 {
    font-size: 17px;
    line-height: 44px;
    font-weight: bold;
  }

  .updateInfo {
    text-align: right;
    margin: 0 10px 20px 0;
    color: #666;
    font-size: 14px;
  }
</style>
