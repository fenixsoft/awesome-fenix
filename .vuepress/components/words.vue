<template>
    <span v-if="type==='span'">{{globalWords}}</span>
    <SvgBadge v-else-if="type==='badge'" label="Doc Words" :value="globalWords" :color="'#ff69b4'"/>
    <span v-else-if="type==='finish'">{{finishPage}}</span>
    <Badge v-else :text="globalWordsText"></Badge>
</template>

<script>
    import Badge from '@vuepress/theme-default/global-components/Badge'
    import SvgBadge from './SvgBadge.vue'

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
            finishPage: function () {
                const statistics = this.$page.readingTime.globalWords;
                let page = 0;
                for (let key in statistics) {
                    if (key.startsWith(this.chapter) && statistics[key] > 100) {
                        page++
                    }
                }
                return page;
            }
        }
    }
</script>

<style scoped>

</style>
