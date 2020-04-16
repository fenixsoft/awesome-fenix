<template>
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" :width="imageWidth(ll+lv)"
         height="20">
        <linearGradient id="b" x2="0" y2="100%">
            <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
            <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
        <clipPath :id="'a'+imageWidth(ll+lv)">
            <rect :width="imageWidth(ll+lv)" height="20" rx="3" fill="#fff"/>
        </clipPath>
        <g :clip-path="'url(#a'+imageWidth(ll+lv)+')'">
            <path fill="#555" :d="d1()"/>
            <path :fill="color" :d="d2()"/>
            <path fill="url(#b)" :d="d3()"/>
        </g>
        <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
            <text :x="ll * 40 + 55" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)"
                  :textLength="ll * 80 - 10">{{label}}
            </text>
            <text :x="ll * 40 + 55" y="140" transform="scale(.1)" :textLength="ll * 80 - 10">
                {{label}}
            </text>
            <text :x="ll * 80 + lv * 40 + 125" y="150" fill="#010101" fill-opacity=".3"
                  transform="scale(.1)" :textLength="lv * 80 - 10">{{value}}
            </text>
            <text :x="ll * 80 + lv * 40 + 125" y="140" transform="scale(.1)"
                  :textLength="lv * 80 - 10">{{value}}
            </text>
        </g>
    </svg>
</template>

<script>
    export default {
        name: "SvgBadge",
        props: {
            label: String,
            value: String,
            color: String
        },
        computed: {
            ll: function () {
                return this.label.length - 1
            },
            lv: function () {
                return this.value.length - 1
            }
        },
        methods: {
            imageWidth: function (x) {
                return x * 8 + 18
            },
            // 含义：M偏移 0h宽度v20高度0z
            d1: function () {
                return 'M0 0h' + (this.ll * 8 + 9) + 'v20H0z'
            },
            d2: function () {
                return 'M' + (this.ll * 8 + 9) + ' 0h' + (this.lv * 8 + 9) + 'v20H' + (this.ll * 8 + 9) + 'z'
            },
            d3: function () {
                return 'M0 0h' + ((this.ll + this.lv) * 8 + 18) + 'v20H0z'
            }
        }
    }
</script>

<style scoped>

</style>
