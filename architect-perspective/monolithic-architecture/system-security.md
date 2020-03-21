# √ 安全 <Badge text="进行中" type="warning"/>

即使只限定在“软件架构设计”这个语境下，系统安全仍然是一个很大的话题。我们谈论的计算机系统安全，远不仅指“系统被黑客攻击”这样狭隘的“安全”。架构安全性至少应包括了（不限于）以下这些问题的具体解决方案：

- **认证**（Authentication）：系统如何正确分辨出操作用户的真实身份？

- **授权**（ Authorization）：系统如何控制一个用户该看到哪些数据、能操作哪些功能？

- **凭证**（Credentials）：系统如何保证它与用户之间的车承诺是双方当时真实意图的体现，是准确、完整且不可抵赖的？

- **保密**（Confidentiality）：系统如何保证敏感数据无法被包括系统管理员在内的内外部人员所窃取、滥用？

- **验证**（Verification）：系统如何确保提交到每项服务中的数据是合乎规则的，不会对系统稳定性、数据一致性、正确性产生风险？

- **传输安全**（Transport Security）：系统如何保证通过网络传输的信息无法被第三方窃听、篡改和冒充？

- **漏洞利用**（Exploit）：系统如何避免在基础设施和应用程序中出现弱点，被攻击者利用？

- ……

上面这些安全相关的问题，解决起来确实是既繁琐复杂，又难以或缺。值得庆幸的是这一部分内容基本上都是与具体系统、具体业务无关的通用性问题、这意味着它们会存在着业界通行的，已被验证过是行之有效的解决方案，乃至已经形成某一些行业标准，不需要我们自己从头去构思如何解决。后面我们将会通过标准的方案，逐一探讨以上问题的主流处理方法。

还有其他一些安全相关的内容，主要由管理、运维、审计方面负责，尽管软件架构也需要配合参与，但不列入本文的讨论范围之中，譬如：安全审计、系统备份与恢复、防治病毒、信息系统安全法规与制度、计算机防病毒制度、保护私有信息规则，等等。

## 认证

::: tip 认证（Authentication）

系统如何正确分辨出操作用户的真实身份？

:::

“认证”可以说是一个系统中最基础的安全设计，再简陋的系统大概也不大可能省略掉“用户登录”功能。但“认证”这件事情又并不如大多数人所认为的那样，校验一下 用户名、密码是否正确这么简单。尤其是在基于Java的软件系统里，尝试去触接了解Java安全标准的人往往会对一些今天看起来很别扭的概念产生疑惑。在这一部分，将简要概览一下关于认证的主流行业规范、标准；项目中具体如何认证、授权的内容放到下一节去介绍。

最初的Java系统里，安全中的“认证”其实是特指“代码级安全”（你是否信任要在你的电脑中运行的代码），这是由“Java 2”之前它的主要应用形式Applets所决定的：从远端下载一段Java代码，以Applet的形式在用户的浏览器中运行，当然要保证这些代码不会损害用户的计算机才行。这一阶段的安全催生了今天仍然存在于Java体系中的“安全管理器”（java.lang.SecurityManager）、“代码权限许可”（java.lang.RuntimePermission）这些概念。

不久之后，Java迎来了互联网的迅速兴起，进入了Java第一次快速发展时期，基于超文本的Web应用迅速盖过了“Java 2”时代之前的Applet，此时“安全认证”的重点逐渐转为“用户级安全”（你是否信任正在操作的用户）。在1999年随着J2EE 1.2（它是J2EE的首个版本，版本号直接就是1.2）所发布的Servlet 2.2中增加了一系列认证的API，诸如：

- HttpServletRequest.isUserInRole()
- HttpServletRequest.getUserPrincipal()
- 还内置支持了四种硬编码、不可扩展的认证机制：BASIC、FORM、CLIENT-CERT和DIGEST。

到Java 1.3时代中，Sun公司提出了同时面向与代码级安全和用户级安全的认证授权服务JAAS（Java Authentication and Authorization Service，1.3处于扩展包中，1.4纳入标准包），不过相对而言，在JAAS中代码级安全仍然是占更主要的地位。

由于用户数据可能来自于各种不同的数据源（譬如RDBMS、JNDI、LDAP等等），JAAS设计了一种插入式（Pluggable）的认证和授权模型，以适配各种环境。在今天仍然活跃的主流安全框架中的许多概念，譬如用户叫做“Subject / Principal”、密码存在“Credentials”之中、登陆后从安全上下文“Context”中获取状态等都可以追溯到这一时期所设计的API：

