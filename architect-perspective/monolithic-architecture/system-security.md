# √ 系统安全

即使只限定在“软件架构设计”这个语境下，系统安全仍然是一个很大的话题。我们谈论的计算机系统安全，远不仅指“系统被黑客攻击”这样狭隘的“安全”。架构安全性至少应包括了（不限于）以下这些问题的具体解决方案：

- **认证**（Authentication）：系统如何正确分辨出操作用户的真实身份？
- **授权**（ Authorization）：系统如何控制一个用户该看到哪些数据、能操作哪些功能？
- **凭证**（Credentials）：系统如何保证它与用户之间的车承诺是双方当时真实意图的体现，是准确、完整且不可抵赖的。
- **保密**（Confidentiality）：系统如何保证敏感数据无法被包括系统管理员在内的内外部人员所窃取、滥用？
- **验证**（Verification）：系统如何确保提交到每项服务中的数据是合乎规则的，不会对系统稳定性、数据一致性、正确性产生风险？
- **传输层安全**（Transport Layer Security）：系统如何保证通过网络传输的信息无法被第三方窃听、篡改和冒充？
- **漏洞利用**（Exploit）：系统如何避免在基础设施和应用程序中出现弱点，被攻击者利用？
- ……

上面这些安全相关的问题，解决起来确实是既繁琐复杂，又难以或缺。值得庆幸的是这一部分内容基本上都是与具体系统、具体业务无关的通用性问题、这意味着它们会存在着业界通行的，已被验证过是行之有效的解决方案，乃至已经形成某一些行业标准，不需要我们自己从头去构思如何解决。后面我们将会通过标准的方案，逐一探讨以上问题的主流处理方法。

还有其他一些安全相关的内容，主要由管理、运维方面负责，尽管软件架构也需要配合参与，但不列入本文的讨论范围之中，譬如：系统备份与恢复、防治病毒、信息系统安全法规与制度、计算机防病毒制度、保护私有信息规则，等等。

## 认证

::: tip 认证（Authentication）

系统如何正确分辨出操作用户的真实身份？

:::

“认证”可以说是一个系统中最基础的安全设计，再简陋的系统大概也不大可能省略掉“用户登录”功能。但“认证”这件事情又并不如大多数人所认为的那样，校验一下 用户名、密码是否正确这么简单。尤其是在基于Java的软件系统里，尝试去触接了解Java安全标准的人往往会对一些今天看起来很别扭的概念产生疑惑。

最初的Java系统里，安全中的“认证”其实是特指“代码级安全”（你是否信任要在你的电脑中运行的代码），这是由“Java 2”之前它的主要应用形式Applets所决定的：从远端下载一段Java代码，以Applet的形式在用户的浏览器中运行，当然要保证这些代码不会损害用户的计算机才行。这一阶段的安全催生了今天仍然存在于Java体系中的“安全管理器”（java.lang.SecurityManager）、“代码权限许可”（java.lang.RuntimePermission）这些概念。

不久之后，Java迎来了互联网的迅速兴起，进入了Java第一次快速发展时期，基于超文本的Web应用迅速盖过了“Java 2”时代之前的Applet，此时“安全认证”的重点逐渐转为“用户级安全”（你是否信任正在操作的用户）。在1999年随着J2EE 1.2（它是J2EE的首个版本，版本号直接就是1.2）所发布的Servlet 2.2中增加了一系列认证的API，诸如：

- HttpServletRequest.isUserInRole()
- HttpServletRequest.getUserPrincipal()
- 还内置支持了四种硬编码、不可扩展的认证机制：BASIC、FORM、CLIENT-CERT和DIGEST。

到Java 1.3时代中，Sun公司提出了同时面向与代码级安全和用户级安全的认证授权服务JAAS（Java Authentication and Authorization Service，1.3处于扩展包中，1.4纳入标准包），不过相对而言，在JAAS中代码级安全仍然是占更主要的地位。

由于用户数据可能来源于各种不同的地方（譬如RDBMS、JNDI、LDAP等等），JAAS设计了一种插入式（Pluggable）的认证和授权模型，以适配各种环境。在今天仍然活跃的主流安全框架中的许多概念，譬如用户叫做“Subject / Principal”、密码存在“Credentials”之中、登陆后从安全上下文“Context”中获取状态等都可以追溯到这一时期所设计的API：

- LoginModule （javax.security.auth.spi.LoginModule）
- LoginContext （javax.security.auth.login.LoginContext）
- Subject （javax.security.auth.Subject）
- Principal （java.security.Principal）
- Credentials（javax.security.auth.Destroyable、javax.security.auth.Refreshable）

