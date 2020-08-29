# 服务与流量治理

:::tip 容错性设计

Since services can fail at any time, it's important to be able to detect the failures quickly and, if possible, automatically restore service

由于服务随时都有可能崩溃，因此快速的失败检测和自动恢复就显得至关重要。

:::right

—— [Martin Fowler](https://martinfowler.com/) / [James Lewis](https://twitter.com/boicy), [Microservices](https://martinfowler.com/articles/microservices.html), 2014

:::

“容错性设计”（Design for Failure）是[微服务的核心原则](/architecture/architect-history/microservices.html)之一，也是笔者在此文档中多次反复强调的开发观念转变。不过即使已经有一定的心理准备，大多数首次将微服务架构引入实际生产系统的开发者，在[服务发现](/distribution/connect/service-discovery.html)、[网关路由](/distribution/connect/service-routing.html)等支持下，踏出了微服务化的第一步以后，很可能仍会经历一段阵痛期，随着拆分出的服务越来越多，往往会随之而来面临以下两个问题的困扰：

- 由于某一个服务的崩溃，导致所有用到这个服务的其他服务都无法工作，进而再层层传递，波及到调用链上与此有关的所有服务。防止雪崩效应是微服务中容错性设计原则的体现，是服务化架构必须解决的问题，否则服务化程度越高，整个系统反而越不稳定。
  
- 服务虽然没有崩溃，但由于处理能力有限，面临超过预期的突发请求时，大部分请求直至超时都无法完成响应。这种现象产生的后果跟交通堵塞是类似的，如果一开始没有得到及时处理，后面就需要长时间才能使得全部服务都恢复正常。

“服务流量治理”这一部分，我们将围绕这如何解决以上两个问题，提出服务容错、流量控制、服务质量管理等一系列解决方案。这些措施并非孤立的，它们相互之间存在很多联系，其中许多功能必须与此前介绍过的服务注册中心、服务网关、负载均衡器配合才能实现。理清楚这些技术措施背后的逻辑链条，是了解它们工作原理的捷径。