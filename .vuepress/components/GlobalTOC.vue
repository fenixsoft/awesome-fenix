<template>
    <ol>
        <li v-for="page in items">
            <span>{{getTitle(page)}}</span>
            <span class="words">{{getWords(page)}}</span>
            <GlobalTOC :pages="page.children"/>
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
        props: ['pages'],
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
                return res.replace('✅ ', '')
            },
            getWords: function (item) {
                if (item.children) {
                    return "";
                } else {
                    let page = resolvePage(this.$site.pages, item, this.$route.path)
                    return `${page.readingTime.words.toLocaleString()} 字`
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
    }

    .words {
        font-size: 14px;
        color: #999;
        float: right;
    }
</style>
