<template>
    <span class="only-for-printer" style="padding-top:300px">
        <br/>周志明
        <br/>icyfenix@gmail.com
        <br/>发行日期：{{updateDate}}
    </span>
</template>

<script>
    export default {
        name: "PublishInfos",
        computed: {
            updateDate: function () {
                let rootPage = this.$site.pages.find(p => p.path === '/')
                return rootPage.siteLastUpdated;
            },
        }
    }
</script>

<style scoped>

</style>
