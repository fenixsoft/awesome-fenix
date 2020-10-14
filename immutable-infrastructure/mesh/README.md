# 服务网格

:::tip 服务网格（Service Mesh）

A service mesh is a dedicated infrastructure layer for handling service-to-service communication. It’s responsible for the reliable delivery of requests through the complex topology of services that comprise a modern, cloud native application. In practice, the service mesh is typically implemented as an array of lightweight network proxies that are deployed alongside application code, without the application needing to be aware.

服务网格是一种用于管控服务间通信的的基础设施，职责是为现代云原生应用支持网络请求在复杂的拓扑环境中可靠地传递。在实践中，服务网格通常会以轻量化网络代理的形式来体现，这些代理与应用程序代码会部署在一起，对应用程序来说，它完全不会感知到代理的存在。

:::right

—— [What's A Service Mesh? And Why Do I Need One?](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)，Willian Morgan，Buoyant CEO，2017

:::

容器编排系统能够管控的最细粒度只能到是容器层次，在此粒度之下的技术细节，仍然只能依赖程序员自己来完成，编排系统很难提供有效的支持。2016年，原Twitter基础设施工程师William Morgan和Oliver Gould在GitHub上发布了第一代的Service Mesh产品Linkerd，并在很短的时间内围绕Linkered组建了Buoyant公司，担任CEO Willian Morgan发表文章《[What's A Service Mesh? And Why Do I Need One?](https://buoyant.io/2017/04/25/whats-a-service-mesh-and-why-do-i-need-one/)》首次使用了“服务网格”（Service Mesh）一词，此后，服务网格作为一种新兴通讯理念迅速传播，越来越频繁地出现在各个公司以及技术社区的视野之中。之所以Linkerd和服务网格能够获得企业和社区的重视，就是因为它很好地弥补了容器编排系统对分布式程序细粒度管控能力高不足的缺憾。

服务网格并不神秘，它就是一种处理服务间通讯的基础设施，典型的存在形式是与应用部署一对一部署的透明网络代理，人们很形象地使用了“边车”（Sidecar）这个词来形容那个像挂在应用身上的代理。无论是服务网格还是边车代理，按顺序阅读本文档至此的读者都应该不会太陌生了。边车出现的时间其实比服务网格的提出还要更早一些，根据笔者所知，“边车”一词最早的起源是[Netflix Prana](https://github.com/Netflix/Prana)。由于Netfilix OSS套件均是用Java语言开发的，为了让非JVM语言的微服务，譬如以Python、Node.js编写的程序也同样能接入Netfilix OSS生态，享受到Eureka、Ribbon、Hystrix等框架的支持，Netflix在2014年建立了Prana项目。它的目标是提供一个独立的HTTP Endpoint，让非JVM语言的程序通过访问该Endpoint来完成诸如获取既定服务所有实例的信息、获取的相关路由节点、获取系统配置参数等功能。

Netfilix OSS中的边车代理对应用是完全可见的，程序代码必须主动去访问它才能使用到它的功能，而并没有什么外部的强制约束迫使每个程序员都一定要这样做，所以此时的边车只能提供一些可选的、增强性的服务能力，无法做到管控约束，更谈不上接管服务之间的通讯。服务网格的提出，正是针对原有边车代理这一方面的改良，它在容器的刻意支持下，使用类似网络攻击里中间人流量劫持的手段，完全透明（即无需程序知晓并主动访问）地接管掉容器与外界的通讯，借此将管理的粒度从容器级别细化到了每个单独的远程服务级别，使得基础设施干涉应用、介入程序行为的能力大幅增强。这样，用基础设施接管技术需求为主旨目标的云原生，继容器和容器编排后，又找到了下一块更广袤的舞台空间。

