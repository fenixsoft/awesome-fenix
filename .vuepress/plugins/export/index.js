const puppeteer = require('puppeteer')
const PDFMerge = require('easy-pdf-merge')
const {join} = require('path')
const {dev} = require('vuepress')
const {PDFDocument} = require('pdf-lib');
const {execSync} = require("child_process");
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
    let {pages, tempPath, vuepressDir, siteConfig} = ctx
    const tempDir = join(tempPath, 'pdf')
    const pdfDir = vuepressDir + '/dist/pdf'
    const sidebar = ctx.siteConfig.themeConfig.sidebar
    const res = [findPage(pages, '/')]
    const pdfTOCIndent = '    ';
    flatten(sidebar, res)

    function removePathSuffix(url) {
        url = url.toLowerCase();
        url = url.replace(/\.md$/, "");
        url = url.replace(/\.html$/, "");
        return url.replace(/\/$/, "");
    }

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

    const browser = await puppeteer.launch({headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox',
             '--single-process', '--no-zygote', '--disable-dev-shm-usage']
    });
    const browserPage = await browser.newPage();
    logger.info("Exporting pages...");

    let PDFPageCount = 1;
    const exportPageInfoMap = {};
    for (let i = 0; i < exportPages.length; i++) {
        let {
            location,
            site,
            path: pagePath,
            url,
            title
        } = exportPages[i]

        await browserPage.goto(
            location,
            {
                waitUntil: 'networkidle0',
                timeout: 0
            }
        )

        // 将所有本地http://localhost的链接替换为网站的
        const scriptToInject = `Array.from(document.querySelectorAll("a[href]")).filter(i=>i.hostname=='localhost').forEach(i=>{i.href="https://icyfenix.cn"+i.pathname});`;
        await browserPage.evaluate(scriptText => {
            const el = document.createElement('script');
            el.type = 'text/javascript';
            el.textContent = scriptText;
            document.body.parentElement.appendChild(el);
        }, scriptToInject);

        if (url === "/") {
            title = "凤凰架构"
        }

        const buffer = await browserPage.pdf({
            path: pagePath,
            format: 'A4',
            displayHeaderFooter: (url !== "/"),
            headerTemplate: `<div style='width:100%; margin: 0 22px 0 22px; padding-right:12px; border-bottom: 1px solid #eaecef; text-align:right; font-size: 8px; line-height: 18px; font-family: "Microsoft YaHei"; color: #AAA'>${title}<div style='float:left; padding-left:12px'><a href="https://icyfenix.cn" style="color: #AAA;text-decoration: none;">https://icyfenix.cn</a></div></div>`,
            footerTemplate: "<span></span>",
            margin: {left: '0mm', top: '20mm', right: '0mm', bottom: '15mm'}
        })
        const pdfDoc = await PDFDocument.load(buffer);
        const pdfCurrCount = pdfDoc.getPages().length;
        exportPageInfoMap[removePathSuffix(url)] = {'title': title, 'page': PDFPageCount};
        PDFPageCount += pdfCurrCount;
        logger.success(
            `Generated ${yellow(title)} via ${gray(url)}`
        )
    }

    let PDFTOC = '';
    function gen_toc_line(title, url, level) {
        const pageInfo = exportPageInfoMap[removePathSuffix(url)];
        if (!title ) {
            title = pageInfo['title'];
        }
        return `${pdfTOCIndent.repeat(level)}"${title}" ${pageInfo['page'].toString()}\n`
    }

    function get_first_children_path(items) {
        if (items.length > 0) {
            if (items[0].path) {
              return items[0].path;
            } else if (items[0].children instanceof Array) {
                return get_first_children_path(items[0].children);
            } else {
              return items[0];
            }
        } else {
            return null;
        }
    }

    function flatten_toc(items, res, level) {
        for (let i = 0, l = items.length; i < l; i++) {
            if (items[i].children instanceof Array) {
                let itemPath = items[i].path;
                if (!itemPath) {
                    itemPath = get_first_children_path(items[i].children || []);
                }
                PDFTOC += gen_toc_line(items[i].title, itemPath, level);
                flatten_toc(items[i].children || [], res, level+1);
            } else if (items[i].path) {
                PDFTOC += gen_toc_line(items[i].title, items[i].path, level);
            } else {
                PDFTOC += gen_toc_line(null, items[i], level);
            }
        }
    }
    flatten_toc(sidebar, res, 0)
    fs.writeFileSync(pdfDir + "/toc.txt", PDFTOC);

    // Merge PDF files
    const files = exportPages.map(({path}) => path)
    const outputBasename = 'the-fenix-project'
    const outputTOCBasename = `${outputBasename}_toc`
    const outputFile = `${pdfDir}/${outputBasename}.pdf`
    const outputTOCFile = `${pdfDir}/${outputTOCBasename}.pdf`

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
                logger.success(`Merge ${yellow(`${i} to ${i + _files.length}`)} file!`)
                resolve()
            })
        })
    }

    logger.success(`Exported ${yellow(outputFile)} file!`);

    logger.info(`Generating new PDF file with TOC...`);
    var opts = { cwd: pdfDir }
    try {
      execSync(`pdftocio -o ${outputTOCBasename}.pdf ${outputBasename}.pdf < toc.txt`, opts)
    } catch (error) {
      logger.error(`Failed append TOC: ${error.message}`);
      logger.error(`Python lib 'pdf.tocgen' is required for this, please execute:`);
      logger.error(`'pip install -U pdf.tocgen' to install`);
    }
    logger.success(`Generated ${yellow(outputTOCFile)} file!`);

    await browser.close()
    fs.removeSync(tempDir)
}


