<template>
    <ol>
        <li v-for="page in items">
            <span :class="'level'+level">{{getTitle(page)}}</span>
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
                if (item.children) {
                    return "";
                } else {
                    try {
                        let page = resolvePage(this.$site.pages, item, this.$route.path)
                        return `${page.readingTime.words.toLocaleString()} 字`
                    } catch (e) {
                        this.items = [];
                    }
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
