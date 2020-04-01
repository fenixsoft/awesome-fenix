const readingTime = require('reading-time')

module.exports = (options = {}) => ({
    extendPageData($page) {
        const {
            regularPath,
            path,
            frontmatter,
            _strippedContent
        } = $page

        if (!_strippedContent) {
            return $page
        }

        if (frontmatter && frontmatter.readingTime) {
            $page.readingTime = frontmatter.readingTime
            return $page
        }

        const excludePage = options.excludes && options.excludes.some(p => {
            const testRegex = new RegExp(p)
            return testRegex.test(path) || testRegex.test(regularPath)
        })

        if (excludePage) {
            return $page
        }

        function fnGetCpmisWords(str) {
            sLen = 0;
            try {
                //先将回车换行符做特殊处理
                str = str.replace(/(\r\n+|\s+|　+)/g, "龘");
                //处理英文字符数字，连续字母、数字、英文符号视为一个单词
                str = str.replace(/[\x00-\xff]/g, "m");
                //合并字符m，连续字母、数字、英文符号视为一个单词
                str = str.replace(/m+/g, "*");
                //去掉回车换行符
                str = str.replace(/龘+/g, "");
                //返回字数
                sLen = str.length;
            } catch (e) {

            }
            return sLen;
        }

        var words = fnGetCpmisWords(_strippedContent);

        $page.readingTime = {
            words,
            minutes: words / 500
        }

        return $page
    }
})

