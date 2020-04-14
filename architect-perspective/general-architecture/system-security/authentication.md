# 认证 

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

:::quote 互联网工程任务组（Internet Engineering Task Force，IETF）
管理和发布互联网标准的组织，其标准以RFC即"请求意见稿"Request for Comments的形式发出。不仅是HTTP，几乎目前所有的主要网络协议，如IP、TCP、UDP、FTP、CMIP、SOCKS，等等都是以RFC形式定义的。
:::

IETF给HTTP 1.1协议定义了401（Unauthorized，未授权）状态码，当服务端向客户端返回此状态码时，应在Header中附带一个WWW-Authenticate项，此项目通过跟随的一个可扩展的Scheme，告诉客户端应该采取怎样的方式来开始验证，例如：

```http
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
2. 认证管理器的目的是协调不同的用户来源，譬如来自数据库、来自LDAP、来自OAuth等等，每一个用户来源都应该有一个实现了AuthenticationProvider接口并注册到认证管理器的实现类所代表，认证管理器将根据需要，调用对应Provider的authenticate()方法实际完成认证操作。
3. Spring Security默认的Provider是DaoAuthenticationProvider，它在Bookstore项目中并未被采用，而是另外实现了一个UsernamePasswordAuthenticationProvider。但是两者的实际逻辑是相似的，都是调用UserDetailsService接口里的loadUserByUsername()来获取用户信息，UserDetailsService是读取用户明细数据的接口，Spring Security并不关心用户系统的实际存储结构，但认证时肯定也必须使用到用户信息，默认使用InMemoryUserDetailsManager，也就是从内存中写死一些用户数据来完成。
4. 在AuthenticationProvider中比较传入的用户密码与数据库中的用户密码是否一致（具体怎么个比较法将在“保密”这一节中说明），返回结果，完成认证。

以上流程是大多数系统，尤其是单体系统中主流的认证方式，哪怕不基于Apache Shiro或Spring Security来实现，其思路很可能也是与上面描述的差不多的。但我们的Bookstore却并未直接应用这种认证方式，而是借用了OAuth2授权协议中的密码授权模式，在此过程中完成认证。为何会选择这种方式，以及具体实现部分的内容，将在下一部分“授权”中继续介绍。