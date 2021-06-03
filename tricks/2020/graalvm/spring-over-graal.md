# Spring over Graal

前面几部分，我们以定性的角度分析了 Graal VM 诞生的背景与它的价值，在最后这部分，我们尝试进行一些实践和定量的讨论，介绍具体如何使用 Graal VM 之余，也希望能以更加量化的角度去理解程序运行在 Graal VM 之上，会有哪些具体的收益和代价。

尽管需要到 2020 年 10 月正式发布之后，Spring 对 Graal VM 的支持才会正式提供，但现在的我们其实已经可以使用 Graal VM 来（实验性地）运行 Spring、Spring Boot、Spring Data、Netty、JPA 等等的一系列组件（不过 SpringCloud 中的组件暂时还不行）。接下来，我们将尝试使用 Graal VM 来编译一个标准的 Spring Boot 应用：

- **环境准备**：

  - 安装 Graal VM，你可以选择直接[下载](https://github.com/graalvm/graalvm-ce-builds/releases)安装（版本选择 Graal VM CE 20.0.0），然后配置好 PATH 和 JAVA_HOME 环境变量即可；也可以选择使用[SDKMAN](https://sdkman.io/install)来快速切换环境。个人推荐后者，毕竟目前还不适合长期基于 Graal VM 环境下工作，经常手工切换会很麻烦。

    ```bash
    # 安装SDKMAN
    $ curl -s "https://get.sdkman.io" | bash

    # 安装Graal VM
    $ sdk install java 20.0.0.r8-grl
    ```

  - 安装本地镜像编译依赖的 LLVM 工具链。

    ```bash
    # gu命令来源于Graal VM的bin目录
    $ gu install native-image
    ```

    请注意，这里已经假设你机器上已有基础的 GCC 编译环境，即已安装过 build-essential、libz-dev 等套件。没有的话请先行安装。对于 Windows 环境来说，这步是需要 Windows SDK 7.1 中的 C++编译环境来支持。我个人并不建议在 Windows 上进行 Java 应用的本地化操作，如果说在 Linux 中编译一个本地镜像，通常是为了打包到 Docker，然后发布到服务器中使用。那在 Windows 上编译一个本地镜像，你打算用它来干什么呢？

- **编译准备**：

  - 首先，我们先假设你准备编译的代码是“符合要求”的，即没有使用到 Graal VM 不支持的特性，譬如前面提到的 Finalizer、CGLIB、InvokeDynamic 这类功能。然后，由于我们用的是 Graal VM 的 Java 8 版本，也必须假设你编译使用 Java 语言级别在 Java 8 以内。

  - 然后，我们需要用到尚未正式对外发布的 Spring Boot 2.3，目前最新的版本是 Spring Boot 2.3.0.M4。请将你的 pom.xml 中的 Spring Boot 版本修改如下（假设你编译用的是 Maven，用 Gradle 的请自行调整）：

    ```xml
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.0.M4</version>
        <relativePath/>
    </parent>
    ```

    由于是未发布的 Spring Boot 版本，所以它在 Maven 的中央仓库中是找不到的，需要手动加入 Spring 的私有仓库，如下所示：

    ```xml
    <repositories>
        <repository>
            <id>spring-milestone</id>
            <name>Spring milestone</name>
            <url>https://repo.spring.io/milestone</url>
        </repository>
    </repositories>
    ```

  - 最后，尽管我们可以通过命令行（使用 native-image 命令）来直接进行编译，这对于没有什么依赖的普通 Jar 包、写一个 Helloworld 来说都是可行的，但对于 Spring Boot，光是在命令行中写 Classpath 上都忙活一阵的，建议还是使用[Maven 插件](https://www.graalvm.org/docs/reference-manual/native-image/#integration-with-maven)来驱动 Graal VM 编译，这个插件能够根据 Maven 的依赖信息自动组织好 Classpath，你只需要填其他命令行参数就行了。因为并不是每次编译都需要构建一次本地镜像，为了不干扰使用普通 Java 虚拟机的编译，建议在 Maven 中独立建一个 Profile 来调用 Graal VM 插件，具体如下所示：

    ```xml
    <profiles>
      <profile>
        <id>graal</id>
        <build>
          <plugins>
            <plugin>
              <groupId>org.graalvm.nativeimage</groupId>
              <artifactId>native-image-maven-plugin</artifactId>
              <version>20.0.0</version>
              <configuration>
                <buildArgs>-Dspring.graal.remove-unused-autoconfig=true --no-fallback -H:+ReportExceptionStackTraces --no-server</buildArgs>
              </configuration>
              <executions>
                <execution>
                  <goals>
                    <goal>native-image</goal>
                  </goals>
                  <phase>package</phase>
                </execution>
              </executions>
            </plugin>
            <plugin>
              <groupId>org.springframework.boot</groupId>
              <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
          </plugins>
        </build>
      </profile>
    </profiles>
    ```

    这个插件同样在 Maven 中央仓库中不存在，所以也得加上前面 Spring 的私有库：

    ```xml
    <pluginRepositories>
        <pluginRepository>
            <id>spring-milestone</id>
            <name>Spring milestone</name>
            <url>https://repo.spring.io/milestone</url>
        </pluginRepository>
    </pluginRepositories>
    ```

    至此，编译环境的准备顺利完成。

- **程序调整**：

  - 首先，前面提到了 Graal VM 不支持 CGLIB，只能使用 JDK 动态代理，所以应当把 Spring 对普通类的 Bean 增强给关闭掉：

    ```java
    @SpringBootApplication(proxyBeanMethods = false)
    public class ExampleApplication {

        public static void main(String[] args) {
            SpringApplication.run(ExampleApplication.class, args);
        }

    }
    ```

  - 然后，这是最麻烦的一个步骤，你程序里反射调用过哪些 API、用到哪些资源、动态代理，还有哪些类型需要在编译期初始化的，都必须使用 JSON 配置文件逐一告知 Graal VM。前面也说过了，这事情只有理论上的可行性，实际做起来完全不可操作。Graal VM 的开发团队当然也清楚这一点，所以这个步骤实际的处理途径有两种，第一种是假设你依赖的第三方包，全部都在 Jar 包中内置了以上编译所需的配置信息，这样你只要提供你程序里用户代码中用到的配置即可，如果你程序里没写过反射、没用过动态代理什么的，那就什么配置都无需提供。第二种途径是 Graal VM 计划提供一个 Native Image Agent 的代理，只要将它挂载在在程序中，以普通 Java 虚拟机运行一遍，把所有可能的代码路径都操作覆盖到，这个 Agent 就能自动帮你根据程序实际运行情况来生成编译所需要的配置，这样无论是你自己的代码还是第三方的代码，都不需要做预先的配置。目前，第二种方式中的 Agent 尚未正式发布，只有方式一是可用的。幸好，Spring 与 Graal VM 共同维护的在[Spring Graal Native](https://github.com/spring-projects-experimental/spring-graal-native)项目已经提供了大多数 Spring Boot 组件的配置信息（以及一些需要在代码层面处理的 Patch），我们只需要简单依赖该工程即可。

    ```xml
    <dependencies>
        <dependency>
            <groupId>org.springframework.experimental</groupId>
            <artifactId>spring-graal-native</artifactId>
            <version>0.6.1.RELEASE</version>
        </dependency>
        <dependency>
          <groupId>org.springframework</groupId>
          <artifactId>spring-context-indexer</artifactId>
        </dependency>
    </dependencies>
    ```

    另外还有一个小问题，由于目前 Spring Boot 嵌入的 Tomcat 中，WebSocket 部分在 JMX 反射上还有一些瑕疵，在[修正该问题的 PR](https://github.com/apache/tomcat/pull/274)被 Merge 之前，暂时需要手工去除掉这个依赖：

    ```xml
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
            <exclusions>
                <exclusion>
                    <groupId>org.apache.tomcat.embed</groupId>
                    <artifactId>tomcat-embed-websocket</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
    ```

  - 最后，在 Maven 中给出程序的启动类的路径：

    ```xml
    <properties>
        <start-class>com.example.ExampleApplication</start-class>
    </properties>
    ```

- **开始编译**：

  - 到此一切准备就绪，通过 Maven 进行编译：

    ```bash
    $ mvn -Pgraal clean package
    ```

    编译的结果默认输出在 target 目录，以启动类的名字命名。

  - 因为 AOT 编译可以放心大胆地进行大量全程序的重负载优化，所以无论是编译时间还是空间占用都非常可观。笔者在 intel 9900K、64GB 内存的机器上，编译了一个只引用了 org.springframework.boot:spring-boot-starter-web 的 Helloworld 类型的工程，大约耗费了两分钟时间。

    ```
    [com.example.exampleapplication:9839]   (typeflow):  22,093.72 ms,  6.48 GB
    [com.example.exampleapplication:9839]    (objects):  34,528.09 ms,  6.48 GB
    [com.example.exampleapplication:9839]   (features):   6,488.74 ms,  6.48 GB
    [com.example.exampleapplication:9839]     analysis:  65,465.65 ms,  6.48 GB
    [com.example.exampleapplication:9839]     (clinit):   2,135.25 ms,  6.48 GB
    [com.example.exampleapplication:9839]     universe:   4,449.61 ms,  6.48 GB
    [com.example.exampleapplication:9839]      (parse):   2,161.78 ms,  6.32 GB
    [com.example.exampleapplication:9839]     (inline):   3,113.77 ms,  6.25 GB
    [com.example.exampleapplication:9839]    (compile):  15,892.88 ms,  6.56 GB
    [com.example.exampleapplication:9839]      compile:  25,044.34 ms,  6.56 GB
    [com.example.exampleapplication:9839]        image:   6,580.71 ms,  6.63 GB
    [com.example.exampleapplication:9839]        write:   1,362.73 ms,  6.63 GB
    [com.example.exampleapplication:9839]      [total]: 120,410.26 ms,  6.63 GB
    [INFO]
    [INFO] --- spring-boot-maven-plugin:2.3.0.M4:repackage (repackage) @ exampleapplication ---
    [INFO] Replacing main artifact with repackaged archive
    [INFO] ------------------------------------------------------------------------
    [INFO] BUILD SUCCESS
    [INFO] ------------------------------------------------------------------------
    [INFO] Total time: 02:08 min
    [INFO] Finished at: 2020-04-25T22:18:14+08:00
    [INFO] Final Memory: 38M/599M
    [INFO] ------------------------------------------------------------------------
    ```

- **效果评估**：

  - 笔者使用 Graal VM 编译一个最简单的 Helloworld 程序（就只在控制台输出个 Helloworld，什么都不依赖），最终输出的结果大约 3.6MB，启动时间能低至 2ms 左右。如果用这个程序去生成 Docker 镜像（不基于任何基础镜像，即使用 FROM scratch 打包），产生的镜像还不到 3.8MB。 而 OpenJDK 官方提供的 Docker 镜像，即使是 slim 版，其大小也在 200MB 到 300MB 之间。

  - 使用 Graal VM 编译一个简单的 Spring Boot Web 应用，仅导入 Spring Boot 的 Web Starter 的依赖的话，编译结果有 77MB，原始的 Fat Jar 包大约是 16MB，这样打包出来的 Docker 镜像可以不依赖任何基础镜像，大小仍然是 78MB 左右（实际使用时最好至少也要基于 alpine 吧，不差那几 MB）。相比起空间上的收益，启动时间上的改进是更主要的，Graal VM 的本地镜像启动时间比起基于虚拟机的启动时间有着绝对的优势，一个普通 Spring Boot 的 Web 应用启动一般 2、3 秒之间，而本地镜像只要 100 毫秒左右即可完成启动，这确实有了数量级的差距。

  - 不过，必须客观地说明一点，尽管 Graal VM 在启动时间、空间占用、内存消耗等容器化环境中比较看重的方面确实比 HotSpot 有明显的改进，尽管 Graal VM 可以放心大胆地使用重负载的优化手段，但如果是处于长时间运行这个前提下，至少到目前为止，没有任何迹象表明它能够超越经过充分预热后的 HotSpot。在延迟、吞吐量、可监控性等方面，仍然是 HotSpot 占据较大优势，下图引用了 DEVOXX 2019 中 Graal VM 团队自己给出的 Graal VM 与 HotSpot JIT 在各个方面的对比评估：

:::center
![](./images/graal-hotspot.png)
Graal VM 与 HotSpot 的对比
:::

Graal VM 团队同时也说了，Graal VM 有望在 2020 年之内，在延迟和吞吐量这些关键指标上追评 HotSpot 现在的表现。Graal VM 毕竟是一个 2018 年才正式公布的新生事物，我们能看到它这两三年间在可用性、易用性和性能上持续地改进，Graal VM 有望成为 Java 在微服务时代里的最重要的基础设施变革者，这项改进的结果如何，甚至可能与 Java 的前途命运息息相关。
