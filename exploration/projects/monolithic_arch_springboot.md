# 单体架构：Spring Boot

<p align="center">
  <a href="https://icyfenix.cn" target="_blank">
    <img width="180" src="https://icyfenix.cn/images/logo-color.png" alt="logo">
  </a>
</p>
<p align="center">
    <a href="https://icyfenix.cn"  style="display:inline-block"><img src="https://icyfenix.cn/images/Release-v1.svg"></a>
    <a href="https://travis-ci.com/fenixsoft/monolithic_arch_springboot" target="_blank"  style="display:inline-block"><img src="https://travis-ci.com/fenixsoft/monolithic_arch_springboot.svg?branch=master" alt="Travis-CI"></a>
    <a href='https://coveralls.io/github/fenixsoft/monolithic_arch_springboot?branch=master'><img src='https://coveralls.io/repos/github/fenixsoft/monolithic_arch_springboot/badge.svg?branch=master'  target="_blank"  style="display:inline-block" alt='Coverage Status' /></a>
    <a href="https://www.apache.org/licenses/LICENSE-2.0"  target="_blank" style="display:inline-block"><img src="https://icyfenix.cn/images/License-Apache.svg" alt="License"></a>
<a href="https://creativecommons.org/licenses/by/4.0/"  target="_blank" style="display:inline-block"><img src="https://icyfenix.cn/images/DocLicense-CC-red.svg" alt="Document License"></a>
    <a href="https://icyfenix.cn/introduction/about-me.html" target="_blank" style="display:inline-block"><img src="https://icyfenix.cn/images/Author-IcyFenix-blue.svg" alt="About Author"></a>
</p>

如果你此时并不曾了解过什么是“The Fenix Project”，建议先阅读<a href="https://icyfenix.cn/introduction/about-the-fenix-project.html">这部分内容</a>。

单体架构是 Fenix's Bookstore 服务端的起始版本，它与此后基于微服务（Spring Cloud、Kubernetes）、服务网格（Istio）、无服务（Serverless）架构风格实现的其他版本，在业务功能上的表现是完全一致的。如果你不是针对性地带着解决某个具体问题、了解某项具体工具、技术的目的而来，而是有较充裕的时间，希望了解软件架构的全貌与发展的话，笔者推荐以此工程入手来探索现代软件架构，因为单体架构的结构是相对直观的易于理解的，对后面接触的其他架构风格也起良好的铺垫作用。

## 运行程序

以下几种途径，可以运行程序，浏览最终的效果：

