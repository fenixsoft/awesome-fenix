<template>
    <span v-if="type==='span'">{{globalWords}}</span>
    <Badge v-else :text="globalWordsText"></Badge>
</template>

<script>
    import Badge from '@vuepress/theme-default/global-components/Badge'

    // <span>{{globalWords}}</span>
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
            }
        }
    }
</script>

<style scoped>

</style>
