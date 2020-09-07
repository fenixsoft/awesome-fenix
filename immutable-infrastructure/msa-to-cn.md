# 从微服务，到云原生

:::tip 云原生定义（Cloud Native Definition）

Cloud native technologies empower organizations to build and run scalable applications in modern, dynamic environments such as public, private, and hybrid clouds. Containers, service meshes, microservices, immutable infrastructure, and declarative APIs exemplify this approach.

These techniques enable loosely coupled systems that are resilient, manageable, and observable. Combined with robust automation, they allow engineers to make high-impact changes frequently and predictably with minimal toil.

云原生技术有利于各组织在公有云、私有云和混合云等新型动态环境中，构建和运行可弹性扩展的应用。云原生的代表技术包括容器、服务网格、微服务、不可变基础设施和声明式API。

这些技术能够构建容错性好、易于管理和便于观察的松耦合系统。结合可靠的自动化手段，云原生技术使工程师能够轻松地对系统作出频繁和可预测的重大变更。

::: right

—— [Cloud Native Definition](https://github.com/cncf/toc/blob/master/DEFINITION.md), [CNCF](https://www.cncf.io/), 2018

:::

“不可变基础设施”这个概念由来已久。2012年Martin Fowler设想的“[凤凰服务器](https://martinfowler.com/bliki/PhoenixServer.html)”与2013年Chad Fowler正式提出的“[不可变基础设施](http://chadfowler.com/2013/06/23/immutable-deployments.html)，都阐明了基础设施不变性所能带来的益处。在[CNCF](https://en.wikipedia.org/wiki/Cloud_Native_Computing_Foundation)定义的“云原生”概念中，“不可变基础设施”提升到了与微服务平级的重要程度，此时它的内涵已不再局限于方便运维、程序升级和部署的手段，而是升华为向应用代码隐藏分布式架构复杂度、让分布式架构得以成为一种可普遍推广的普适架构风格的必要前提。

前一章以“分布式的基石”为题，介绍了微服务中关键的技术问题与解决方案，在本章，笔者会以“不可变基础设施”的发展为主线，介绍虚拟化容器与服务网格是如何模糊掉软件与硬件之间的界限，如何在基础设施与通讯层面上帮助微服务隐藏复杂性，解决原本只能由程序员通过软件编程来解决的分布式问题。