# 认证 

::: tip 认证（Authentication）

系统如何正确分辨出操作用户的真实身份？

:::

认证（Authentication）、授权（Authorization）和凭证（Credentials）可以说是一个系统中最基础的安全设计，哪怕再简陋的信息系统，大概也不可能忽略掉“用户登录”功能。信息系统为用户提供服务之前，总是希望先弄清楚“你是谁？”（认证）、“你能干什么？”（授权）以及“你如何证明？”（凭证）这三个基本问题的答案。然而，认证、授权与凭证这三个基本问题，又并不像部分开发者所认为的那样，只是一个“系统登录”功能而已，仅仅是校验一下用户名、密码是否正确这么简单。账户和权限信息作为一种必须最大限度保障安全和隐私，同时又要兼顾各个系统模块甚至是系统间共享访问的基础主数据，它的存储、管理与使用都面临一系列复杂的问题。对于某些大规模的信息系统，账户和权限的管理往往要由专门的基础设施来负责，譬如微软的[活动目录](https://en.wikipedia.org/wiki/Active_Directory)（Active Directory，AD）或者[轻量目录访问协议](https://en.wikipedia.org/wiki/Lightweight_Directory_Access_Protocol)（Lightweight Directory Access Protocol，LDAP），跨系统的共享使用甚至会用到区块链技术去解决。

另外还有一个不少人会先入为主的认知偏差：尽管“认证”是解决“你是谁？”的问题，但这里的“你”并不是一定是个人（真不是在骂你），也很有可能是指外部的代码，即第三方的类库或者服务。最初，对代码认证的重要程度甚至高于对最终用户的认证，譬如早期的Java系统里，安全中的认证默认是特指“代码级安全”，即你是否信任要在你的电脑中运行的代码。这是由Java当时的主要应用形式——Java Applets所决定的：类加载器从远端下载一段字节码，以Applets的形式在用户的浏览器中运行，由于Java的语言操控计算机资源的能力要远远强于JavaScript，因此必须要先确保这些代码不会损害用户的计算机，否则就谁都不敢去用。这一阶段的安全观念催生了现在仍然存在于Java技术体系中的“安全管理器”（java.lang.SecurityManager）、“代码权限许可”（java.lang.RuntimePermission）等概念。如今，对外部类库和服务的认证需求依然普遍，但相比起五花八门的最终用户认证来说，代码认证的研究发展方向已经很固定，基本上都统一到证书签名上。本节里，认证的范围只限于对最终用户的认证，代码认证会安排在“分布式的基石”中的“[服务安全](/distribution/secure/service-security.html)”去讲解。

## 认证的标准

世纪之交，Java迎来了Web时代的辉煌，互联网迅速兴起促使Java进入了快速发展时期。这时候，基于HTML和JavaScript的超文本Web应用迅速超过了“Java 2时代”之前的Java Applets应用，B/S系统对最终用户认证的需求使得“安全认证”的重点逐渐从“代码级安全”转向为“用户级安全”，即你是否信任正在操作的用户。在1999年，随J2EE 1.2（它是J2EE的首个版本，为了与J2SE同步，初始版本号直接就是1.2）所发布的Servlet 2.2中，添加了一系列用于认证的API，主要包括下列两部分内容：

- 标准方面，添加了四种内置的、不可扩展的认证方案，即Client-Cert、Basic、Digest和Form。
- 实现方面，添加了与认证和授权相关的一套程序接口，譬如HttpServletRequest::isUserInRole()、HttpServletRequest::getUserPrincipal()等方法。

一项发布超过20年的老旧技术，原本并没有什么专门提起的必要性，笔者之所以引用这件事，是希望从它包含的两部分内容中引出一个架构安全性的经验原则：以标准规范为指导、以标准接口去实现。安全涉及的问题很麻烦，但解决方案也相当的成熟，对于99%的系统来说，在安全上不去做轮子，不去想发明创造，严格遵循标准就是最恰当的安全设计。

引用J2EE 1.2对安全的改进还有另一个原因，它内置支持的Basic、Digest、Form和Client-Cert四种认证方案都很有代表性，刚好分别覆盖了通讯信道、协议和内容层面的认证，这三种层面认证涵盖了主流的三种认证方式，含义和应用场景笔者列举如下：

- **通讯信道上的认证**：你和我建立通讯连接之前，要先证明你是谁。在网络传输（Network）场景中的典型是基于SSL/TLS传输安全层的认证。
- **通讯协议上的认证**：你请求获取我的资源之前，要先证明你是谁。在互联网（Internet）场景中的典型是基于HTTP协议的认证。
- **通讯内容上的认证**：你使用我提供的服务之前，要先证明你是谁。在万维网（World Wide Web）场景中的典型是基于Web内容的认证。

关于第一点信道上的认证，由于内容较多，又与后续介绍微服务安全方面的话题关系密切，将会独立放到本章的“传输”里，而且J2EE中的Client-Cert其实并不是用于TLS的，以它引出TLS并不合适。在本节中，我们将会了解基于通讯协议和内容的两种认证方式。

### HTTP认证

前文中已经提前用到了一个技术名词“认证方案”（Authentication Schemes），它是指生成用户身份凭证的某种方法，这个概念最初源于HTTP协议的认证框架（Authentication Framework）。IETF在[RFC 7235](https://tools.ietf.org/html/rfc7235)中定义了HTTP协议的通用认证框架，要求所有支持HTTP协议的服务器，当未授权的用户意图访问服务端保护区域的资源时，应返回401 Unauthorized的状态码，同时应在响应报文头里附带以下两个分别代表网页认证和代理认证的Header之一，告知客户端应该采取何种方式产生能代表访问者身份的凭证信息：

``` http
WWW-Authenticate: <认证方案> realm=<保护区域的描述信息>
Proxy-Authenticate: <认证方案> realm=<保护区域的描述信息>
```

接收到该响应后，客户端必须遵循服务端指定的认证方案，在请求资源的报文头中加入身份凭证信息，服务端核实通过后才会允许该请求正常返回，否则将返回403 Forbidden。请求头报文应包含以下Header项之一：

```http
Authorization: <认证方案> <凭证内容>
Proxy-Authorization: <认证方案> <凭证内容>
```

HTTP认证框架提出认证方案是希望能把认证“要产生身份凭证”的目的与“具体如何产生凭证”的实现分离开来，无论客户端通过生物信息（指纹、人脸）、用户密码、数字证书抑或其他方式来生成凭证，都属于是如何生成凭证的具体实现，都可以包容在HTTP协议预设的框架之内，HTTP认证框架的工作流程如下面时序所示：

<mermaid style="margin-bottom: 0px">
sequenceDiagram
	客户端->>+服务端: GET /admin 
	服务端-->>-客户端: 401 Unauthorized （WWW-Authenticate）
	客户端->>客户端: Ask user
	客户端->>+服务端: GET /admin（Authorization）
	服务端->>服务端: Check credentials
	服务端-->>-客户端: 200 OK / 403 Forbidden
</mermaid>

以上概念性的介绍可能会有些枯燥抽象，笔者以最基础的认证方案HTTP Basic Authentication为例来解释认证是如何工作的。HTTP Basic认证是一种主要以演示为目的认证方案，在一些不要求安全性的场合也有实际应用，譬如你家里的路由器登录，有可能就是这种认证方式。Basic认证产生用户身份凭证的方法是让用户输入用户名和密码，经过Base64编码“加密”后作为身份凭证。譬如请求资源`GET /admin`后，浏览器收到服务端的如下响应：

```http
HTTP/1.1 401 Unauthorized
Date: Mon, 24 Feb 2020 16:50:53 GMT
WWW-Authenticate: Basic realm="example from icyfenix.cn"
```

此时，浏览器必须询问最终用户，要求提供用户名和密码，会弹出类似下图所示的HTTP Basic认证窗口：

:::center
![Basic-Authentication](./images/Basic-Authentication.png)
HTTP Basic Authentication
:::

用户在对话框中输入密码信息，譬如输入用户名`cyfenix`，密码`123456`，浏览器会将字符串`icyfenix:123456`编码为`aWN5ZmVuaXg6MTIzNDU2`，然后发送给服务端，HTTP请求如下所示：

```http
GET /admin HTTP/1.1
Authorization: Basic aWN5ZmVuaXg6MTIzNDU2
```

服务端接收到请求，解码后检查用户名和密码是否合法，如果合法就允许返回`/admin`的资源，否则就返回403 Forbidden禁止下一步操作。注意Base64只是一种编码方式，并非任何形式的加密，所以Basic认证的风险是显而易见的，它只能是一种以演示为主要目的认证方案。除Basic认证外，IETF还定义了很多种可用于实际生产环境的认证方案，譬如：

- **Digest**：[RFC 7616](https://tools.ietf.org/html/rfc7616)，HTTP摘要认证，可视为Basic认证的改良版本，针对Base64明文发送的风险，Digest认证把用户名和密码加盐（一个被称为Nonce的变化值作为盐值）后再通过MD5/SHA等哈希算法取摘要发送出去。这种认证方式依然是不安全的，无论客户端使用何种加密算法加密，无论是否采用了Nonce这样的动态盐值去抵御重放和冒认，遇到中间人攻击时依然存在显著的安全风险，笔者将在“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”小节中具体讨论加解密方面的问题。
- **Bearer**：[RFC 6750](https://tools.ietf.org/html/rfc6750)，基于OAuth 2规范来完成认证，OAuth2是一个同时涉及到认证与授权的协议，笔者将在“[授权](/architect-perspective/general-architecture/system-security/authorization.html)”小节中详细介绍OAuth 2。
- **HOBA**：[RFC 7486](https://tools.ietf.org/html/rfc7486) ，HOBA是HTTP Origin-Bound Authentication的缩写，这是一种基于自签名证书的认证方案。基于数字证书的信任关系主要有两类模型，一类是采用CA（Certification Authority）层次结构的模型，由CA中心签发证书；另一种是以IETF的Token Binding协议为基础的OBC（Origin Bound Certificates）自签名证书模型。笔者将在“[传输](/architect-perspective/general-architecture/system-security/transport-security.html)”小节中详细介绍数字证书。

HTTP认证框架中认证方案是允许自行扩展的，并不要求一定由RFC规范来定义，只要用户代理（User Agent，通常是浏览器，泛指任何使用HTTP协议的程序）能够识别这种私有的认证方案即可。因此，很多厂商也扩展了自己的认证方案，譬如：

- **AWS4-HMAC-SHA256**：相当简单粗暴的名字，就是亚马逊AWS基于HMAC-SHA256哈希算法的认证。
- **NTLM** / **Negotiate**：这是微软公司NT LAN Manager（NTLM）用到的两种认证方式。
- **Windows Live ID**：这个顾名思义即可。
- **Twitter Basic**：一个不存在的网站所改良的HTTP基础认证。
- ……

### Web认证

IETF为HTTP认证框架设计了可插拔（Pluggable）的认证方案，原本是希望能涌现出各式各样的认证方案去支持不同的应用场景。尽管上节列举了一些还算常用的认证方案，但目前的信息系统，尤其是在系统对终端用户的认证场景中，直接采用HTTP认证框架的比例其实十分低，这不难理解，HTTP是“超文本传输协议”，传输协议的根本职责是把资源从服务端传输到客户端，至于资源具体是什么内容，只能由客户端自行解析驱动。以HTTP协议为基础的认证框架也只能面向传输协议而不是具体传输内容来设计，如果用户想要从服务器中下载文件，弹出一个HTTP服务器的对话框，让用户登录是可接受的；但如果用户访问信息系统中的具体服务，身份认证肯定希望是由系统本身的功能去完成的，而不是由HTTP服务器来负责认证。这种依靠内容而不是传输协议来实现的认证方式，在万维网里被称为“Web认证”，由于实现形式上登陆表单占了绝对的主流，因此通常也被称为“表单认证"（Form Authentication）。

直至2019年以前，表单认证都没有什么行业标准可循，表单长什么样子、其中的用户字段、密码字段、验证码字段、是否要在客户端加密、采用何种方式加密、接受表单的服务地址是什么等等，都完全由服务端与客户端的开发者自行协商决定。“没有标准的约束”反倒成了表单认证的一大优点，表单认证允许我们做出五花八门的页面，各种程序语言、框架或开发者本身都可以自行决定认证的全套交互细节。

可能你还记得开篇中说的“遵循规范、别造轮子就是最恰当的安全”，这里又将表单认证的高自由度说成是一大优点，好话都让笔者给说全了。笔者提倡用标准规范去解决安全领域的共性问题，这条原则完全没有必要与界面是否美观合理、操作流程是否灵活便捷这些应用需求对立起来。譬如，想要支持密码或扫码等多种登录方式、想要支持图形验证码来驱逐爬虫与机器人、想要支持在登录表单提交之前进行必要的表单校验，等等，这些需求十分具体，不具备写入标准规范的通用性，却具备足够的合理性，应当在实现层面去满足。同时，如何控制权限保证不产生越权操作、如何传输信息保证内容不被窃听篡改、如何加密敏感内容保证即使泄漏也不被逆推出明文，等等，这些问题就有通行的解决方案，明确定义在规范之中，也应当在架构层面去遵循。

表单认证与HTTP认证不见得是完全对立的，两者有不同的关注点，可以结合使用。以Fenix's Bootstore的登录功能为例，页面表单是一个自行设计的Vue.js页面，但认证的整个交互过程就遵循了OAuth 2规范的密码模式来完成。

2019年3月，万维网联盟（World Wide Web Consortium，W3C）批准了由[FIDO](https://fidoalliance.org/)（Fast IDentity Online，一个安全、开放、防钓鱼、无密码认证标准的联盟）领导起草的世界首份Web内容认证的标准“[WebAuthn](https://webauthn.io/)”（在节里，我们只讨论WebAuthn，不会涉及CTAP、U2F和UAF），这里也许又有一些思维严谨的读者会感到矛盾与奇怪，不是才说了Web表单长什么样、要不要验证码、登录表单是否在客户端校验等等是十分具体的需求，不太可能定义在规范上的吗？确实如此，所以WebAuthn彻底抛弃了传统的密码登陆方式，改为直接采用生物识别（指纹、人脸、虹膜、声纹）或者实体密钥（以USB、蓝牙、NFC连接的物理密钥容器）来作为身份凭证，从根本上消灭了用户输入错误产生的校验需求，和防止机器人模拟产生的验证码需求等问题，甚至连表单界面都可能省略掉，所以这个规范不关注界面该是什么样子、要不要验证码、是否要前端校验这些问题。

由于WebAuthn相对比较复杂，在阅读下面内容之前，笔者建议如果你的设备和环境允许，先在[GitHub网站的2FA认证功能](https://github.blog/2019-08-21-github-supports-webauthn-for-security-keys/)中实际体验一下通过WebAuthn完成的两段式登陆，然后再继续阅读后面的内容。硬件方面要求用带有TouchBar的MacBook，或者其他支持指纹、FaceID验证的手机均可，现在应该在售的移动设备基本都带有生物识别装置。软件方面，直至iOS13.6，iPhone和iPad仍未支持WebAuthn，但Android和MacOS系统中的Chrome，以及Windows的Edge浏览器都已经可以正常使用WebAuthn了。

:::center
![](./images/webauthen.png)
Github在不同浏览器上使用WebAuthn登陆
:::

WebAuthn规范涵盖了“注册”与“认证”两大流程，先来介绍注册流程，它大致可以分为以下步骤：

1. 用户进入系统的注册页面，这个页面的格式、内容和用户注册时需要填写的信息均不包含在WebAuthn标准的定义范围内。
2. 当用户填写完信息，点击“提交注册信息”的按钮后，服务端先暂存用户提交的数据，生成一个随机字符串（规范中称为Challenge）和用户的UserID（在规范中称作凭证ID），返回给客户端。
3. 客户端的WebAuthn API接收到Challenge和UserID，把这些信息发送给验证器（Authenticator），验证器可理解为用户设备上TouchBar、FaceID、实体密钥等认证设备的统一接口。
4. 验证器提示用户进行验证，如果你机器支持多种认证设备，还会提示用户选择一个想要使用的设备。验证的结果是生成一个密钥对（公钥和私钥），验证器自己存储好私钥、用户信息以及当前的域名。然后使用私钥对Challenge进行签名，并将签名结果、UserID和公钥一起返回给客户端。
5. 浏览器将验证器返回的结果转发给服务器。
6. 服务器核验信息，检查UserID与之前发送的是否一致，并用公钥解密后得到的结果与之前发送的Challenge是否一致，一致即表明注册通过，服务端存储该UserID对应的公钥。

以上步骤的时序如下图所示：

<mermaid style="margin-bottom: 0px">
sequenceDiagram
    用户->>+浏览器: 访问登陆页面 
    浏览器->>+服务器: HTTP Request
    服务器-->>-浏览器: HTTP Response
    浏览器->>-用户: 登陆页面
    用户->>+浏览器: 点击“注册”按钮
    浏览器->>+服务器: 请求Challenge和UserID
    服务器-->>-浏览器: 返回Challenge和UserID
    浏览器->>+验证器: 请求生成密钥对，并对Challenge签名
    验证器->>用户: 进行生物或物理认证
    用户-->>验证器: 完成认证
    验证器-->>-浏览器: 返回签名信息和公钥
    浏览器->>+服务器: 转发签名信息和公钥到服务器
    服务器-->>-浏览器: 签名信息验证通过
    浏览器-->>-用户: 完成注册
</mermaid>

登陆流程与注册流程相类似，如果你理解了注册流程，登陆就比较简单了。登陆大致可以分为以下步骤：

1. 用户访问登陆页面，填入用户名后即可点击登陆按钮。
2. 服务器返回随机字符串Challenge、用户UserID。
3. 浏览器将Challenge和UserID转发给验证器。
4. 验证器提示用户进行认证操作。由于在注册阶段验证器已经存储了该域名的私钥和用户信息，所以如果域名和用户都相同的话，就不需要生成密钥对了，直接以存储的私钥加密Challenge，然后返回给浏览器。
5. 服务端接收到浏览器转发来的被私钥加密的Challenge，以此前注册时存储的公钥进行解密，如果解密成功则宣告登录成功。

因为登陆流程与注册流程的步骤是基本一致的，笔者就不再单独画登录的时序图了。WebAuthn采用非对称加密的公钥、私钥替代传统的密码，这是非常理想的认证方案，私钥是保密的，只有验证器需要知道它，连用户本人都不需要知道，也就没有人为泄漏的可能；公钥是公开的，可以被任何人看到或存储。公钥可用于验证私钥生成的签名，但不能用来签名，除了得知私钥外，没有其途径能够生成可被公钥验证为有效的签名，这样服务器就可以通过公钥是否能够解密来判断最终用户的身份是否合法。

WebAuthn还一揽子地解决了传统密码在网络传输上的风险，在“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”一节中我们会讲到无论密码是否客户端进行加密、如何加密，对防御中间人攻击来说都是没有意义的。更值得夸赞的是WebAuthn为登录过程带来极大的便捷性，不仅注册和验证的用户体验十分优秀，而且彻底避免了用户在一个网站上泄漏密码，所有使用相同密码的网站都收到攻击的问题，这个优点使得用户无需再为每个网站想不同的密码。

当前的WebAuthn还很年轻，普及率暂时还很有限，但笔者相信几年之内它必定会发展成Web认证的主流方式，被大多数网站和系统所支持。

## 认证的实现

了解过业界标准的认证规范以后，这部分简要介绍一下在Java技术体系内通常是如何实现安全认证的。Java其实也有自己的认证规范，第一个系统性的Java认证规范发布于Java 1.3时代，Sun公司提出了同时面向与代码级安全和用户级安全的认证授权服务[JAAS](https://en.wikipedia.org/wiki/Java_Authentication_and_Authorization_Service)（Java Authentication and Authorization Service，1.3处于扩展包中，1.4纳入标准包），尽管JAAS已经开始照顾了最终用户的认证，但相对而言规范中代码级安全仍然是占更主要的地位。可能今天用过甚至是听过JAAS的Java程序员都已经不多了，但是这个规范提出了很多在今天仍然活跃于主流Java安全框架中的概念，譬如一般把用户存放在“Principal”之中、密码存在“Credentials”之中、登录后从安全上下文“Context”中获取状态等常见的安全概念，都可以追溯到这一时期所定下的API：

- LoginModule （javax.security.auth.spi.LoginModule）
- LoginContext （javax.security.auth.login.LoginContext）
- Subject （javax.security.auth.Subject）
- Principal （java.security.Principal）
- Credentials（javax.security.auth.Destroyable、javax.security.auth.Refreshable）

JAAS开创了这些沿用至今的安全概念，但规范本身实质上并没有得到广泛的应用，笔者认为有两大原因，一方面是由于JAAS同时面向代码级和用户级的安全机制，使得它过度复杂化，难以推广。在这个问题上Java社区一直有做持续的增强和补救，譬如Java EE 6中的JASPIC、Java EE 8中的EE Security：

- JSR 115：[Java Authorization Contract for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr115/index3.html)（JACC）
- JSR 196：[Java Authentication Service Provider Interface for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr196/index2.html)（JASPIC）
- JSR 375： [Java EE Security API](https://jcp.org/en/jsr/detail?id=375)（EE Security）

而另一方面，可能是更重要的一个原因是在21世纪的第一个十年里，以“With EJB”为口号，以WebSphere、Jboss等为代表J2EE容器环境，与以“Without EJB”为口号、以Spring、Hibernate等为代表的轻量化开发框架产生了激烈的竞争，结果是后者获得了全面胜利。这个结果使得依赖于容器安全的JAAS无法得到大多数人的认可。在今时今日，实际活跃于Java安全领域的是两个私有的（私有的意思是不由JSR所规范的，即没有java/javax.*作为包名的）的安全框架：[Apache Shiro](https://shiro.apache.org/)和[Spring Security](https://spring.io/projects/spring-security)。

相较而言，Shiro更便捷易用，而Spring Security的功能则要复杂强大一些。无论是单体架构还是微服务架构的Fenix's Bookstore，笔者都选择了Spring Security作为安全框架，这个选择与功能、性能之类的考量没什么关系，就只是因为Spring Boot、Spring Cloud全家桶的缘故。这里不打算罗列代码来介绍Shiro与Spring Security的具体使用，如感兴趣可以参考Fenix's Bookstore的源码仓库。只从目标上看，两个安全框架提供的功能都很类似，大致包括以下四类：

- 认证功能：以HTTP协议中定义的各种认证、表单等认证方式确认用户身份，这是本节的主要话题。
- 安全上下文：用户获得认证之后，要开放一些接口，让应用可以得知该用户的基本资料、用户拥有的权限、角色，等等。
- 授权功能：判断并控制认证后的用户对什么资源拥有哪些操作许可，这部分内容会放到“[授权](/architect-perspective/general-architecture/system-security/authorization.html)”介绍。
- 密码的存储与验证：密码是烫手的山芋，存储、传输还是验证都应谨慎处理，我们会放到“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”去具体讨论。





