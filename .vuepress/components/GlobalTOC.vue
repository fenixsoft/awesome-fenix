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
            }
        },
        methods: {
            getTitle: function (page) {
                try {
                    return page.title.replace('✔️ ', '')
                } catch (e) {
                    return "标题错误"
                }
            },
            getWords: function (page) {
                if (page && page.readingTime) {
                    return `${page.readingTime.words.toLocaleString()} 字`
                } else {
                    return ""
                }
            },
            getLinks: function (page) {
                return (page.readingTime && page.readingTime.words > 100) ? page.path : null
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
