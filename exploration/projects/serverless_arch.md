# 无服务：AWS Lambda

<GitHubWrapper>

<p align="center">
  <a href="https://icyfenix.cn" target="_blank">
    <img width="180" src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/logo-color.png" alt="logo">
  </a>
</p>
<p align="center">
    <a href="https://icyfenix.cn"  style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/Release-v1.svg"></a>
    <a href="https://www.apache.org/licenses/LICENSE-2.0"  target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/License-Apache.svg" alt="License"></a>
<a href="https://creativecommons.org/licenses/by/4.0/"  target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/DocLicense-CC-red.svg" alt="Document License"></a>
    <a href="https://icyfenix.cn/introduction/about-me.html" target="_blank" style="display:inline-block"><img src="https://raw.githubusercontent.com/fenixsoft/awesome-fenix/master/.vuepress/public/images/Author-IcyFenix-blue.svg" alt="About Author"></a>
</p>

</GitHubWrapper>

如果你此时并不曾了解过什么是“The Fenix Project”，建议先阅读<a href="https://icyfenix.cn/introduction/about-the-fenix-project.html">这部分内容</a>。

无服务架构（Serverless）与微服务架构本身没有继承替代关系，它们并不是同一种层次的架构，无服务的云函数可以作为微服务的一种实现方式，甚至可能是未来很主流的实现方式。在这部文档中我们的话题主要还是聚焦在如何解决分布式架构下的种种问题，相对而言无服务架构并非重点，不过为保证架构演进的完整性，笔者仍然建立了无服务架构的简单演示工程。

不过，由于无服务架构原理上就决定了它对程序的启动性能十分敏感，这天生就不利于 Java 程序，尤其不利于 Spring 这类启动时组装的 CDI 框架。因此基于 Java 的程序，除非使用<a href="https://icyfenix.cn/tricks/2020/graalvm/substratevm.html">GraalVM 做提前编译</a>、将 Spring 的大部分 Bean 提前初始化，或者迁移至[Quarkus](https://quarkus.io/)这以原生程序为目标的框架上，否则是很难实际用于生产的。

## 运行程序

Serverless 架构的 Fenix's Bookstore 基于[亚马逊 AWS Lambda](https://amazonaws-china.com/cn/lambda/)平台运行，这是最早商用，也是目前全球规模最大的 Serverless 运行平台。从 2018 年开始，中国的主流云服务厂商，如阿里云、腾讯云都推出了各自的 Serverless 云计算环境，如需在这些平台上运行 Fenix's Bookstore，应根据平台提供的 Java SDK 对 StreamLambdaHandler 的代码进行少许调整。

假设你已经完成[AWS 注册](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)、配置[AWS CLI 环境](https://amazonaws-china.com/cn/cli/)以及 IAM 账号的前提下，可通过以下几种途径，可以运行程序，浏览最终的效果：

- 通过 AWS SAM（Serverless Application Model） Local 在本地运行：<br/>AWS CLI 中附有 SAM CLI，但是版本较旧，可通过[如下地址](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)安装最新版本的 SAM CLI。另外，SAM 需要 Docker 运行环境支持，可参考[此处](/appendix/deployment-env-setup/setup-docker.html)部署。<br/>首先编译应用出二进制包，执行以下标准 Maven 打包命令即可：<br/>

  ```bash
  $ mvn clean package
  ```

  根据 pom.xml 中 assembly-zip 的设置，打包将不会生成 SpringBoot Fat JAR，而是产生适用于 AWS Lambda 的 ZIP 包。打包后，确认已在 target 目录生成 ZIP 文件，且文件名称与代码中提供了 sam.yaml 中配置的一致，在工程根目录下运行如下命令启动本地 SAM 测试：

  ```bash
  $ sam local start-api --template sam.yaml
  ```

  在浏览器访问：[http://localhost:3000](http://localhost:3000)，系统预置了一个用户（user:icyfenix，pw:123456），也可以注册新用户来测试。

- 通过 AWS Serverless CLI 将本地 ZIP 包上传至云端运行：<br/>确认已配置 AWS 凭证后，工程中已经提供了 serverless.yml 配置文件，确认文件中 ZIP 的路径与实际 Maven 生成的一致，然后在命令行执行：

  ```bash
  $ sls deploy
  ```

  此时 Serverless CLI 会自动将 ZIP 文件上传至 AWS S3，然后生成对应的 Layers 和 API Gateway，运行结果如下所示：

  ```bash
  $ sls deploy
  Serverless: Packaging service...
  Serverless: Uploading CloudFormation file to S3...
  Serverless: Uploading artifacts...
  Serverless: Uploading service bookstore-serverless-awslambda-1.0-SNAPSHOT-lambda-package.zip file to S3 (53.58 MB)...
  Serverless: Validating template...
  Serverless: Updating Stack...
  Serverless: Checking Stack update progress...
  ..............
  Serverless: Stack update finished...
  Service Information
  service: spring-boot-serverless
  stage: dev
  region: us-east-1
  stack: spring-boot-serverless-dev
  resources: 10
  api keys:
    None
  endpoints:
    GET - https://cc1oj8hirl.execute-api.us-east-1.amazonaws.com/dev/
  functions:
    springBootServerless: spring-boot-serverless-dev-springBootServerless
  layers:
    None
  Serverless: Removing old service artifacts from S3...
  ```

  访问输出结果中的地址（譬如上面显示的https://cc1oj8hirl.execute-api.us-east-1.amazonaws.com/dev/）即可浏览结果。<br/>需要注意，由于 Serverless 对响应速度的要求本来就较高，所以不建议再采用 HSQLDB 数据库作来运行程序了，每次冷启动都重置一次数据库本身也并不合理。代码中有提供 MySQL 的 Schema，建议采用 AWS RDB MySQL/MariaDB 作为数据库来运行。

## 协议

- 本作品代码部分采用[Apache 2.0 协议](https://www.apache.org/licenses/LICENSE-2.0)进行许可。遵循许可的前提下，你可以自由地对代码进行修改，再发布，可以将代码用作商业用途。但要求你：

  - **署名**：在原有代码和衍生代码中，保留原作者署名及代码来源信息。
  - **保留许可证**：在原有代码和衍生代码中，保留 Apache 2.0 协议文件。

- 本作品文档部分采用[知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/)进行许可。 遵循许可的前提下，你可以自由地共享，包括在任何媒介上以任何形式复制、发行本作品，亦可以自由地演绎、修改、转换或以本作品为基础进行二次创作。但要求你：
  - **署名**：应在使用本文档的全部或部分内容时候，注明原作者及来源信息。
  - **非商业性使用**：不得用于商业出版或其他任何带有商业性质的行为。如需商业使用，请联系作者。
  - **相同方式共享的条件**：在本文档基础上演绎、修改的作品，应当继续以知识共享署名 4.0 国际许可协议进行许可。
