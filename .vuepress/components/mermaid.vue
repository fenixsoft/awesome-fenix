<template>
    <div class="mermaid">
        <slot></slot>
    </div>
</template>

<script>
    export default {
        mounted() {
            import("mermaid/dist/mermaid").then(m => {
                let config = {
                    startOnLoad: true,
                    theme: "neutral",
                    sequence: {showSequenceNumbers: true},
                };
                m.initialize(config);
                m.init();
            });
        }
    };
</script>

<style>
    .mermaid {
        text-align: center;
        font-size: 14px;
        margin-bottom: -25px;
    }

    .edgeLabel {
        font-size: 12px !important;
        background-color: #fff !important;
    }
</style>
