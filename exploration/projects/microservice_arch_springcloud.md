# 微服务：Spring Cloud

<GitHubWrapper>
<p align="center">
  <a href="https://icyfenix.cn" target="_blank">
    <img width="180" src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/logo-color.png" alt="logo">
  </a>
</p>
<p align="center">
    <a href="https://icyfenix.cn"  style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/Release-v1.svg"></a>
    <a href="https://travis-ci.com/fenixsoft/microservice_arch_springcloud" target="_blank"  style="display:inline-block"><img src="https://travis-ci.com/fenixsoft/microservice_arch_springcloud.svg?branch=master" alt="Travis-CI"></a>
    <a href='https://coveralls.io/github/fenixsoft/microservice_arch_springcloud?branch=master'><img src='https://coveralls.io/repos/github/fenixsoft/microservice_arch_springcloud/badge.svg?branch=master'  target="_blank"  style="display:inline-block" alt='Coverage Status' /></a>
    <a href="https://www.apache.org/licenses/LICENSE-2.0"  target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/License-Apache.svg" alt="License"></a>
<a href="https://creativecommons.org/licenses/by/4.0/"  target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/DocLicense-CC-red.svg" alt="Document License"></a>
    <a href="https://icyfenix.cn/introduction/about-me.html" target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/Author-IcyFenix-blue.svg" alt="About Author"></a>
</p>
</GitHubWrapper>

如果你此时并不曾了解过什么是“The Fenix Project”，建议先阅读<a href="https://icyfenix.cn/introduction/about-the-fenix-project.html">这部分内容</a>。

