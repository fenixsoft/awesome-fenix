# 认证 

::: tip 认证（Authentication）

系统如何正确分辨出操作用户的真实身份？

:::

认证（Authentication）、授权（Authorization）和凭证（Credentials）可以说是一个系统中最基础的安全设计，再简陋的系统大概也很难省略掉“用户登录”功能，系统为用户提供服务前，总是希望先弄清楚“你是谁？”（认证）、“能干什么？”（授权）以及“如何证明？”（凭证）这三个基本问题的答案。另一方面，认证、授权与凭证这三个基本问题，又并不如部分人所认为的那样，只是“系统登录”功能，校验一下 用户名、密码是否正确这么简单。因为账户信息作为一种必须保障安全和隐私，又同时要兼顾各个系统模块中共享访问的基础主数据，它的存储、管理与使用都面临一系列复杂的问题。对于某些大规模的信息系统，账户管理往往要由专门的基础设施，如微软的活动目录（Active Directory，AD）或者轻量目录访问协议（Lightweight Directory Access Protocol，LDAP）甚至是基于区块链技术去完成。笔者准备使用三节篇幅，介绍互联网系统和企业级系统是如何实现认证、授权与凭证的，涉及到哪些行业规范和标准。

首先澄清一个可能很多人都会有的先入为主的观念：尽管“认证”是解决“你是谁？”的问题，但这里的“你”并不是一定是个人（听着像是骂人的话），也有可能是外部代码，即第三方的类库或者服务。最初对代码认证的重视程度甚至高于对最终用户的认证，譬如最早的Java系统里，安全中的“认证”就是特指“代码级安全”（你是否信任要在你的电脑中运行的代码），这是由Java早期的主要应用形式——Java Applets所决定的：类加载器从远端下载一段Java代码（严谨地说是字节码），以Applets的形式在用户的浏览器中运行，由于Java的语言操作计算机资源的能力要远远强于JavaScript，因此当然要保证这些代码不会损害用户的计算机，否则谁都不敢去用。这一阶段的安全观念催生了现在仍然存在于Java技术体系中的“安全管理器”（java.lang.SecurityManager）、“代码权限许可”（java.lang.RuntimePermission）等概念。如今，对外部类库和服务的认证需求依旧旺盛，但相比起稍后介绍的百花齐放式的最终用户认证来说，代码认证的研究方向已经很固定，基本上都统一到证书签名上。本节我们讨论的范围只针对最终用户认证，代码认证会安排在“分布式的基石”中的“[服务安全](/distribution/secure/service-security.html)”中去讲解。

世纪之交，Java迎来了Web时代的辉煌，互联网迅速兴起促使Java进入了快速发展时期。这时候，基于HTML和JavaScript的超文本Web应用迅速盖过了“Java 2时代”之前的Java Applets应用，B/S系统对最终用户认证的需求使得“安全认证”的重点逐渐从“代码级安全”转向为“用户级安全”（你是否信任正在操作的用户）。在1999年，随J2EE 1.2（它是J2EE的首个版本，初始版本号直接就是1.2）所发布的Servlet 2.2中增加了一系列用于认证的API，主要包括两部分内容：

- 在标准上，添加了四种内置的（不可扩展的）认证方案，即Client-Cert、Basic、Digest和Form。
- 在实现上，添加了与认证和授权相关的一套程序接口，譬如HttpServletRequest::isUserInRole()、HttpServletRequest::getUserPrincipal()等。

原本一项发布超过20年的老旧技术，应该没有多少专门提起的必要，笔者之所以在这里专门引用这件事，是想从它标准和实现的两个改进点中引出一个系统安全的经验原则：以标准规范为指导、以标准接口去实现。安全涉及的问题很复杂，解决方案却也相当的成熟，**对于99%的系统来说，在安全上不去做轮子，不去想发明创造，严格遵循标准就是最恰当的安全**。本文也顺着此思路展开，分别介绍业界中认证的标准规范的做法，以及在Java程序中落地实现的方法。

## 认证的标准

引用J2EE 1.2对安全的改进还有另一个原因，它内置支持的Basic、Digest、Form和Client-Cert四种认证方案很有代表性，刚好分别覆盖了通讯信道、协议和内容层面的认证，这三种层面认证的含义和应用场景笔者列举如下：

