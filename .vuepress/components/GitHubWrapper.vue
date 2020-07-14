<template>
    <div class="github-wrapper" ref='github_raw'>
        <slot/>
    </div>
</template>

<script>
    /**
     * 需要在README.md中使用的图片，由于GitHub会使用camo自动做代理，放在CDN上常无法被代理访问到
     * 但直接写GitHub的raw地址，在国内访问又经常被墙阻断，所以在.md文件中做一下地址转换，网站中用CDN，GitHub中用raw
     */
    export default {
        name: "GitHubWrapper",
        mounted() {
            const GIT_PREFIX = 'https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images'
            const ICYFENIX_CN = 'https://icyfenix.cn/images/'
            let raw = this.$refs.github_raw;
            let images = raw.querySelectorAll(`img[src^='${GIT_PREFIX}']`)
            images.forEach(i => {
                i.src = i.src.replace(GIT_PREFIX, ICYFENIX_CN)
            })
        }
    }
</script>

<style scoped>

</style>