直至现在，由不同编程语言、不同技术框架所开发的微服务系统中，基于 Spring Cloud 的解决方案仍然是最为主流的选择。这个结果既是 Java 在服务端应用所积累的深厚根基的体现，也是 Spring 在 Java 生态系统中统治地位的体现。从 Spring Boot 到 Spring Cloud 的过渡，令现存数量极为庞大的、基于 Spring 和 Spring Boot 的单体系统得以平滑地迁移到微服务架构中，令这些系统的大部分代码都能够无需修改，或少量修改即可保留重用。微服务时代的早期，Spring Cloud 就集成了[Netflix OSS](https://netflix.github.io/)（以及 Spring Cloud Netflix 进入维护期后对应的替代组件）成体系的微服务套件，基本上也能算“半透明地”满足了在微服务环境中必然会面临的服务发现、远程调用、负载均衡、集中配置等非功能性的需求。

笔者个人是一直不太倾向于 Spring Cloud Netflix 这种以应用代码去解决基础设施功能问题的“解题思路”，以自顶向下的视角来看，这既是虚拟化的微服务基础设施完全成熟之前必然会出现的应用形态，也是微服务进化过程中必然会被替代的过渡形态。不过，笔者的看法如何无关重要，基于 Spring Cloud Netflix 的微服务在当前是主流，直至未来不算短的一段时间内仍会是主流，而且以应用的视角来看，能自底向上观察基础设施在微服务中面临的需求和挑战，能用我们最熟悉的 Java 代码来解释分析问题，也有利于对微服务的整体思想的深入理解，所以将它作为我们了解的第一种微服务架构的实现是十分适合的。

## 需求场景

小书店 Fenix's Bookstore 生意日益兴隆，客人、货物、营收都在持续增长，业务越发复杂，对信息系统并发与可用方面的要求也越来越高。由于业务属性和质量属性要求的提升，信息系统需要更多的硬件资源去支撑，这是合情合理的，但是，如果我们把需求场景列的更具体些，便会发现“合理”下面的许多无可奈何之处：

- 譬如，制约软件质量与业务能力提升的最大因素是人而非硬件。多数企业即使有钱也很难招到大量的靠谱的开发者。此时，无论是引入外包团队，抑或是让少量技术专家带着大量普通水平的开发者去共同完成一个大型系统就成为了必然的选择。在单体架构下，没有什么有效阻断错误传播的手段，系统中“整体”与“部分”的关系没有物理的划分，系统质量只能靠研发与项目管理措施来尽可能地保障，少量的技术专家很难阻止大量螺丝钉式的程序员或者不熟悉原有技术架构的外包人员在某个不起眼的地方犯错并产生全局性的影响，并不容易做出整体可靠的大型系统。
- 譬如，技术异构的需求从可选渐渐成为必须。Fenix's Bookstore 的单体版本是以目前应用范围最广的 Java 编程语言来开发，但依然可能遇到很多想做 Java 却不擅长的事情。譬如想去做人工智能，进行深度学习训练，发现大量的库和开源代码都离不开 Python；想要引入分布式协调工具时，发现近几年 ZooKeeper 已经有被后起之秀 Golang 的 Etcd 蚕食替代的趋势；想要做集中式缓存，发现无可争议的首选是 ANSI C 编写的 Redis，等等。很多时候为异构能力进行的分布式部署，并不是你想或者不想的问题，而是没有选择、无可避免的。
- 譬如，……

微服务的需求场景还可以列举出很多，这里就不多列举了，总之，系统发展到一定程度，我们总能找到充分的理由去拆分与重构它。在笔者设定的演示案例中，准备把<a href="https://icyfenix.cn/exploration/projects/monolithic_arch_springboot.html">单体的 Fenix's Bookstore</a>拆分成为“用户”、“商品”、“交易”三个能够独立运行的子系统，它们将在一系列非功能性技术模块（认证、授权等）和基础设施（配置中心、服务发现等）的支撑下互相协作，以统一的 API 网关对外提供与原来单体系统功能一致的服务，应用视图如下图所示：

<GitHubWrapper>
<p align="center">
    <img  src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/springcloud-ms.png" >
</p>
</GitHubWrapper>

## 运行程序

以下几种途径，可以运行程序，浏览最终的效果：

- 通过 Docker 容器方式运行：<br/>微服务涉及到多个容器的协作，通过 link 单独运行容器已经被 Docker 官方声明为不提倡的方式，所以在工程中提供了专门的配置，以便使用<a href="https://icyfenix.cn/appendix/deployment-env-setup/setup-docker.html#安装docker-compose">docker-compose</a>来运行：

  ```bash
  # 下载docker-compose配置文件
  $ curl -O https://raw.githubusercontent.com/fenixsoft/microservice_arch_springcloud/master/docker-compose.yml

  # 启动服务
  $ docker-compose up
  ```

  然后在浏览器访问：[http://localhost:8080](http://localhost:8080)，系统预置了一个用户（`user:icyfenix，pw:123456`），也可以注册新用户来测试。

- 通过 Git 上的源码，以 Maven 编译、运行：<br/>由于笔者已经在配置文件中设置好了各个微服务的默认的地址和端口号，以便于本地调试。如果要在同一台机运行这些服务，并且每个微服务都只启动一个实例的话，那不加任何配置、参数即可正常以 Maven 编译、以 Jar 包形式运行。由于各个微服务需要从配置中心里获取具体的参数信息，因此唯一的要求只是“配置中心”的微服务必须作为第一个启动的服务进程，其他就没有别的前置要求了。具体的操作过程如下所示：

  ```bash
  # 克隆获取源码
  $ git clone https://github.com/fenixsoft/microservice_arch_springcloud.git

  # 进入工程根目录
  $ cd microservice_arch_springcloud

  # 编译打包
  # 采用Maven Wrapper，此方式只需要机器安装有JDK 8或以上版本即可，无需包括Maven在内的其他任何依赖
  # 克隆后你可能需要使用chmod给mvnw赋予执行权限，如在Windows下应使用mvnw.cmd package代替以下命令
  $ ./mvnw package

  # 工程将编译出七个SpringBoot Jar
  # 启动服务需要运行以下七个微服务组件
  # 配置中心微服务：localhost:8888
  $ java -jar ./bookstore-microservices-platform-configuration/target/bookstore-microservice-platform-configuration-1.0.0-SNAPSHOT.jar
  # 服务发现微服务：localhost:8761
  $ java -jar ./bookstore-microservices-platform-registry/target/bookstore-microservices-platform-registry-1.0.0-SNAPSHOT.jar
  # 服务网关微服务：localhost:8080
  $ java -jar ./bookstore-microservices-platform-gateway/target/bookstore-microservices-platform-gateway-1.0.0-SNAPSHOT.jar
  # 安全认证微服务：localhost:8301
  $ java -jar ./bookstore-microservices-domain-security/target/bookstore-microservices-domain-security-1.0.0-SNAPSHOT.jar
  # 用户信息微服务：localhost:8401
  $ java -jar ./bookstore-microservices-domain-account/target/bookstore-microservices-domain-account-1.0.0-SNAPSHOT.jar
  # 商品仓库微服务：localhost:8501
  $ java -jar ./bookstore-microservices-domain-warehouse/target/bookstore-microservices-domain-warehouse-1.0.0-SNAPSHOT.jar
  # 商品交易微服务：localhost:8601
  $ java -jar ./bookstore-microservices-domain-payment/target/bookstore-microservices-domain-payment-1.0.0-SNAPSHOT.jar
  ```

  由于在命令行启动多个服务、通过容器实现各服务隔离、扩展等都较繁琐，笔者提供了一个`docker-compose.dev.yml`文件，便于开发期调试使用：

  ```bash
  # 使用Maven编译出JAR包后，可使用以下命令直接在本地构建镜像运行
  $ docker-compose -f docker-compose.dev.yml up
  ```

  以上两种本地运行的方式可任选其一，服务全部启动后，在浏览器访问：[http://localhost:8080](http://localhost:8080)，系统预置了一个用户（`user:icyfenix，pw:123456`），也可以注册新用户来测试<br/>

- 通过 Git 上的源码，在 IDE 环境中运行：

  - 以 IntelliJ IDEA 为例，Git 克隆本项目后，在 File -> Open 菜单选择本项目所在的目录，或者 pom.xml 文件，以 Maven 方式导入工程。
  - 待 Maven 自动安装依赖后，即可在 IDE 或者 Maven 面板中编译全部子模块的程序。
  - 本工程下面八个模块，其中除 bookstore-microservices-library-infrastructure 外，其余均是 SpringBoot 工程，将这七个工程的 Application 类加入到 IDEA 的 Run Dashboard 面板中。
  - 在 Run Dashboard 中先启动“bookstore-microservices-platform-configuration”微服务，然后可一次性启动其余六个子模块的微服务。

- 配置与横向扩展<br/>工程中预留了一些的环境变量，便于配置和扩展，譬如，想要在非容器的单机环境中模拟热点模块的服务扩容，就需要调整每个服务的端口号。预留的这类环境变量包括：

  ```bash
  # 修改配置中心的主机和端口，默认为localhost:8888
  CONFIG_HOST
  CONFIG_PORT

  # 修改服务发现的主机和端口，默认为localhost:8761
  REGISTRY_HOST
  REGISTRY_PORT

  # 修改认证中心的主机和端口，默认为localhost:8301
  AUTH_HOST
  AUTH_PORT

  # 修改当前微服务的端口号
  # 譬如，你打算在一台机器上扩容四个支付微服务以应对促销活动的流量高峰
  # 可将它们的端口设置为8601（默认）、8602、8603、8604等
  # 真实环境中，它们可能是在不同的物理机、容器环境下，这时扩容可无需调整端口
  PORT

  # SpringBoot所采用Profile配置文件，默认为default
  # 譬如，服务默认使用HSQLDB的内存模式作为数据库，如需调整为MySQL，可将此环境变量调整为mysql
  # 因为笔者默认预置了名为applicaiton-mysql.yml的配置，以及HSQLDB和MySQL的数据库脚本
  # 如果你需要支持其他数据库、修改程序中其他的配置信息，可以在代码中自行加入另外的初始化脚本
  PROFILES

  # Java虚拟机运行参数，默认为空
  JAVA_OPTS
  ```

## 技术组件

Fenix's Bookstore 采用基于 Spring Cloud 微服务架构，微服务部分主要采用了 Netflix OSS 组件进行支持，它们包括：

- **配置中心**：默认采用[Spring Cloud Config](https://spring.io/projects/spring-cloud-config)，亦可使用[Spring Cloud Consul](https://spring.io/projects/spring-cloud-consul)、[Spring Cloud Alibaba Nacos](https://spring.io/projects/spring-cloud-alibaba)代替。
- **服务发现**：默认采用[Netflix Eureka](https://github.com/Netflix/eureka)，亦可使用[Spring Cloud Consul](https://spring.io/projects/spring-cloud-consul)、[Spring Cloud ZooKeeper](https://spring.io/projects/spring-cloud-zookeeper)、[Etcd](https://github.com/etcd-io/etcd)等代替。
- **服务网关**：默认采用[Netflix Zuul](https://github.com/Netflix/zuul)，亦可使用[Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway)代替。
- **服务治理**：默认采用[Netflix Hystrix](https://github.com/Netflix/Hystrix)，亦可使用[Sentinel](https://github.com/alibaba/Sentinel)、[Resilience4j](https://github.com/resilience4j/resilience4j)代替。
- **进程内负载均衡**：默认采用[Netflix Ribbon](https://github.com/Netflix/ribbon)，亦可使用[Spring Cloud Loadbalancer](https://spring.io/guides/gs/spring-cloud-loadbalancer/)代替。
- **声明式 HTTP 客户端**：默认采用[Spring Cloud OpenFeign](https://spring.io/projects/spring-cloud-openfeign)。声明式的 HTTP 客户端其实没有找替代品的必要性，如果需要，可考虑[Retrofit](https://square.github.io/retrofit/)，或者使用 RestTemplete 乃至于更底层的[OkHTTP](https://square.github.io/okhttp/)、[HTTPClient](https://hc.apache.org/httpcomponents-client-ga/)以命令式编程来访问，多写一些代码而已了。

尽管 Netflix 套件的使用人数很多，但考虑到 Spring Cloud Netflix 已进入维护模式，笔者均列出了上述组件的代替品。这些组件几乎都是声明式的，这确保了它们的替代成本相当低廉，只需要更换注解，修改配置，无需改动代码。你在阅读源码时也会发现，三个“platform”开头的服务，基本上没有任何实际代码的存在。

其他与微服务无关的技术组件（REST 服务、安全、数据访问，等等），笔者已在<a href="https://icyfenix.cn/exploration/projects/monolithic_arch_springboot.html#技术组件">Fenix's Bookstore 单体架构</a>中介绍过，在此不再重复。

## 协议

- 本作品代码部分采用[Apache 2.0 协议](https://www.apache.org/licenses/LICENSE-2.0)进行许可。遵循许可的前提下，你可以自由地对代码进行修改，再发布，可以将代码用作商业用途。但要求你：
  - **署名**：在原有代码和衍生代码中，保留原作者署名及代码来源信息。
  - **保留许可证**：在原有代码和衍生代码中，保留 Apache 2.0 协议文件。
- 本作品文档部分采用[知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/)进行许可。 遵循许可的前提下，你可以自由地共享，包括在任何媒介上以任何形式复制、发行本作品，亦可以自由地演绎、修改、转换或以本作品为基础进行二次创作。但要求你：
  - **署名**：应在使用本文档的全部或部分内容时候，注明原作者及来源信息。
  - **非商业性使用**：不得用于商业出版或其他任何带有商业性质的行为。如需商业使用，请联系作者。
  - **相同方式共享的条件**：在本文档基础上演绎、修改的作品，应当继续以知识共享署名 4.0 国际许可协议进行许可。
