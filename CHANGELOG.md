---
permalink: /changelog
---

# 更新日志

### 2021年3月17日

- 看到[JetBrains Projector](https://blog.jetbrains.com/blog/2021/03/11/projector-is-out/)正式发布了，对于重度依赖轻薄本甚至是Pad做终端的开发人员来说，是VSC Remote外的另一个选择。我在它的基础上做了个**一条命令**建立OpenJDK调试IDE的懒人包：
  - [OpenJDK with CLion懒人包](/tricks/2021/openjdk-for-dummies/)
  - [https://github.com/fenixsoft/openjdk-for-dummies](https://github.com/fenixsoft/openjdk-for-dummies)

### 2021年2月24日

- 修复了Gitalk无法登录留言的问题。</br>Gitalk默认的Github [CORS代理](https://github.com/fenixsoft/cors-anywhere)不再免费提供服务了，目前使用[Heroku](https://www.heroku.com/)的免费Dyno（一种Serverless实例）额度作为CORS代理，半个小时内没有访问会自动终止进程，冷启动需要一点时间，受此影响评论登录功能可能偶尔会有点慢。
- 实体书的编辑进度比想像中的慢，大概会在4-5月份才会出来。

### 2020年12月7日

- QCon2020主题演讲：[云原生时代，Java的危与机](/tricks/2020/java-crisis/qcon.html)

### 2020年11月18日

- 文档在极客时间上的音频公开课：[构筑可靠的大型软件系统](https://time.geekbang.org/opencourse/intro/100064201)。

### 2020年10月18日

- 整部文档所有计划的内容均已完成，全文合计 <words type='span' chapter='/' /> 字。
- 预计文档的**音频版本**预计会在11月份[极客时间](https://time.geekbang.org/)中，以免费公益课程的形式公开，感谢极客邦的编辑及配音主播。
- 预计文档的**图书版本**预计会在2021年5月左右，由机械工业出版社出版。

### 2020年10月16日

- 完成了“[透明通讯的涅槃](/immutable-infrastructure/mesh/communication.html)”章节。<br/>一年前，此文档刚开篇不久，我写下“[原始分布式时代](/architecture/architect-history/primitive-distribution.html)”和“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”就设想过要以这一篇去结尾。

### 2020年10月10日

- 完成了“[资源与调度](/immutable-infrastructure/schedule/hardware-schedule.html)”章节

### 2020年10月7日

- 完成了“[容器存储与生态](/immutable-infrastructure/storage/csi.html)”章节

### 2020年10月4日

- 完成了“[Kubernetes存储设计](/immutable-infrastructure/storage/storage-evolution.html)”章节

### 2020年9月28日

- 完成了“[容器网络与生态](/immutable-infrastructure/network/cni.html)”章节
- 随着这篇文章的更新，整部文档超过了30万字，按计划应该在35万字以内结束。

### 2020年9月23日

- 完成了“[Linux网络虚拟化](/immutable-infrastructure/network/linux-vnet.html)”章节

### 2020年9月14日

- 完成了“[应用为中心的封装](/immutable-infrastructure/container/application-centric.html)”章节

### 2020年9月10日

- 完成了“[以容器构建系统](/immutable-infrastructure/container/container-build-system.html)”章节

### 2020年9月8日

-  完成了“[虚拟化容器](/immutable-infrastructure/container/)”与“[容器的崛起](/immutable-infrastructure/container/history.html)”章节

### 2020年9月4日

-  完成了“[聚合度量](/distribution/observability/metrics.html)”章节
-  目前到了26万字，整部文档所规划的框架里，只剩下介绍云原生的“不可变基础设施”这最后一大块了，希望今年内能全部写完。

### 2020年9月1日

-  完成了“[事件日志](/distribution/observability/logging.html)”章节
-  完成了“[链路追踪](/distribution/observability/tracing.html)”章节

### 2020年8月29日

-  完成了“[可观测性](/distribution/observability/)”章节

### 2020年8月27日

写了几篇谈理论的务虚文章：

- [向微服务迈进](/methodology/forward-msa/)
  - [目的：微服务的驱动力](/methodology/forward-msa/objective.html)
  - [前提：微服务需要的条件](/methodology/forward-msa/prerequest.html)
  - [边界：微服务的粒度](/methodology/forward-msa/granularity.html)
  - [治理：理解系统复杂性](/methodology/forward-msa/governance.html)

### 2020年8月14日

- 重写了事务处理中的“[本地事务](/architect-perspective/general-architecture/transaction/local.html)”一节。

### 2020年8月11日

- 重写了安全架构中的“[认证](/architect-perspective/general-architecture/system-security/authentication.html)”一节。

### 2020年8月7日

- 提供了新的架构演示“[AWS Lambda 为基础的无服务架构](/exploration/projects/serverless_arch)”。

### 2020年8月5日

- 完成了“[缓存](/architect-perspective/general-architecture/diversion-system/cache-middleware.html)”章节。

### 2020年7月23日

- 完成了“[服务安全](/distribution/secure/service-security.html)”章节。

### 2020年7月20日

- 更新了[基于Spring Cloud](/exploration/projects/microservice_arch_springcloud.html)和[基于Istio](/exploration/projects/servicemesh_arch_istio.html)的Fenix's Bookstore的代码，提供了RSA SHA256的JWT令牌实现，以配合后面两节的主题。
- 完成了“[零信任网络](/distribution/secure/zero-trust.html)”章节。
- 这部文档的总字数在今天突破了20万字，留个纪念。

### 2020年7月13日

- 完成“[流量控制](/distribution/traffic-management/traffic-control.html)”章节。

### 2020年7月8日

- 完成“[服务容错](/distribution/traffic-management/failure.html)”章节。

### 2020年7月2日

- 完成“[客户端负载均衡](/distribution/connect/load-balancing.html)”章节。

### 2020年6月29日

- 完成“[网关路由](/distribution/connect/service-routing)”章节。

### 2020年6月18日

- 重写了“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”章节。

### 2020年6月18日

- [GraalVM](/tricks/graalvm/)增加了视频PPT讲解：[GraalVM——云原生时代的Java](/tricks/graalvm/video)。<br/>正在与某知识服务商合作，未来本文档的主要内容会提供成音频稿。并且仍然会以公开课的性质免费提供。
- 更新了[服务架构演进史](/architecture/architect-history/)，大概增加了40%的内容。

### 2020年6月13日

- 提供了新的架构演示“[基于Istio实现的后端工程](/exploration/projects/servicemesh_arch_istio)”。

### 2020年5月25日

- 提供了新的架构演示“[基于Kubernetes实现的后端工程](/exploration/projects/microservice_arch_kubernetes)”。

### 2020年5月15日

- 完成“[服务发现](/distribution/service-discovery)”章节。

### 2020年5月9日

- 完成“[分布式共识算法](/distribution/consensus/)”章节。

### 2020年5月5日

- 创建更新日志页面。
- 在[目录](/summary/)中增加根据Git提交时间生成的内容更新标识。

### 2020年5月2日

- 完成“[服务架构演进史](/architecture/architect-history/)”章节。
- 查了Git文档是在2019年12月23日创建的，今天在[微博](https://weibo.com/1887642490/J072HfNbO?from=page_1035051887642490_profile&wvr=6&mod=weibotime&type=comment)上开始小范围公开。

### 2019年12月23日

- 此文档第一次Git提交：[Initialize repository](https://github.com/fenixsoft/awesome-fenix/commit/814cbb032a9377987503f08e8b6a3ea560419659)