- LoginModule （javax.security.auth.spi.LoginModule）
- LoginContext （javax.security.auth.login.LoginContext）
- Subject （javax.security.auth.Subject）
- Principal （java.security.Principal）
- Credentials（javax.security.auth.Destroyable、javax.security.auth.Refreshable）

但是，尽管JAAS开创了许多沿用至今的安全概念，实质上并没有得到广泛的应用。这里有两大原因，一方面是由于JAAS同时面向代码级和用户级的安全机制，使得它过度复杂化，难以推广。在这里问题上JCP一直在做着持续的增强和补救，譬如Java EE 6中的JASPIC、Java EE 8中的EE Security：

- JSR 115：[Java Authorization Contract for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr115/index3.html)（JACC）
- JSR 196：[Java Authentication Service Provider Interface for Containers](https://jcp.org/aboutJava/communityprocess/mrel/jsr196/index2.html)（JASPIC）
- JSR 375： [Java EE Security API](https://jcp.org/en/jsr/detail?id=375)（EE Security）

而另一方面，可能是更重要的一个原因是在21世纪的第一个十年里，以EJB为代表的容器化J2EE与以“Without EJB”为口号、以Spring、Hibernate等为代表的轻量化企业级开发框架之争，以后者的胜利而结束。这也使得依赖于容器安全的JAAS无法得到大多数人的认可。

在今时今日，实际活跃于Java届的两大私有的（私有的意思是不由JSR所规范的，即没有java/javax.*作为包名的）的安全框架：

- [Apache Shiro](https://shiro.apache.org/)
- [Spring Security](https://spring.io/projects/spring-security)

相较而言，Shiro使用更为便捷易用，而Spring Security的功能则要复杂强大一些。在我们的项目中（无论是单体架构还是微服务架构），均选择了Spring Security作为安全框架。当然，这里面也有很大一部分是因为Spring Boot/Cloud全家桶的原因。这两大安全框架都解决的问题都很类似，大致可以分为四类：

- 认证：以HTTP协议中定义的各种认证、表单等认证方式确认用户身份，这是本节的主要话题。
- 授权：主要是授权结果，即访问控制（Access Control），稍后讲的“授权”将聚焦在授权的过程，尤其是多方授权中。这部分内容会放到下一节一起讨论。
- 密码的存储：就是字面意思，我们会放到“保密”这节去一起讨论。
- 安全上下文：用户获得认证之后，需要有API可以得知该用户的基本资料、用户拥有的权限、角色等。

介绍了一大段关于Java中安全标准的历史，我们最终还是要切入到如何处理认证的话题上，这可是随着网络出现就有的一个东西，所以，IETF的最初想法是基于Web的验证就应该在HTTP协议层面来解决。

> **互联网工程任务组**（Internet Engineering Task Force，IETF）：管理和发布互联网标准的组织，其标准以RFC即"请求意见稿"Request for Comments的形式发出。不仅是HTTP，几乎目前所有的主要网络协议，如IP、TCP、UDP、FTP、CMIP、SOCKS，等等都是以RFC形式定义的。

IETF给HTTP 1.1协议定义了401（Unauthorized，未授权）状态码，当服务端向客户端返回此状态码时，应在Header中附带一个WWW-Authenticate项，此项目通过跟随的一个可扩展的Scheme，告诉客户端应该采取怎样的方式来开始验证，例如：

```
HTTP/1.1 401 Unauthorized
Date: Mon, 24 Feb 2020 16:50:53 GMT
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
- **Windows Live ID**：这个不需要解释了
- **Twitter Basic**：一个不存在的网站所改良的HTTP基础认证
- ……

现在主流的信息系统，直接采用上面这些认证方式比例不算太高，目前的主流仍是Form表单认证，即我们通常所说的“登陆页面”。表单认证并没有什么行业标准可循，表单中的用户字段、密码字段、验证码字段、是否要在客户端加密、加密的方式、接受表单的服务入口等都可由服务端、客户端自行协商决定。

在Fenix's Bookstore项目中，我们所设计的登录实质上也是一种表单认证，借用了Spring Security的认证管理器。Spring Security中提供了默认的登陆表单界面和配套的服务，只要在Spring Security的Web安全中简单配置即可启用：

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
                .antMatchers("/").permitAll() // 首页地址'/'的请求都允许访问
                .anyRequest().authenticated() // 任何请求,登录后才可以访问
                .and()
                .formLogin()  // 启用表单登录认证，还有另一种httpBasic()方法代表了HTTP基础认证
                .permitAll(); // 登录页面用户任意访问
                .and()
                .logout().permitAll(); // 注销的服务任意访问
    }    
}
```

Spring Security的权限控制措施在两个层面进行，一种Web级别的访问控制，这是在Web服务器中附加的过滤器（FilterSecurityInterceptor）实现的，另一种是方法级权限控制，是通过动态代理实现的。第二种将在下一节“授权”部分中提及，这里先来说第一种。

当Spring Security被启动时（在Spring Boot中通过@EnableWebSecurity注解启动），将会在Web服务器中附加十几个不同作用的过滤器，譬如上面代码就直接涉及到其中三个：

- SecurityContextPersistenceFilter：用于维护安全上下文，“上下文”说白了就是如果用户登陆了系统，那服务的代码中总该有个地放可以取到当前登陆用户是谁这类信息

- UsernamePasswordAuthenticationFilter：用于完成用户名、密码的验证过程

- LogoutFilter：用于注销

- FilterSecurityInterceptor：用于Web级别的访问控制，如果设置了指定地址需要登陆而实际未登陆，或者设定了需要某些权限才能访问而实际用户并没有，那将抛出AuthenticationException与AccessDeniedException异常

让我们再回到上面的代码，这段简单的工作流程是：

1. 启用过滤器UsernamePasswordAuthenticationFilter，在其attemptAuthentication()方法中，会从Request中获取用户名和密码，传递给认证管理器AuthenticationManager的authenticate()方法
3. 认证管理器的目的是协调不同的用户来源，譬如来自数据库、来自LDAP、来自OAuth等等，每一个用户来源都应该有一个实现了AuthenticationProvider接口并注册到认证管理器的实现类所代表，认证管理器将根据需要，调用对应Provider的authenticate()方法实际完成认证操作。
4. Spring Security默认的Provider是DaoAuthenticationProvider，它在Bookstore项目中并未被采用，而是另外实现了一个UsernamePasswordAuthenticationProvider。但是两者的实际逻辑是相似的，都是调用UserDetailsService接口里的loadUserByUsername()来获取用户信息，UserDetailsService是读取用户明细数据的接口，Spring Security并不关心用户系统的实际存储结构，但认证时肯定也必须使用到用户信息，默认使用InMemoryUserDetailsManager，也就是从内存中写死一些用户数据来完成。
6. 在AuthenticationProvider中比较传入的用户密码与数据库中的用户密码是否一致（具体怎么个比较法将在“保密”这一节中说明），返回结果，完成认证。

以上流程是大多数系统，尤其是单体系统中主流的认证方式，哪怕不采用Spring Security实现，思路大致也是差不多的，但我们也并未直接应用，而是借用了OAuth2授权协议中的密码授权模式，在此过程中完成认证。为何会选择这种方式，以及具体实现部分的内容，将在下一部分“授权”中继续介绍。

## 授权

::: tip 授权（ Authorization）

系统如何控制一个用户该看到哪些数据、能操作哪些功能？

:::

“授权”这个行为通常伴随着“认证“、”账号“共同出现，并称为AAA（Authentication、Authorization、Account）。授权行为在程序中其实非常普遍，我们给一个类、一个方法设置范围控制符（public、protected、private、\<Package\>），这其实也是一种授权（访问控制）行为。授权涉及到了两个相对独立的问题：

- 确保授权的过程可靠：对于单一系统来说，授权的过程是比较容易做到可控的，以前很多语境上提到授权，实质上讲的都是访问控制，理论上两者是应该分开的。而在涉及多方的系统中，授权过程就是一个必须严肃对待的问题：如何即让第三方系统能够访问到所需的资源，又能保证其不泄露用户的敏感数据？现在常用的多方授权协议主要有OAuth2和SAML 2.0（注意这两个协议涵盖的功能并不是直接对等的）。

- 确保授权的结果可控：授权的结果往往是用于对程序功能或者资源的访问控制（Access Control），形成理论的权限控制模型有：自主访问控制（Discretionary Access Control，DAC）、强制访问控制（Mandatory Access Control，MAC）、基于属性的权限验证（Attribute-Based Access Control，ABAC）还有最为常用，也相对通用的是基于角色的权限模型（Role-Based Access Control，RBAC）。

由于篇幅原因，在这个小节里我们只介绍（将要）使用到的，也是最常用到的RBAC和OAuth2。先来说较为简单的RBAC。

### RBAC

所有的访问控制模型，实质上都是在解决同一个问题：“**谁**（User）”拥有什么"**权限**（Authority）"去操作哪些“**资源**（Resource）”

这个问题看起来并不难，最直观的解决方案就是在用户对象上，设定一些操作权限，在使用资源时，检查是否有对应的操作权限即可。是的，请不要因太过简单直接而产生疑惑——Spring Security的访问控制本质上就是这么做的。不过，这种把操作权限直接关联在用户身上的简单设计，在复杂系统上确实会导致比较繁琐的操作。试想一下，如果某个系统涉及到成百上千的资源，又有成千上万的用户，要为每个用户分配合适的权限将带来务必庞大的操作量和极高的出错概率，这也即是RBAC所要解决的问题。

为了避免对每一个用户设定权限，RBAC将权限从用户身上剥离，改为绑定到“**角色**（Role）”上，一种我们常见的RBAC应用就是操作系统权限中的“用户组”，这就是一种角色。用户可以隶属与一个或者多个角色，某个角色中也会包含有多个用户，角色之间还可以有继承性（父、子角色的权限继承，RBAC1）。这样，资源的操作就只需按照有限且相对固定的角色去分配操作权限，而不去面对随时会动态增加的用户去分配。当用户的职责发生变化时，在系统中就体现为改变他所隶属的角色，譬如将“普通用户角色”改变“管理员角色”，就可以迅速完成其权限的调整，降低了权限分配错误的风险。RBAC的主要元素之间的关系可以以下图来表示：
<mermaid>
graph LR
    User("用户（User）") --隶属--> Role("角色（Role）") 
    Role --拥有-->Permission("许可（Permission）") 
</mermaid>
上图中出现了一个新的名词“**许可**（Permission）”。所谓的许可，就是抽象权限的具象化体现。权限在系统中的含义应该是“允许何种**操作**作用于哪些**数据**之上”，这个即为“许可”。举个具体的例子，譬如某个文章管理系统的UserrStory中，与访问控制相关的Backlog可能会是这样描述的：

> **Backlog**：
>
> **小周**（User）是某SCI杂志的**审稿人**（Role），职责之一是在系统中**审核论文**（Authority）。在**审稿过程**（Session）中，当他认为某篇**论文**（Resource）达到了可以公开发表标准时，就会在后台**点击通过按钮**（Operation）来完成审核。

以上，“给论文点击通过按钮”就是一种许可（Permission），它是“审核论文”这项权限的具象化体现。

与微服务架构中的完全遵循RBAC进行访问控制的Kubernetes不同，我们在单体架构中使用的Spring Security参考了但并没有完全按照RBAC来进行设计。Spring Security的设计里用户和角色都可以拥有权限，譬如在HttpSecurity对象上，就同时有着hasRole()和hasAuthority()方法，可能有不少刚接触的人会疑惑，混淆它们之间的关系。在Spring Security的访问控制模型可以认为是下图所示这样的：
<mermaid>
graph LR
    User("用户（User）") --隶属--> Role("角色（Role）") 
    User --赋予--> Authority("权限（Authority）")
    Role --拥有-->Permission("许可（Permission）") 
    Authority --拥有--> Permission
</mermaid>
站在代码实现的角度来看，Spring Security中Role和Authority的差异很小，它们共同存储在同一位置，唯一的差别仅是Role会在存储时自动带上“ROLE_”前缀（可以配置的）罢了。

但在使用者的角度来看，Role和Authority的差异可以很大，你可以执行决定你的系统中到底Permission只能对应到角色身上，还是可以让用户也拥有某些角色中没有的权限。这个观点，在Spring Security自己的文档上说的很清楚：这取决于你自己如何使用。

> **The core difference between these two is the semantics we attach to how we use the feature.** For the framework, the difference is minimal – and it basically deals with these in exactly the same way.

使用RBAC，你可以控制最终用户在广义和精细级别上可以做什么。您可以指定用户是管理员，专家用户还是普通用户，并使角色和访问权限与组织中员工的身份职位保持一致。仅根据需要为员工完成工作的足够访问权限来分配权限。

### OAuth2

简要介绍过RBAC，下面我们再来看看相对要复杂繁琐写的OAuth2授权协议。先明确一件事情，OAuth2是一个多方系统中的授权协议，如果你的系统并不涉及到第三方（譬如我们单体架构的Bookstore，即不为第三方提供服务，也不使用第三方的服务），引入OAuth2其实并无必要。我们之所以把OAuth2提前引入，主要是为了给微服务架构做铺垫。

OAuth2是在[RFC 6749](https://tools.ietf.org/html/rfc6749)中定义授权协议，在RFC 6749正文的第一句就明确了OAuth2是解决第三方应用（Third-Party  Application）的授权协议。前面也说到，如果只是单方系统，授权过程是比较容易解决的，至于多方系统授权过程会有什么问题，这里举个现实的例子来说明。

譬如你现在正在阅读的这个网站（[http://icyfenix.cn](http://icyfenix.cn)），它的建设和更新大致流程是：笔者以Markdown形式写好了某篇文章，上传到由[GitHub](https://github.com)提供的[代码仓库](https://github.com/fenixsoft/awesome-fenix)，接着由[Travis-CI](https://travis-ci.com)提供的持续集成服务会检测到该仓库发生了变化，触发一次Vuepress编译活动，生成目录和静态的HTML页面，然后推送回GitHub Pages，再触发腾讯云CDN的缓存刷新。这个过程要能顺利进行，就存在一些必须解决的授权问题，Travis-CI只有得到了我的明确授权，GitHub才能同意它读取我代码仓库中的内容，问题是它该如何获得我的授权呢？一种简单粗暴的方案是我把我的用户账号和密码都告诉Travis-CI，但这显然导致了以下这些问题：

- **密码泄漏**：如果Travis-CI被黑客攻破，将导致我GitHub的密码也同时被泄漏
- **访问范围**：Travis-CI将有能力读取、修改、删除、更新我放在GitHub上的所有代码仓库
- **授权回收**：我只有修改密码才能回收授予给Travis-CI的权力，可是我在GitHub的密码只有一个，修改了意味着所有别的第三方的应用程序会全部失效

以上出现的这些问题，也就是OAuth2所要解决的问题。OAuth2提出的解决办法是通过一个令牌（Token）代替用户密码作为授权的凭证，有了令牌之后，哪怕令牌被泄漏，也不会导致密码的泄漏，令牌上可以设定访问资源的范围以及时效性，每个应用都持有独立的令牌，哪个失效都不会波及其他，一下子上面提出的三个问题都解决了，有了一层令牌之后，整个授权的流程如下图所示：
<mermaid>
sequenceDiagram
    第三方应用->>资源所有者: 要求用户给予授权
    资源所有者->>第三方应用: 同意给予该应用授权
    第三方应用->>授权服务器: 我有用户授权，申请访问令牌
    授权服务器->>第三方应用: 同意发放访问令牌
    第三方应用->>资源服务器: 我有访问令牌，申请开放资源
    资源服务器->>第三方应用: 同意开放资源
</mermaid>

这个时序图里面涉及到了OAuth2中几个关键术语，我们通过前面那个具体的上下文语境来解释其含义，这对理解后续几种认证流程十分重要：

- **第三方应用**（Third-Party  Application）：需要得到授权访问我资源的那个应用，即“Travis-CI”
- **授权服务器**（Authorization Server）：能够根据我的意愿提供授权（授权之前肯定已经进行了必要的认证过程，但这在技术上与授权可以没有直接关系）的服务，即“GitHub”
- **资源服务器**（Resource Server）：能够提供第三方应用所需资源的服务（它与认证服务可以是相同的服务器，也可以是不同的服务器），即“代码仓库”
- **资源所有者**（Resource Owner）： 拥有授权权限的人，这里即是“我”
- **操作代理**（User Agent）：指用户用来访问服务器的工具，对于指代人类的“用户”来说这个通常就是浏览器，但在微服务中一个服务经常会作为另一个服务的"用户"，此时指的可能就是HttpClient、RPCClient或者其他访问途径。

看来“用令牌代替密码”确实是解决问题的好方法，但这最多只能算个思路，距离执行步骤还是不够的，时序图中的“要求/同意授权”、“要求/同意发放令牌”、“要求/同意开放资源”几个服务请求、响应该如何设计，这就是执行步骤的关键了。对此，OAuth2一共提出了四种授权方式（这就是我说OAuth2复杂繁琐的原因，摊手），分别为：

- 授权码模式（Authorization Code）
- 简化模式（Implicit）
- 密码模式（Resource Owner Password Credentials）
- 客户端模式（Client Credentials）

#### 授权码模式

授权码模式是四种模式中最严谨（繁琐）的，它考虑到了几乎所有敏感信息泄漏的预防和后果。具体步骤的时序如下：
<mermaid>
sequenceDiagram
	资源所有者 ->> 操作代理: 通过操作代理访问应用
	操作代理 ->> 第三方应用: 遇到需要使用的资源
	第三方应用 ->> 授权服务器: 转向授权服务器的授权页面
	资源所有者 ->> 授权服务器: 认证身份，同意授权
	授权服务器 ->> 操作代理: 返回第三方应用预注册的回调地址，附带授权码
	操作代理 ->> 第三方应用: 转向回调地址
	第三方应用 ->> 认证服务器: 将授权码发回给授权服务器，换取访问令牌
	授权服务器 ->> 第三方应用: 给予访问令牌
	opt  资源访问过程 
		第三方应用 ->> 资源服务器: 提供访问令牌
		资源服务器 ->> 第三方应用: 提供返回资源
		第三方应用 ->> 资源所有者: 返回对资源的处理给用户
	end
</mermaid>

在开始完成整个授权过程以前，第三方应用先要到授权服务器上进行注册，所谓注册，需要提供一个回调地址URI，从授权服务器中获取ClientID和ClientSecret，然后可以开始如下授权过程：
1. 第三方应用将资源所有（用户）者导向授权服务器的授权页面，并向授权服务器提供ClientID，这是一个客户端页面转向。
2. 授权服务器根据ClientID确认第三方应用的身份，用户在授权服务器中决定是否同意向该身份的应用进行授权（认证的过程在此之前应该已经完成）。
3. 如果用户同意授权，授权服务器将转向地第三方应用注册时预留好的回调地址URI，并附带上一个授权码和获取令牌的地址作为参数，这也是一个客户端页面转向。
4. 第三方应用通过回调地址收到授权码，然后将授权码与自己的ClientSecret一起作为参数，**通过服务端**向授权服务器提供的获取令牌的服务地址发起请求，换取令牌。
5. 授权服务器核对授权码和ClientSecret，确认无误后，向第三方应用授予令牌。令牌可以是一个或者两个，其中必定要有的是访问令牌（Access Token），可选的是刷新令牌（Refresh Token）。访问令牌用于到资源服务器获取资源，有效期较短，刷新令牌用于在访问令牌失效后重新获取，有效期较长。
6. 资源服务器根据访问令牌所允许的权限，向第三方应用提供资源。

这个过程设计，已经考虑到了几乎所有合理的意外情况，包括：

- 会不会有其他应用冒充第三方应用骗取授权？<br>
  ClientID代表一个第三方应用的“用户名”，这个是可以完全公开的。但ClientSecret应当只有应用自己才知道，这个代表了第三方应用的“密码”。在第5步发放令牌时，调用者必须能够提供ClientSecret才能成功完成。
- 为什么要先发放授权码，再用授权码换令牌？<br>
  这是因为客户端转向（通常就是一次HTTP 302重定向）对于用户是可见的，换而言之，授权码完全可能会暴露给用户（以及用户机器上的其他程序），但由于用户并没有ClientSecret，光有授权码也是无法换取到令牌的，所以避免了令牌在传输转向过程中泄漏的风险。
- 为什么要设计一个时限较长的刷新令牌和时限较短的访问令牌？不能直接把访问令牌的时间调长吗？<br>
  这是为了缓解OAuth2在**实际应用**中的一个主要缺陷，通常访问令牌一旦发放，除非超过了令牌中的有效期，否则很难（需要付出较大代价）有其他方式让它失效，所以访问令牌的时效性一般设计的比较短（譬如几个小时），如果还需要继续用，那就定期用刷新令牌去更新，授权服务器就可以在更新过程中决定是否还要继续给予授权。至于为什么说很难让它失效，我们将放到下一节“凭证”中解释这一点。

尽管授权码模式是严谨的，但是它不够好用，这不仅仅体现在它那繁复的调用过程上，还体现在它对第三方应用提出了一个具体的要求：必须有服务端（因为第4步要发起服务端转向）。不要觉得要求一个系统要有服务端是就天经地义的事情，本站的示例程序（[http://bookstore.icyfenix.cn](http://bookstore.icyfenix.cn)）就没有服务端支持，里面使用到了GitHub Issue作为留言板，照样是第三方应用，需要OAuth2授权来解决，更多的情况是现在越来越普遍的node.js应用。所以在此需求里，引出了OAuth2的第二种授权模式：隐式授权。

#### 隐式授权

隐式授权省略掉了通过授权码换取令牌的步骤，整个授权过程都不需要服务端支持。它