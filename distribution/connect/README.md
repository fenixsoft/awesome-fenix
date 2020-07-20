# 从类库到服务

在[微服务时代](/architecture/architect-history/microservices.html)中提到过，微服务的其中一个重要设计原则是“通过服务来实现独立自治的组件”（Componentization via Services），之所以强调通过“服务”（Service）而不是“类库”（Library）来构建组件，是指类库在编译期静态链接到程序中的，通过本地调用来提供功能，而服务是进程外组件，通过远程调用来提供功能。