- 通过 Docker 容器方式运行：
  ```bash
  $ docker run -d -p 8080:8080 --name bookstore icyfenix/bookstore:monolithic
  ```
  然后在浏览器访问：[http://localhost:8080](http://localhost:8080)，系统预置了一个用户（`user:icyfenix，pw:123456`），也可以注册新用户来测试。
  默认会使用 HSQLDB 的内存模式作为数据库，并在系统启动时自动初始化好了 Schema，完全开箱即用。但这同时也意味着当程序运行结束时，所有的数据都将不会被保留。
  如果希望使用 HSQLDB 的文件模式，或者其他非嵌入式的独立的数据库支持的话，也是很简单的。以常用的 MySQL/MariaDB 为例，程序中也已内置了 MySQL 的表结构初始化脚本，你可以使用环境变量`PROFILES`来激活 Spring Boot 中针对 MySQL 所提供的配置，命令如下所示：
  ```bash
  $ docker run -d -p 8080:8080 --name bookstore icyfenix/bookstore:monolithic -e PROFILES=mysql
  ```
  此时你需要通过 Docker link、Docker Compose 或者直接在主机的 Host 文件中提供一个名为`mysql_lan`的 DNS 映射，使程序能顺利连接到数据库，关于数据库的更多配置，可参考源码中的[application-mysql.yml](https://github.com/fenixsoft/monolithic_arch_springboot/blob/70f435911b0e0753d7e4cee27cd96304dbef786d/src/main/resources/application-mysql.yml)。
- 通过 Git 上的源码，以 Maven 运行：

  ```bash
  # 克隆获取源码
  $ git clone https://github.com/fenixsoft/monolithic_arch_springboot.git

  # 进入工程根目录
  $ cd monolithic_arch_springboot

  # 编译打包
  # 采用Maven Wrapper，此方式只需要机器安装有JDK 8或以上版本即可，无需包括Maven在内的其他任何依赖
  # 如在Windows下应使用mvnw.cmd package代替以下命令
  $ ./mvnw package

  # 运行程序，地址为localhost:8080
  $ java -jar target/bookstore-1.0.0-Monolithic-SNAPSHOT.jar
  ```

  然后在浏览器访问：[http://localhost:8080](http://localhost:8080)，系统预置了一个用户（`user:icyfenix，pw:123456`），也可以注册新用户来测试。

- 通过 Git 上的源码，在 IDE 环境中运行：
  - 以 IntelliJ IDEA 为例，Git 克隆本项目后，在 File -> Open 菜单选择本项目所在的目录，或者 pom.xml 文件，以 Maven 方式导入工程。
  - IDEA 将自动识别出这是一个 SpringBoot 工程，并定位启动入口为 BookstoreApplication，待 IDEA 内置的 Maven 自动下载完所有的依赖包后，运行该类即可启动。
  - 如你使用其他的 IDE，没有对 SpringBoot 的直接支持，亦可自行定位到 BookstoreApplication，这是一个带有 main()方法的 Java 类，运行即可。
  - 可通过 IDEA 的 Maven 面板中 Lifecycle 里面的 package 来对项目进行打包、发布。
  - 在 IDE 环境中修改配置（如数据库等）会更加简单，具体可以参考工程中`application.yml`和`application-mysql.yml`中的内容。

## 技术组件

Fenix's Bookstore 单体架构后端尽可能采用标准的技术组件进行构建，不依赖于具体的实现，包括：

- [JSR 370：Java API for RESTful Web Services 2.1](https://jcp.org/en/jsr/detail?id=370)（JAX-RS 2.1）<br/>RESTFul 服务方面，采用的实现为 Jersey 2，亦可替换为 Apache CXF、RESTeasy、WebSphere、WebLogic 等。

- [JSR 330：Dependency Injection for Java 1.0](https://jcp.org/en/jsr/detail?id=330)<br/>依赖注入方面，采用的的实现为 SpringBoot 2 中内置的 Spring Framework 5。虽然在多数场合中尽可能地使用了 JSR 330 的标准注解，但仍有少量地方由于 Spring 在对@Named、@Inject 等注解的支持表现上与本身提供的注解差异，使用了 Spring 的私有注解。如替换成其他的 CDI 实现，如 HK2，需要较大的改动。

- [JSR 338：Java Persistence 2.2](https://jcp.org/en/jsr/detail?id=338)<br/>持久化方面，采用的实现为 Spring Data JPA。可替换为 Batoo JPA、EclipseLink、OpenJPA 等实现，只需将使用 CrudRepository 所省略的代码手动补全回来即可，无需其他改动。

- [JSR 380：Bean Validation 2.0](https://jcp.org/en/jsr/detail?id=380)<br/>
  数据验证方面，采用的实现为 Hibernate Validator 6，可替换为 Apache BVal 等其他验证框架。

- [JSR 315：Java Servlet 3.0](https://jcp.org/en/jsr/detail?id=315)<br/>
  Web 访问方面，采用的实现为 SpringBoot 2 中默认的 Tomcat 9 Embed，可替换为 Jetty、Undertow 等其他 Web 服务器。

有以下组件仍然依赖了非标准化的技术实现，包括：

- [JSR 375：Java EE Security API specification 1.0](https://jcp.org/en/jsr/detail?id=375)<br/>
  认证/授权方面，在 2017 年才发布的 JSR 375 中仍然没有直接包含 OAuth2 和 JWT 的直接支持，因后续实现微服务架构时对比的需要，单体架构中选择了 Spring Security 5 作为认证服务，Spring Security OAuth 2.3 作为授权服务，Spring Security JWT 作为 JWT 令牌支持，并未采用标准的 JSR 375 实现，如 Soteria。

- [JSR 353/367：Java API for JSON Processing/Binding](https://jcp.org/en/jsr/detail?id=353)<br/>在 JSON 序列化/反序列化方面，由于 Spring Security OAuth 的限制（使用 JSON-B 作为反序列化器时的结果与 Jackson 等有差异），采用了 Spring Security OAuth 默认的 Jackson，并未采用标准的 JSR 353/367 实现，如 Apache Johnzon、Eclipse Yasson 等。

## 工程结构

Fenix's Bookstore 单体架构后端参考（并未完全遵循）了 DDD 的分层模式和设计原则，整体分为以下四层：

1. Resource：对应 DDD 中的 User Interface 层，负责向用户显示信息或者解释用户发出的命令。请注意，这里指的“用户”不一定是使用用户界面的人，可以是位于另一个进程或计算机的服务。由于本工程采用了 MVVM 前后端分离模式，这里所指的用户实际上是前端的服务消费者，所以这里以 RESTful 中的核心概念“资源”（Resource）来命名。
2. Application：对应 DDD 中的 Application 层，负责定义软件本身对外暴露的能力，即软件本身可以完成哪些任务，并负责对内协调领域对象来解决问题。根据 DDD 的原则，应用层要尽量简单，不包含任何业务规则或者知识，而只为下一层中的领域对象协调任务，分配工作，使它们互相协作，这一点在代码上表现为 Application 层中一般不会存在任何的条件判断语句。在许多项目中，Application 层都会被选为包裹事务（代码进入此层事务开始，退出此层事务提交或者回滚）的载体。
3. Domain：对应 DDD 中的 Domain 层，负责实现业务逻辑，即表达业务概念，处理业务状态信息以及业务规则这些行为，此层是整个项目的重点。
4. Infrastructure：对应 DDD 中的 Infrastructure 层，向其他层提供通用的技术能力，譬如持久化能力、远程服务通讯、工具集，等等。

<GitHubWrapper>

<p align="center">
    <img  src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/ddd-arch.png" >
</p>
</GitHubWrapper>

## 协议

- 本文档代码部分采用[Apache 2.0 协议](https://www.apache.org/licenses/LICENSE-2.0)进行许可。遵循许可的前提下，你可以自由地对代码进行修改，再发布，可以将代码用作商业用途。但要求你：
  - **署名**：在原有代码和衍生代码中，保留原作者署名及代码来源信息。
  - **保留许可证**：在原有代码和衍生代码中，保留 Apache 2.0 协议文件。
- 本作品文档部分采用[知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/)进行许可。 遵循许可的前提下，你可以自由地共享，包括在任何媒介上以任何形式复制、发行本作品，亦可以自由地演绎、修改、转换或以本作品为基础进行二次创作。但要求你：
  - **署名**：应在使用本文档的全部或部分内容时候，注明原作者及来源信息。
  - **非商业性使用**：不得用于商业出版或其他任何带有商业性质的行为。如需商业使用，请联系作者。
  - **相同方式共享的条件**：在本文档基础上演绎、修改的作品，应当继续以知识共享署名 4.0 国际许可协议进行许可。
