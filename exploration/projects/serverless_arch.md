# 无服务：Serverless

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

## 运行程序

Serverless架构的Fenix's Bookstore基于[亚马逊AWS Lambda](https://amazonaws-china.com/cn/lambda/)平台运行，这是最早商用，也是目前全球规模最大的Serverless运行平台。从2018年开始，中国的主流云服务厂商，如阿里云、腾讯云都推出了各自的Serverless云计算环境，如需在这些平台上运行Fenix's Bookstore，应根据平台提供的Java SDK对StreamLambdaHandler的代码进行少许调整。

假设你已经完成[AWS注册](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)、配置[AWS CLI环境](https://amazonaws-china.com/cn/cli/)以及IAM账号的前提下，可通过以下几种途径，可以运行程序，浏览最终的效果：

- 通过AWS SAM（Serverless Application Model） Local在本地运行：<br/>AWS CLI中附有SAM CLI，但是版本较旧，可通过[如下地址](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)安装最新版本的SAM CLI。另外，SAM需要Docker运行环境支持，可参考[此处](/appendix/deployment-env-setup/setup-docker.html)部署。<br/>首先编译应用出二进制包，执行以下标准Maven打包命令即可：<br/>

  ```
  $ mvn clean package
  ```

  根据pom.xml中assembly-zip的设置，打包将不会生成SpringBoot Fat JAR，而是产生适用于AWS Lambda的ZIP包。打包后，确认已在target目录生成ZIP文件，且文件名称与代码中提供了sam.yaml中配置的一致，在工程根目录下运行如下命令启动本地SAM测试：

  ```bash
  $ sam local start-api --template sam.yaml
  ```

  在浏览器访问：[http://localhost:3000](http://localhost:3000)，系统预置了一个用户（user:icyfenix，pw:123456），也可以注册新用户来测试。

- 通过AWS Serverless CLI将本地ZIP包上传至云端运行：<br/>确认已配置AWS凭证后，工程中已经提供了serverless.yml配置文件，确认文件中ZIP的路径与实际Maven生成的一致，然后在命令行执行：

  ```bash
  $ sls deploy
  ```

  此时Serverless CLI会自动将ZIP文件上传至AWS S3，然后生成对应的Layers和API Gateway，运行结果如下所示：

  ```
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

  访问输出结果中的地址（譬如上面显示的https://cc1oj8hirl.execute-api.us-east-1.amazonaws.com/dev/）即可浏览结果。<br/>需要注意，由于Serverless对响应速度的要求本来就较高，与Java本身就运行方式就多少存在矛盾（笔者在GraalVM的“[向原生迈进](/tricks/graalvm/substratevm.html)”一文有详细解释），所以不建议再采用HSQLDB数据库作来运行程序了，每次冷启动都重置一次数据库本身也并不合理。代码中有提供MySQL的Schema，建议采用AWS RDB MySQL/MariaDB作为数据库来运行。

## 协议

- 本作品代码部分采用[Apache 2.0协议](https://www.apache.org/licenses/LICENSE-2.0)进行许可。遵循许可的前提下，你可以自由地对代码进行修改，再发布，可以将代码用作商业用途。但要求你：
  - **署名**：在原有代码和衍生代码中，保留原作者署名及代码来源信息。
  - **保留许可证**：在原有代码和衍生代码中，保留Apache 2.0协议文件。

- 本作品文档部分采用[知识共享署名 4.0 国际许可协议](http://creativecommons.org/licenses/by/4.0/)进行许可。 遵循许可的前提下，你可以自由地共享，包括在任何媒介上以任何形式复制、发行本作品，亦可以自由地演绎、修改、转换或以本作品为基础进行二次创作。但要求你：
  - **署名**：应在使用本文档的全部或部分内容时候，注明原作者及来源信息。
  - **非商业性使用**：不得用于商业出版或其他任何带有商业性质的行为。如需商业使用，请联系作者。
  - **相同方式共享的条件**：在本文档基础上演绎、修改的作品，应当继续以知识共享署名 4.0国际许可协议进行许可。