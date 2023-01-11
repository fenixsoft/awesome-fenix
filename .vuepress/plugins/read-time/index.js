const filepath = require('path')
const spawn = require('cross-spawn')
const moment = require('moment')

const globalWords = {};

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
        globalWords[regularPath] = words

        $page.readingTime = {
            words,
            minutes: words / 500,
            globalWords
        }

        function getGitLastUpdatedTimeStamp(filePath) {
            let lastUpdated
            try {
                lastUpdated = parseInt(spawn.sync(
                    'git',
                    ['log', '-1', '--format=%at', filepath.basename(filePath)],
                    {cwd: filepath.dirname(filePath)}
                ).stdout.toString('utf-8')) * 1000
            } catch (e) {
                console.error(e)
            }
            return lastUpdated
        }

        if (path === '/') {
            const timestamp = getGitLastUpdatedTimeStamp(".")
            // 受不了各个npm和浏览器版本实现不一致的问题，改用moment格式化
            // const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            // new Date(timestamp).toLocaleDateString('zh', options);
            if (timestamp) {
                $page.siteLastUpdated = moment(new Date(timestamp)).format('YYYY-MM-DD');
                console.error("编译日期：" + $page.siteLastUpdated)
            } else {
                $page.siteLastUpdated = moment().format('YYYY-MM-DD');
                console.error("GIT获取更新时间出错，采用默认时间")
            }

            // 由于README.md会显示在GitHub上，设置frontmatter不好看，改为这里进行
            frontmatter.title = "凤凰架构：构建可靠的大型分布式系统"
            frontmatter.comment = false
            frontmatter.pageClass = "index-page-class"
        }
        return $page
    }
})

