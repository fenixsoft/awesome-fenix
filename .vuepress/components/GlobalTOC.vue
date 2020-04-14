<template>
    <ol>
        <li v-for="page in items">
            <a :href="getLinks(page)" v-if="getLinks(page) != null"><span
                    :class="'level'+level">{{getTitle(page)}}</span></a>
            <span v-else :class="'level'+level">{{getTitle(page)}}</span>
            <span class="words">{{getWords(page)}}</span>
            <GlobalTOC :pages="page.children" :level="level + 1"/>
        </li>
    </ol>
</template>

<script>
    import {resolvePage} from '@parent-theme/util'

    export default {
        name: "GlobalTOC",
        data() {
            return {
                items: []
            }
        },
        props: ['pages', 'level'],
        created: function () {
            if (this.pages === '/') {
                this.items = this.$themeConfig.sidebar
            } else {
                this.items = this.pages;
            }
        },
        methods: {
            getTitle: function (item) {
                let res = ""
                if (item.title) {
                    res = item.title;
                } else {
                    res = resolvePage(this.$site.pages, item, this.$route.path).title
                }
                return res.replace('✔️ ', '')
            },
            getWords: function (item) {
                let page = null;
                if (item.path) {
                    page = resolvePage(this.$site.pages, item.path, this.$route.path)
                } else if (typeof (item) === 'string') {
                    page = resolvePage(this.$site.pages, item, this.$route.path)
                }
                if (page && page.readingTime) {
                    return `${page.readingTime.words.toLocaleString()} 字`
                } else {
                    return ""
                }
            },
            getLinks: function (item) {
                if (item.path) {
                    let page = resolvePage(this.$site.pages, item.path, this.$route.path)
                    return (page.readingTime && page.readingTime.words > 50) ? page.path : null
                } else if (typeof (item) === 'string') {
                    let page = resolvePage(this.$site.pages, item, this.$route.path)
                    return (page.readingTime && page.readingTime.words > 50) ? page.path : null
                } else {
                    return null;
                }
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
</style>
