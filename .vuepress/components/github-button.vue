<script>
    export default {
        name: 'github-button',
        props: ['href', 'ariaLabel', 'title', 'dataIcon', 'dataColorScheme', 'dataSize', 'dataShowCount', 'dataText'],
        render: function (h) {
            return h('span', [
                h('a', {
                    attrs: {
                        'href': this.href,
                        'aria-label': this.ariaLabel,
                        'title': this.title,
                        'data-icon': this.dataIcon,
                        'data-color-scheme': this.dataColorScheme,
                        'data-size': this.dataSize,
                        'data-show-count': this.dataShowCount,
                        'data-text': this.dataText
                    },
                    ref: '_'
                }, this.$slots.default)
            ])
        },
        mounted: function () {
            this.paint()
        },
        beforeUpdate: function () {
            this.reset()
        },
        updated: function () {
            this.paint()
        },
        beforeDestroy: function () {
            this.reset()
        },
        methods: {
            paint: function () {
                const _ = this.$el.appendChild(document.createElement('span'))
                const _this = this
                import(/* webpackMode: "eager" */ 'github-buttons').then(function (module) {
                    module.render(_.appendChild(_this.$refs._), function (el) {
                        try {
                            _.parentNode.replaceChild(el, _)
                        } catch (_) {
                        }
                    })
                })
            },
            reset: function () {
                this.$el.replaceChild(this.$refs._, this.$el.lastChild)
            }
        }
    }
</script>
