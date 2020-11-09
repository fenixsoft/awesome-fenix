# 从类库到服务

:::tip 通过服务来实现组件

Microservice architectures will use libraries, but their primary way of componentizing their own software is by breaking down into services.

微服务架构也会使用到类库，但构成软件系统组件的主要方式是将其拆分为一个个服务。

:::right

—— [Martin Fowler](https://martinfowler.com/) / [James Lewis](https://twitter.com/boicy), [Microservices](https://martinfowler.com/articles/microservices.html), 2014

:::

微服务架构其中一个重要设计原则是“通过服务来实现独立自治的组件”（Componentization via Services），强调应采用“服务”（Service）而不再是“类库”（Library）来构建组件化的程序，两者的差别在于类库是在编译期静态链接到程序中的，通过调用本地方法来调用其中的功能，而服务是进程外组件，通过调用远程方法来调用其中的功能。为了能采用服务来构建程序，微服务架构在复杂性与执行性能方面作出了很大的让步，换来的收益是软件系统“整体”与“部分”在物理层面的真正的隔离。

