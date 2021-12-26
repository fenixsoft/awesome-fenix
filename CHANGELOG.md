---
permalink: /changelog
---

# 更新日志

### 2021年12月25日

- 提供带目录版本的PDF：[下载地址](https://raw.githubusercontent.com/fenixsoft/awesome-fenix/gh-pages/pdf/the-fenix-project.pdf)
  - PDF目录生成的脚本由 [jerrylususu](https://github.com/jerrylususu) 提供，具体使用方式 [参见此处](https://github.com/fenixsoft/awesome-fenix/issues/286)。十分感谢。
  - 由于免费执行配额限制，9月份已停掉了流水线中生成PDF的部分，PDF每季度更新一次新版，如需生成最新的PDF可克隆后在本地进行。

### 2021年11月12日

- ArchSummit2021主题演讲：[从软件的历史看架构的未来](/tricks/2021/arch)

### 2021年9月8日

- 招聘&内推
  - 对大型软件架构、云原生、实时大数据、企业级软件研发感兴趣的同学，欢迎投简历至：felix.zhouzhiming[at]huawei[dot]com。
  - 团队气氛、水平都很好，对标范围华为18-22级，正编非OD。

### 2021年6月21日

- 更新了《[凤凰架构：构建可靠的大型分布式系统](/introduction/about-book.html)》的纸质书的[豆瓣评价](https://book.douban.com/subject/35492898/)，以及在[京东](https://search.jd.com/Search?keyword=%E5%87%A4%E5%87%B0%E6%9E%B6%E6%9E%84)、[当当](http://search.dangdang.com/?key=%B7%EF%BB%CB%BC%DC%B9%B9&)等网店的销售连接。
- 衷心感谢在本书撰写过程中，各位读者在本站的建议、意见、讨论、勘误指正与鼓励支持。

### 2021 年 6 月 17 日

- 发布一个开源项目：[Fenix-CLI](/tricks/2021/fenix-cli)
  - Fenix-CLI是一个云原生运行环境命令行客户端，目标是替代Kubernetes的`kubectl`、Docker的`docker cli`和Istio的`istioctl`命令行工具，提供具备一致性的、便捷的交互式的操作环境。
  - [https://github.com/fenixsoft/fenix-cli](https://github.com/fenixsoft/fenix-cli)

### 2021 年 5 月 24 日

- 增加了纸质书的[介绍页面](/introduction/about-book.html)

### 2021 年 4 月 9 日

- 为极客时间课程写的结语：[程序员之路](/tricks/2021/geekbang.html)

### 2021 年 3 月 17 日

- 看到[JetBrains Projector](https://blog.jetbrains.com/blog/2021/03/11/projector-is-out/)正式发布了，对于重度依赖轻薄本甚至是 Pad 做终端的开发人员来说，是 VSC Remote 外的另一个选择，正好在它的基础上做了个**一条命令**建立 OpenJDK 调试 IDE 的懒人包：
  - [OpenJDK with CLion 懒人包](/tricks/2021/openjdk-for-dummies/)
  - [https://github.com/fenixsoft/openjdk-for-dummies](https://github.com/fenixsoft/openjdk-for-dummies)

### 2021 年 2 月 24 日

- 修复了 Gitalk 无法登录留言的问题。</br>Gitalk 默认的 Github [CORS 代理](https://github.com/fenixsoft/cors-anywhere)不再免费提供服务了，目前使用[Heroku](https://www.heroku.com/)的免费 Dyno（一种 Serverless 实例）额度作为 CORS 代理，半个小时内没有访问会自动终止进程，冷启动需要一点时间，受此影响评论登录功能可能偶尔会有点慢。
- 实体书的编辑进度比想像中的慢，大概会在 4-5 月份才会出来。

### 2020 年 12 月 7 日

- QCon2020 主题演讲：[云原生时代，Java 的危与机](/tricks/2020/java-crisis/qcon.html)

### 2020 年 11 月 18 日

- 文档在极客时间上的音频公开课：[构建可靠的大型分布式系统](https://time.geekbang.org/opencourse/intro/100064201)。

### 2020 年 10 月 18 日

- 整部文档所有计划的内容均已完成，全文合计 <words type='span' chapter='/' /> 字。
- 预计文档的**音频版本**预计会在 11 月份[极客时间](https://time.geekbang.org/)中，以免费公益课程的形式公开，感谢极客邦的编辑及配音主播。
- 预计文档的**图书版本**预计会在 2021 年 5 月左右，由机械工业出版社出版。

### 2020 年 10 月 16 日

- 完成了“[透明通讯的涅槃](/immutable-infrastructure/mesh/communication.html)”章节。<br/>一年前，此文档刚开篇不久，我写下“[原始分布式时代](/architecture/architect-history/primitive-distribution.html)”和“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”就设想过要以这一篇去结尾。

### 2020 年 10 月 10 日

- 完成了“[资源与调度](/immutable-infrastructure/schedule/hardware-schedule.html)”章节

### 2020 年 10 月 7 日

- 完成了“[容器存储与生态](/immutable-infrastructure/storage/csi.html)”章节

### 2020 年 10 月 4 日

- 完成了“[Kubernetes 存储设计](/immutable-infrastructure/storage/storage-evolution.html)”章节

### 2020 年 9 月 28 日

- 完成了“[容器网络与生态](/immutable-infrastructure/network/cni.html)”章节
- 随着这篇文章的更新，整部文档超过了 30 万字，按计划应该在 35 万字以内结束。

### 2020 年 9 月 23 日

- 完成了“[Linux 网络虚拟化](/immutable-infrastructure/network/linux-vnet.html)”章节

### 2020 年 9 月 14 日

- 完成了“[应用为中心的封装](/immutable-infrastructure/container/application-centric.html)”章节

### 2020 年 9 月 10 日

- 完成了“[以容器构建系统](/immutable-infrastructure/container/container-build-system.html)”章节

### 2020 年 9 月 8 日

- 完成了“[虚拟化容器](/immutable-infrastructure/container/)”与“[容器的崛起](/immutable-infrastructure/container/history.html)”章节

### 2020 年 9 月 4 日

- 完成了“[聚合度量](/distribution/observability/metrics.html)”章节
- 目前到了 26 万字，整部文档所规划的框架里，只剩下介绍云原生的“不可变基础设施”这最后一大块了，希望今年内能全部写完。

### 2020 年 9 月 1 日

- 完成了“[事件日志](/distribution/observability/logging.html)”章节
- 完成了“[链路追踪](/distribution/observability/tracing.html)”章节

### 2020 年 8 月 29 日

- 完成了“[可观测性](/distribution/observability/)”章节

### 2020 年 8 月 27 日

写了几篇谈理论的务虚文章：

- [向微服务迈进](/methodology/forward-msa/)
  - [目的：微服务的驱动力](/methodology/forward-msa/objective.html)
  - [前提：微服务需要的条件](/methodology/forward-msa/prerequest.html)
  - [边界：微服务的粒度](/methodology/forward-msa/granularity.html)
  - [治理：理解系统复杂性](/methodology/forward-msa/governance.html)

### 2020 年 8 月 14 日

- 重写了事务处理中的“[本地事务](/architect-perspective/general-architecture/transaction/local.html)”一节。

### 2020 年 8 月 11 日

- 重写了安全架构中的“[认证](/architect-perspective/general-architecture/system-security/authentication.html)”一节。

### 2020 年 8 月 7 日

- 提供了新的架构演示“[AWS Lambda 为基础的无服务架构](/exploration/projects/serverless_arch)”。

### 2020 年 8 月 5 日

- 完成了“[缓存](/architect-perspective/general-architecture/diversion-system/cache-middleware.html)”章节。

### 2020 年 7 月 23 日

- 完成了“[服务安全](/distribution/secure/service-security.html)”章节。

### 2020 年 7 月 20 日

- 更新了[基于 Spring Cloud](/exploration/projects/microservice_arch_springcloud.html)和[基于 Istio](/exploration/projects/servicemesh_arch_istio.html)的 Fenix's Bookstore 的代码，提供了 RSA SHA256 的 JWT 令牌实现，以配合后面两节的主题。
- 完成了“[零信任网络](/distribution/secure/zero-trust.html)”章节。
- 这部文档的总字数在今天突破了 20 万字，留个纪念。

### 2020 年 7 月 13 日

- 完成“[流量控制](/distribution/traffic-management/traffic-control.html)”章节。

### 2020 年 7 月 8 日

- 完成“[服务容错](/distribution/traffic-management/failure.html)”章节。

### 2020 年 7 月 2 日

- 完成“[客户端负载均衡](/distribution/connect/load-balancing.html)”章节。

### 2020 年 6 月 29 日

- 完成“[网关路由](/distribution/connect/service-routing)”章节。

### 2020 年 6 月 18 日

- 重写了“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”章节。

### 2020 年 6 月 18 日

- [GraalVM](/tricks/graalvm/)增加了视频 PPT 讲解：[GraalVM——云原生时代的 Java](/tricks/graalvm/video)。<br/>正在与某知识服务商合作，未来本文档的主要内容会提供成音频稿。并且仍然会以公开课的性质免费提供。
- 更新了[服务架构演进史](/architecture/architect-history/)，大概增加了 40%的内容。

### 2020 年 6 月 13 日

- 提供了新的架构演示“[基于 Istio 实现的后端工程](/exploration/projects/servicemesh_arch_istio)”。

### 2020 年 5 月 25 日

- 提供了新的架构演示“[基于 Kubernetes 实现的后端工程](/exploration/projects/microservice_arch_kubernetes)”。

### 2020 年 5 月 15 日

- 完成“[服务发现](/distribution/service-discovery)”章节。

### 2020 年 5 月 9 日

- 完成“[分布式共识算法](/distribution/consensus/)”章节。

### 2020 年 5 月 5 日

- 创建更新日志页面。
- 在[目录](/summary/)中增加根据 Git 提交时间生成的内容更新标识。

### 2020 年 5 月 2 日

- 完成“[服务架构演进史](/architecture/architect-history/)”章节。
- 查了 Git 文档是在 2019 年 12 月 23 日创建的，今天在[微博](https://weibo.com/1887642490/J072HfNbO?from=page_1035051887642490_profile&wvr=6&mod=weibotime&type=comment)上开始小范围公开。

### 2019 年 12 月 23 日

- 此文档第一次 Git 提交：[Initialize repository](https://github.com/fenixsoft/awesome-fenix/commit/814cbb032a9377987503f08e8b6a3ea560419659)
