<GitHubWrapper>
<p align="center">
	<br/>
  <a href="https://icyfenix.cn" target="_blank">
    <img width="180" src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/logo-color.png" alt="logo">
  </a>
</p>

<TitleInfos />

<p align="center" class="print-break">
	<GithubInfos />
    <a href="https://icyfenix.cn" style="display:inline-block"><words type='updated' /></a>
    <a href="https://travis-ci.com/fenixsoft/awesome-fenix" target="_blank" style="display:inline-block" class="not-print"><img src="https://api.travis-ci.com/fenixsoft/awesome-fenix.svg?branch=master" alt="Travis-CI"></a>
    <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/License-Apache.svg" alt="License"></a>
    <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/DocLicense-CC-red.svg" alt="Document License"></a>
    <a href="/summary/"  style="display:inline-block"><words type='badge' chapter='/'/></a>
    <a href="https://icyfenix.cn/introduction/about-me.html" target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/Author-IcyFenix-blue.svg" alt="About Author"></a>
	<PublishInfos />
</p>
</GitHubWrapper>


## 这是什么？

这是一部以“如何构建一套可靠的分布式大型软件系统”为叙事主线的开源文档，是一幅帮助开发人员整理现代软件架构各条分支中繁多知识点的技能地图。文章《<a href="https://icyfenix.cn/introduction/about-the-fenix-project.html">什么是“凤凰架构”</a>》详细阐述了这部文档的主旨、目标与名字的来由，文章《<a href="https://icyfenix.cn/exploration/guide/quick-start.html">如何开始</a>》简述了文档每章讨论的主要话题与内容详略分布，供阅前参考。

笔者出于以下目的，撰写这部文档：

- 笔者从事大型企业级软件的架构研发工作，借此机会，系统性地整理自己的知识，查缺补漏，将它们都融入既有的知识框架之中。
- 笔者正式出版的前七本计算机技术书籍都不是与自己本职工作直接相关，能按照自己的兴趣去写作，还能获得不菲的经济报酬是一件很快乐的事情；而撰写一部工作中能直接使用的、能随时更新、与人交流的在线文档，同样也是一件很实用、很有价值的事情。
- 笔者认为技术人员成长有一“捷径”，学技术不仅要去看、去读、去想、去用，更要去说、去写。将自己“认为掌握了的”知识叙述出来，能够说得有条理清晰，讲得理直气壮；能够让他人听得明白，释去心中疑惑；能够把自己的观点交予别人的审视，乃至质疑，在此过程之中，会挖掘出很多潜藏在“已知”背后的“未知”。未有知而不行者，知而不行，只是未知。

除文档部分外，笔者同时还建立了若干配套的代码工程，这是针对不同架构、技术方案（如单体架构、微服务、服务网格、无服务架构，等等）的演示程序。它们既是文档中所述知识的实践示例，亦可作为实际项目新创建时的可参考引用的基础代码。

<p align="center" style="display:none" tips="view only in GitHub README.md">
<img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/sshot-index.png" >
</p>

## 如何使用？

根据“使用”的所指含义的不同，笔者列举以下几种情况：