不过，尽管JAAS开创了许多沿用至今的安全概念，实质上并没有得到广泛的应用。这里有两大原因，一方面是由于JAAS同时面向代码级和用户级的安全机制，使得它过度复杂化，难以推广。在这里问题上JCP一直在做着持续的增强和补救，譬如Java EE 6中的JASPIC、Java EE 8中的EE Security：

- JSR 115：[Java Authorization Contract for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr115/index3.html)（JACC）
- JSR 196：[Java Authentication Service Provider Interface for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr196/index2.html)（JASPIC）
- JSR 375： [Java EE Security API](https://jcp.org/en/jsr/detail?id=375)（EE Security）

而另一方面，可能是更重要的一个原因是在21世纪的第一个十年里，以EJB为代表的容器化J2EE与以“Without EJB”为口号、以Spring、Hibernate等为代表的轻量化企业级开发框架之争，以后者的胜利而结束。这也使得依赖于容器安全的JAAS无法得到大多数人的认可。

在今时今日，实际活跃于Java届的两大私有的（私有的意思是不由JSR所规范的，即没有java/javax.*作为包名的）的安全框架：

- [Apache Shiro](https://shiro.apache.org/)
- [Spring Security](https://spring.io/projects/spring-security)

相较而言，Shiro使用更为便捷易用，而Spring Security的功能则要复杂强大一些。在我们的项目中（无论是单体架构还是微服务架构），均选择了Spring Security作为安全框架。当然，这里面也有很大一部分是因为Spring Boot/Cloud全家桶的原因。这两大安全框架都解决的问题都很类似，大致可以分为四类：

- 认证：以HTTP Basic、Form等认证方式确认用户身份，这是本节的主要话题。
- 授权：主要是授权结果，即访问控制（Access Control），稍后讲的“授权”将聚焦在授权的过程，尤其是多方授权中。这部分内容会放到下一节一起讨论。
- 密码的存储：就是字面意思，我们会放到“保密”这节去一起讨论。
- 安全上下文：用户获得认证之后，需要有API可以得知该用户的基本资料、用户拥有的权限、角色等。

介绍了一大段关于Java中安全标准的历史，我们最终还是要切入到如何处理认证的话题上，这可是随着网络出现就有的一个东西，所以，IETF的最初想法是基于Web的验证就应该在HTTP协议层面来解决。

> **互联网工程任务组**（Internet Engineering Task Force，IETF）：管理和发布互联网标准的组织，其标准以RFC即"请求意见稿"Request for Comments的形式发出。不仅是HTTP，几乎目前所有的主要网络协议，如IP、TCP、UDP、FTP、CMIP、SOCKS，等等都是以RFC形式定义的。

IETF给HTTP 1.1协议定义了401（Unauthorized，未授权）状态码，当服务端向客户端返回此状态码时，应在Header中附带一个WWW-Authenticate项，此项目通过跟随的一个可扩展的Scheme，告诉客户端应该采取怎样的方式来开始验证，例如：

```
HTTP/1.1 401 Unauthorized
Date: Mon, 04 Feb 2020 16:50:53 GMT
WWW-Authenticate: Basic realm="From icyfenix.cn"
```

同时，IETF也定义了几种标准的Schema，对应了一些预定义好的认证方式，包括：

- **Basic**：[RFC 7617](https://tools.ietf.org/html/rfc7617)，HTTP基础认证，弹出一个输入框，把用户名和密码Base64之后发送出去
- **Digest**：[RFC 7616](https://tools.ietf.org/html/rfc7616)，HTTP摘要认证，弹出一个输入框，把用户名和密码加盐后再通过MD5/SHA等哈希算法摘要后发送出去
- **Bearer**：[RFC 6750](https://tools.ietf.org/html/rfc6750)，OAuth 2.0令牌（OAuth2是一个授权协议，但同时也涉及到认证的内容，下一节的主角）
- **HOBA**：[RFC 7486](https://tools.ietf.org/html/rfc7486) ，**H**TTP **O**rigin-**B**ound **A**uthentication的缩写，一种基于数字签名的认证。

因为Scheme是允许自定义扩展的，很多厂商也加入了自己的认证方式，譬如：

- **AWS4-HMAC-SHA256**：简单粗暴的名字，一看就是亚马逊AWS基于HMAC-SHA256哈希算法的认证
- **NTLM** / **Negotiate**：微软公司NT LAN Manager（NTLM）用到的两种认证方式
- **Windows Live ID**：这是哪家公司的呢呢呢？
- **Twitter Basic**：一个不存在的网站所改良的HTTP基础认证
- ……

这里面的验证不可能逐一介绍了，而且……现在主流的信息系统，并没有直接采用上面这些认证方式，用的主流是Form认证，这说白了就是“登陆表单”。



## 授权

::: tip 授权（ Authorization）

系统如何控制一个用户该看到哪些数据、能操作哪些功能？

:::