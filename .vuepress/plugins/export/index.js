const puppeteer = require('puppeteer')
const PDFMerge = require('easy-pdf-merge')
const {join} = require('path')
const {dev} = require('vuepress')
const {fs, logger, chalk} = require('@vuepress/shared-utils')
const {red, yellow, gray} = chalk

// Keep silent before running custom command.
logger.setOptions({logLevel: 1})

module.exports = (opts = {}, ctx) => ({
    name: 'vuepress-plugin-export',

    chainWebpack(config) {
        config.plugins.delete('bar')
        // TODO vuepress should give plugin the ability to remove this plugin
        config.plugins.delete('vuepress-log')
    },

    extendCli(cli) {
        cli
            .command('export [targetDir]', 'export current vuepress site to a PDF file')
            .allowUnknownOptions()
            .action(async (dir = '.') => {
                dir = join(process.cwd(), dir)
                try {
                    const nCtx = await dev({
                        sourceDir: dir,
                        clearScreen: false,
                        theme: opts.theme || '@vuepress/default'
                    })
                    logger.setOptions({logLevel: 3})
                    logger.info(`Start to generate current site to PDF ...`)
                    try {
                        await generatePDF(ctx, nCtx.devProcess.port, nCtx.devProcess.host)
                    } catch (error) {
                        console.error(red(error))
                    }
                    nCtx.devProcess.server.close()
                    process.exit(0)
                } catch (e) {
                    throw e
                }
            })
    }
})

async function generatePDF(ctx, port, host) {
    let {pages, tempPath, siteConfig} = ctx
    const tempDir = join(tempPath, 'pdf')

    const sidebar = ctx.siteConfig.themeConfig.sidebar
    const res = [pages[0]]
    flatten(sidebar, res)

    function flatten(items, res) {
        for (let i = 0, l = items.length; i < l; i++) {
            if (items[i].children instanceof Array) {
                items[i].path && res.push(findPage(pages, items[i].path))
                flatten(items[i].children || [], res)
            } else if (items[i].path) {
                res.push(findPage(pages, items[i].path))
            } else {
                res.push(findPage(pages, items[i]))
            }
        }
    }

    function findPage(pages, path) {
        let desPath = path.toLowerCase()
        desPath = desPath.endsWith("/") ? desPath.substr(0, desPath.length - 1) : desPath
        desPath = desPath.endsWith(".md") ? desPath.substr(0, desPath.length - 3) : desPath
        return pages.find(e => {
            let srcPath = e.path.toLowerCase()
            srcPath = srcPath.endsWith("/") ? srcPath.substr(0, srcPath.length - 1) : srcPath
            srcPath = srcPath.endsWith(".html") ? srcPath.substr(0, srcPath.length - 5) : srcPath
            return desPath == srcPath
        })
    }

    pages = res;
    fs.ensureDirSync(tempDir)

    const exportPages = pages.map(page => {
        return {
            url: page.path,
            title: page.title,
            site: `http://${host}:${port}`,
            location: `http://${host}:${port}${page.path}`,
            path: `${tempDir}/${page.key}.pdf`
        }
    })

    const browser = await puppeteer.launch()
    const browserPage = await browser.newPage()

    if (false) {

        for (let i = 0; i < exportPages.length; i++) {
            const {
                location,
                site,
                path: pagePath,
                url,
                title
            } = exportPages[i]

            await browserPage.goto(
                location,
                {waitUntil: 'networkidle2'}
            )

            await browserPage.pdf({
                path: pagePath,
                format: 'A4',
                displayHeaderFooter: true,
                headerTemplate: `<div style='width:100%; margin: 0 22px 0 22px; padding-right:12px; border-bottom: 1px solid #eaecef; text-align:right; font-size: 8px; line-height: 18px; font-family: "Microsoft YaHei"; color: #AAA'>${title}<div style='float:left; padding-left:12px'>https://icyfenix.cn</div></div>`,
                footerTemplate: "<span></span>",
                margin: {left: '0mm', top: '20mm', right: '0mm', bottom: '15mm'}
            })

            logger.success(
                `Generated ${yellow(title)} ${gray(`${url}`)}`
            )
        }

    }

    const files = exportPages.map(({path}) => path)
    const outputFilename = siteConfig.title || 'site'
    const outputFile = `${outputFilename}.pdf`

    // 文件太多超过了命令行最大长度，改为10个一组多次合并
    for (let i = 0; i < files.length; i += 10) {
        let _files;
        if (i === 0) {
            _files = files.slice(i, i + 10)
        } else {
            _files = [outputFile, ...files.slice(i, i + 10)]
        }
        await new Promise(resolve => {
            PDFMerge(_files, outputFile, err => {
                if (err) {
                    throw err
                }
                logger.success(`Merge ${yellow(`${i} to ${i + _files.length }`)} file!`)
                resolve()
            })
        })
    }
    logger.success(`Export ${yellow(outputFile)} file!`)


    await browser.close()
    fs.removeSync(tempDir)
}