- **在线阅读**：本文档在线阅读地址为：[https://icyfenix.cn](https://icyfenix.cn)。<br/>网站由 [GitHub Pages](https://pages.github.com/) 提供网站存储空间；由 [Travis-CI](https://travis-ci.com/fenixsoft/awesome-fenix) 提供的持续集成服务实时把 Git 仓库的 Markdown 文档编译同步至网站，并推送至 CDN，提供国内的访问加速。

- **离线阅读**：

  - 部署离线站点：文档基于 [Vuepress](https://vuepress.vuejs.org/zh/) 构建，如你希望在企业内部搭建文档站点，请使用如下命令：

    ```bash
    # 克隆获取源码
    $ git clone https://github.com/fenixsoft/awesome-fenix.git && cd awesome-fenix

    # 安装工程依赖
    $ npm install

    # 运行网站，地址默认为http://localhost:8080
    $ npm run dev
    ```

  - 生成PDF文件：工程源码中已带有基于 [vuepress-plugin-export](https://github.com/ulivz/vuepress-plugin-export) 改造（针对本文档定制过）的PDF导出插件，如你希望生成全文 PDF 文件，请在已进行上一步工程克隆和依赖安装的前提下使用如下命令：

    ```bash
    # 编译PDF，结果将输出在网站根目录
    $ npm run export
    ```
    PDF 全文编译时间较长，在笔者机器上约耗时25分钟，在 Travis-CI 上约需要约8分钟，可以从在[这里下载](https://raw.githubusercontent.com/fenixsoft/awesome-fenix/gh-pages/pdf/the-fenix-project.pdf)更新时由 Travis-CI 自动编译的PDF。PDF 中文字体采用阿里巴巴普惠字体渲染，此字体被允许免费使用与传播。

- **二次演绎、传播和发行**：本文档中所有的内容，如引用其他资料，均在文档中明确列出资料来源，一切权利归属原作者。除此以外的所有内容，包括但不限于文字、图片、表格，等等，均属笔者原创，这些原创内容，笔者声明以[知识共享署名 4.0](http://creativecommons.org/licenses/by/4.0/)发行，只要遵循许可协议条款中**署名**、**非商业性使用**、**相同方式共享**的条件，你可以在任何地方、以任何形式、向任何人使用、修改、演绎、传播本文档中任何部分的内容。详细可见本文档的“协议”一节。

- **运行技术演示工程**：笔者专门在探索起步中的“<a href="https://icyfenix.cn/exploration/projects/">技术演示工程</a>”详细介绍了配套工程的使用方法，如果你对构建运行环境也有所疑问，在附录中的“<a href="https://icyfenix.cn/appendix/deployment-env-setup/">环境依赖</a>”部分也已包括了详细的环境搭建步骤。此外，这些配套工程也均有使用 Travis-CI 提供的持续集成服务，自动输出到 Docker 镜像库，如果你只关心运行效果，或只想了解部分运维方面的知识，可以直接运行 Docker 镜像而无需关心代码部分。你可以通过下面所列的地址，查看到本文档所有工程代码和在线演示的地址：

  - 文档工程：
    - 凤凰架构：[https://icyfenix.cn](https://icyfenix.cn)
    - Vuepress 支持的文档工程：[https://github.com/fenixsoft/awesome-fenix](https://github.com/fenixsoft/awesome-fenix)
  - 前端工程：
    - Mock.js 支持的纯前端演示：[https://bookstore.icyfenix.cn](https://bookstore.icyfenix.cn)
    - Vue.js 2实现前端工程：[https://github.com/fenixsoft/fenix-bookstore-frontend](https://github.com/fenixsoft/fenix-bookstore-frontend)
  - 后端工程：
    - Spring Boot 实现单体架构：[https://github.com/fenixsoft/monolithic_arch_springboot](https://github.com/fenixsoft/monolithic_arch_springboot)
    - Spring Cloud 实现微服务架构：[https://github.com/fenixsoft/microservice_arch_springcloud](https://github.com/fenixsoft/microservice_arch_springcloud)
    - Kubernetes 为基础设施的微服务架构：[https://github.com/fenixsoft/microservice_arch_kubernetes](https://github.com/fenixsoft/microservice_arch_kubernetes)
    - Istio 为基础设施的服务网格架构：[https://github.com/fenixsoft/servicemesh_arch_istio](https://github.com/fenixsoft/servicemesh_arch_istio)
    - AWS Lambda 为基础的无服务架构：[https://github.com/fenixsoft/serverless_arch_awslambda](https://github.com/fenixsoft/serverless_arch_awslambda)



## 协议

- 本作品代码部分采用 [Apache 2.0协议](https://www.apache.org/licenses/LICENSE-2.0)进行许可。遵循许可的前提下，你可以自由地对代码进行修改，再发布，可以将代码用作商业用途。但要求你：
  - **署名**：在原有代码和衍生代码中，保留原作者署名及代码来源信息。
  - **保留许可证**：在原有代码和衍生代码中，保留Apache 2.0协议文件。

- 本作品文档部分采用[知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/)进行许可。 遵循许可的前提下，你可以自由地共享，包括在任何媒介上以任何形式复制、发行本作品，亦可以自由地演绎、修改、转换或以本作品为基础进行二次创作。但要求你：
  - **署名**：应在使用本文档的全部或部分内容时候，注明原作者及来源信息。
  - **非商业性使用**：不得用于商业出版或其他任何带有商业性质的行为。如需商业使用，请联系作者。
  - **相同方式共享的条件**：在本文档基础上演绎、修改的作品，应当继续以知识共享署名 4.0国际许可协议进行许可。

<div style="padding-top: 20px" class="not-print">
	<h2 id="备案">备案</h2>
	<p>网站备案信息：<a href="http://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">粤ICP备18088957号</a></p>
</div>