- 通讯信道上的认证：你和我建立通讯连接之前，要先证明你是谁。在网络传输（Network）场景中的典型是基于SSL/TLS传输安全层的认证。
- 通讯协议上的认证：你请求获取我的资源之前，要先证明你是谁。在互联网（Internet）场景中的典型是基于HTTP协议的认证。
- 通讯内容上的认证：你使用我提供的服务之前，要先证明你是谁。在万维网（World Wide Web）场景中的典型是基于Web内容的认证。

关于第一点信道上的认证，由于内容较多，又与后续介绍微服务安全方面的话题关系密切，将会独立放到本章的“[传输](/architect-perspective/general-architecture/system-security/transport-security.html)”里（而且J2EE中的Client-Cert其实并不是用于TLS的，以它引出TLS并不合适）。在本节中，我们将会了解基于通讯协议和内容的两种认证方式。

### HTTP认证

前面已经提前用到了一个名词`认证方案`（Authentication Schemes），它就是指“生成能够证明用户身份的凭证的某种方法”，概念来源于HTTP协议的`认证框架`（Authentication Framework）。互联网工程任务组（Internet Engineering Task Force，IETF）在[RFC 7235](https://tools.ietf.org/html/rfc7235)中定义了HTTP协议的通用认证框架，要求所有支持HTTP协议的服务器，当未授权的用户意图访问服务端保护区域的资源时，应返回401 Unauthorized的状态码，同时应在响应报文头里附带以下两个Header项之一（分别代表网页认证和代理认证），告知客户端应该采取何种方式生成能够代表访问者身份的凭证信息：

``` http
WWW-Authenticate: <认证方案> realm=<保护区域的描述信息>
Proxy-Authenticate: <认证方案> realm=<保护区域的描述信息>
```

接收到该响应后，客户端必须遵循服务端指定的认证方案，在请求资源的报文头中加入身份凭证信息，服务端核实通过后才会允许该请求正常返回，否则将返回403 Forbidden。请求头报文应包含以下Header项之一：

```http
Authorization: <认证方案> <凭证内容>
Proxy-Authorization: <认证方案> <凭证内容>
```

综合以上请求、响应的步骤的介绍，HTTP认证框架的工作流程如以下时序所示：

<mermaid style="margin-bottom: 0px">
sequenceDiagram
	客户端->>+服务端: GET /admin 
	服务端-->>-客户端: 401 Unauthorized （WWW-Authenticate）
	客户端->>客户端: Ask user
	客户端->>+服务端: GET /admin（Authorization）
	服务端->>服务端: Check credentials
	服务端-->>-客户端: 200 OK / 403 Forbidden
</mermaid>

HTTP认证框架的设计意图是希望能把“身份认证”的目的与“具体如何认证”的实现分离开来，无论客户端通过生物信息（指纹、人脸）、用户密码、证书（U盾、数字证书）来生成凭证，均可归为是某种关于如何生成凭证的具体实现，均可包容在HTTP协议预设的框架之内。

以上概念性的介绍可能还是有些抽象，笔者以最基础的认证方案`HTTP Basic Authentication`为例，这是一种主要以演示为目的认证方案（在一些不要求安全性的场合也有实际应用，譬如你家的路由器登录很可能就是这种认证方式）。Basic认证生成凭证的方法是让用户输入用户名和密码，然后经过Base64编码“加密”后作为身份凭证。譬如请求资源"GET /admin"时，浏览器收到服务端的如下响应：

```http
HTTP/1.1 401 Unauthorized
Date: Mon, 24 Feb 2020 16:50:53 GMT
WWW-Authenticate: Basic realm="example from icyfenix.cn"
```

此时，浏览器需要询问最终用户，要求提供用户名和密码，会弹出类似下图所示的HTTP Basic认证窗口：

:::center
![Basic-Authentication](./images/Basic-Authentication.png)
HTTP Basic Authentication
:::

当用户输入了密码信息，譬如输入用户名“icyfenix”，密码“123456”，浏览器会将字符串“icyfenix:123456”编码为“aWN5ZmVuaXg6MTIzNDU2”，然后发送回服务端，如下所示：

```http
GET /admin HTTP/1.1
Authorization: Basic aWN5ZmVuaXg6MTIzNDU2
```

由于Base64只是一种编码方式，并非任何形式的加密，Basic认证的风险是显而易见的，因此说它是一种带演示性质的认证方案。除Basic认证外，IETF还定义了很多种可用于生产的认证方案，譬如：

- **Digest**：[RFC 7616](https://tools.ietf.org/html/rfc7616)，HTTP摘要认证，可视为Basic认证的改良版本，针对Base64明文发送的风险，Digest认证把用户名和密码加盐（一个被称为Nonce的变化值）后再通过MD5/SHA等哈希算法取摘要发送出去。可是，无论客户端如何加密，在面临中间人攻击时依然存在不小的安全风险，“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”一节中我们将具体讨论这方面的问题。
- **Bearer**：[RFC 6750](https://tools.ietf.org/html/rfc6750)，基于OAuth 2规范来完成认证，OAuth2是一个同时涉及到认证与授权的协议，我们将在下一节“[授权](/architect-perspective/general-architecture/system-security/authorization.html)”中详细介绍OAuth 2。
- **HOBA**：[RFC 7486](https://tools.ietf.org/html/rfc7486) ，HTTP Origin-Bound Authentication的缩写，一种基于数字签名的认证。

HTTP认证框架中认证方案是允许自行扩展的，不要求一定要在RFC中定义，只要客户端（User Agent，这里就不一定是浏览器了）能够识别该方案即可。很多厂商也加入了自己的认证方式，譬如：

- **AWS4-HMAC-SHA256**：相当简单粗暴的名字，就是亚马逊AWS基于HMAC-SHA256哈希算法的认证。
- **NTLM** / **Negotiate**：这是微软公司NT LAN Manager（NTLM）用到的两种认证方式。
- **Windows Live ID**：这个顾名思义，无需解释。
- **Twitter Basic**：一个不存在的网站所改良的HTTP基础认证。
- ……

### Web认证

HTTP认证框架支持可插拔（Pluggable）的认证方案，本希望能够支持多种应用场景，但目前信息系统中，尤其是系统对终端用户的认证场景中，直接采用HTTP认证框架的比例并其实很小。原因仔细想一下就能明白：HTTP是“超文本传输协议”，首要任务是把资源从服务端传输到客户端，至于资源具体是什么内容，完全是由客户端自行解析驱动的。以HTTP为基础的认证只能面向传输协议而不是具体传输内容来设计，你查看一张图片、下载一个文件、浏览一个HTML页面、或者访问一个复杂的信息系统，都依赖同一套认证框架来支持。如果我从服务器中下载文件，弹个对话框让我登录或许还是可接受的；如果我访问信息系统，身份认证是在系统提供的“登录”功能中完成的，是由提供服务具体内容的信息系统，而不是由HTTP服务器来进行认证，这才是目前信息系统主流的认证方式，通常被称为“表单认证"（Form Authentication）。

直至2019年以前，表单认证都没有什么行业标准可循，表单中的用户字段、密码字段、验证码字段、是否要在客户端加密、采用何种方式加密、接受表单的服务地址是什么等等，都直接由服务端与客户端的开发者自行协商决定。“没有标准的约束”反倒成了表单认证的一大优点，表单认证允许我们做出五花八门的页面，各种程序语言、框架或开发者本身都可以自行决定认证的全套交互细节。

可能你还记得开篇中说的“遵循规范、别造轮子就是最恰当的安全”，这里又将表单认证的高自由度说成是一大优点，初听来有矛盾。细想却并非如此，我们提倡用标准规范去解决安全领域的共性的问题，并不应该与界面是否美观合理、操作流程是否灵活便捷这些应用需求对立起来。譬如，需要支持密码或扫码等多种登录方式、需要引入图形验证码来驱逐爬虫与机器人、需要在登录表单提交之前进行必要的表单校验等等，这些不可能定义在任何规范上，却很合理的应用需求应当被满足。同时，如何控制权限保证不产生越权操作、如何传输信息保证内容不被窃听篡改、如何加密敏感内容保证即使泄漏也不被逆推出明文等等，这些问题都有通行的解决方案，明确定义在规范中的要求也应当被遵循。到了具体实现层面，表单认证与HTTP认证完全可以结合使用，以Fenix's Bootstore的登录功能为例，页面表单是一个自行设计的Vue.js页面，但认证的交互过程遵循了OAuth 2规范的密码模式来完成。

2019年3月，万维网联盟（World Wide Web Consortium，W3C）批准了由[FIDO](https://fidoalliance.org/)（Fast IDentity Online，一个安全、开放、防钓鱼、无密码认证标准的联盟）领导的第一份Web认证的标准“[WebAuthn](https://www.w3.org/TR/webauthn/)”，这里也许又有一些思维严谨的读者会感到矛盾与奇怪，刚才不是才说了Web表单长什么样、要不要验证码、登录表单是否在客户端校验等等是不可能定义在规范上的吗？的确如此，所以WebAuthn彻底抛弃了传统的密码登陆方式，改为直接采用生物识别（指纹、人脸、虹膜、声纹）或者实体密钥（以USB、蓝牙、NFC连接的物理密钥容器）来作为身份凭证，从根本上杜绝了输入错误（校验需求）和机器人模拟（验证码需求）等问题。

WebAuthn是相对比较复杂的认证协议，在阅读接下来的讲解之前，笔者建议如果你的设备和环境允许（硬件基本都没问题，用带有TouchBar的MacBook或者其他支持指纹、FaceID验证的手机即可。软件的话，直至iOS13.6，iPhone仍未支持，但Android和MacOS中的Chrome已经可以使用），先在[GitHub网站](https://github.blog/2019-08-21-github-supports-webauthn-for-security-keys/)的2FA认证上实际体验一下通过WebAuthn进行两段式登陆认证，然后再继续阅读后面的内容。

:::center
![](./images/webauthen.png)
Github在不同浏览器上使用WebAuthen登陆
:::

WebAuthn涵盖了“注册”与“认证”两个流程，先来说注册。注册大致可以分为以下步骤：

1. 用户进入系统的注册页面，这个页面的格式、内容和用户注册时需要填写的信息均不包含在WebAuthn标准的范围内。
2. 当用户填写完信息，点击“注册”按钮后，服务端暂存用户提交的数据，生成一个随机字符串（规范中称为Challenge）和用户的UserID（在规范中称作凭证ID）。
3. 浏览器的WebAuthn API接收到Challenge和UserID，把这些信息发送给验证器（Authenticator，可以理解为你机器上TouchBar、FaceID等认证设备的统一接口）。
4. 验证器提示用户进行验证，如果你机器支持多种认证设备，还会提示用户选择一个想要使用的设备。验证的结果是生成一个密钥对（公钥和私钥），验证器自己存储好私钥、用户信息以及域名。然后使用私钥对Challenge进行签名，并将签名结果、UserID和公钥一起返回给浏览器。
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

登陆流程与注册流程很类似，如果你理解了注册流程，登陆就比较简单了。登陆大致可以分为以下步骤：

1. 用户访问登陆页面，填入用户名后即可点击登陆按钮。
2. 服务器返回随机字符串Challenge、用户UserID。
3. 浏览器将Challenge和UserID转发给验证器。
4. 验证器提示用户进行认证操作。由于在注册阶段验证器已经存储了该域名的私钥和用户信息，所以如果域名和用户都相同的话，就不需要生成密钥对了，直接以存储的私钥加密Challenge，然后返回给浏览器。
5. 服务端接收到浏览器转发来的被私钥加密的Challenge，以此前注册时存储的公钥进行解密，如果解密成功则宣告登录成功。

因为登陆流程与注册流程的步骤是基本一致的，笔者就不单独画登录的时序图了。WebAuthen采用非对称加密的公钥、私钥替代传统的密码，这是非常理想的认证方案，私钥是保密的，只有验证器需要知道它，用户本身都不需要得知，也就没有人为泄漏的可能；公钥是公开的，可以被任何人看到或存储。公钥可用于验证私钥生成的签名，但不能用来签名，因此除了得知私钥外，没有其途径能够生成可被公钥验证为有效的签名，这样服务器就可以通过公钥是否能够解密来判断最终用户的身份是否合法。

WebAuthen还一揽子地解决了传统密码在网络传输上的风险，在“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”一节中我们会讲到无论密码是否客户端进行加密、如何加密，对防御中间人攻击来说都是没有意义的。更值得夸赞的是WebAuthen为登录过程带来极大的便捷性，不仅注册和验证的用户体验十分优秀，而且彻底避免了用户在一个网站上泄漏密码，所有使用相同密码的网站都收到攻击的问题，这个优点使得用户无需再为每个网站想不同的密码。当前的WebAuthen还很年轻，普及率暂时还很有限，但笔者相信几年之内它必定会发展成Web认证的主流方式，被大多数网站和系统所支持。

## 认证的实现

了解过业界标准的认证规范以后，这节我们简要地介绍一下在Java技术体系内、在Fenix's Bookstore中具体是如何去实现安全认证的。Java其实也有自己的认证规范，第一个系统性的Java认证规范发布于Java 1.3时代，Sun公司提出了同时面向与代码级安全和用户级安全的认证授权服务[JAAS](https://en.wikipedia.org/wiki/Java_Authentication_and_Authorization_Service)（Java Authentication and Authorization Service，1.3处于扩展包中，1.4纳入标准包），尽管JAAS已经开始照顾了最终用户的认证，但相对而言规范中代码级安全仍然是占更主要的地位。可能今天用过甚至是听过JAAS的Java程序员都已经不多了，但是这个规范提出了很多在今天仍然活跃于主流Java安全框架中的概念，譬如用户叫做“Subject / Principal”、密码存在“Credentials”之中、登录后从安全上下文“Context”中获取状态等常见设计都可以追溯到这一时期所定下的API：

- LoginModule （javax.security.auth.spi.LoginModule）
- LoginContext （javax.security.auth.login.LoginContext）
- Subject （javax.security.auth.Subject）
- Principal （java.security.Principal）
- Credentials（javax.security.auth.Destroyable、javax.security.auth.Refreshable）

JAAS开创了这些沿用至今的安全概念，但规范本身实质上并没有得到广泛的应用，笔者认为有两大原因，一方面是由于JAAS同时面向代码级和用户级的安全机制，使得它过度复杂化，难以推广。在这个问题上Java社区一直有做持续的增强和补救，譬如Java EE 6中的JASPIC、Java EE 8中的EE Security：

- JSR 115：[Java Authorization Contract for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr115/index3.html)（JACC）
- JSR 196：[Java Authentication Service Provider Interface for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr196/index2.html)（JASPIC）
- JSR 375： [Java EE Security API](https://jcp.org/en/jsr/detail?id=375)（EE Security）

而另一方面，可能是更重要的一个原因是在21世纪的第一个十年里，以EJB为代表的容器化J2EE与以“Without EJB”为口号、以Spring、Hibernate等为代表的轻量化企业级开发框架发生了激烈的竞争，结果是后者获得了全面胜利。这个结果使得依赖于容器安全的JAAS无法得到大多数人的认可。在今时今日，实际活跃于Java安全领域的是两个私有的（私有的意思是不由JSR所规范的，即没有java/javax.*作为包名的）的安全框架：[Apache Shiro](https://shiro.apache.org/)和[Spring Security](https://spring.io/projects/spring-security)。

相较而言，Shiro使用更为便捷易用，而Spring Security的功能则要复杂强大一些。Fenix's Bookstore（无论是单体架构还是微服务架构）选择了Spring Security作为安全框架，这个选择与功能、性能之类的考虑都没什么关系，就只是因为Spring Boot/Cloud全家桶的原因。从目标上看，以上两个安全框架都解决的问题都很类似，大致包括以下四类：

- 认证功能：以HTTP协议中定义的各种认证、表单等认证方式确认用户身份，这是本节的主要话题。
- 安全上下文：用户获得认证之后，要开放一些接口，让应用可以得知该用户的基本资料、用户拥有的权限、角色等。
- 授权功能：授权在代码实现的角度来看主要就是访问控制（Access Control），但授权从标准的角度看仍然许多值得讨论的话题，这部分内容会放到“[授权](/architect-perspective/general-architecture/system-security/authorization.html)”去介绍。
- 密码的存储与验证：密码是烫手的山芋， 无论存储、传输还是验证都很麻烦，我们会放到“[保密](/architect-perspective/general-architecture/system-security/confidentiality.html)”去具体讨论。





