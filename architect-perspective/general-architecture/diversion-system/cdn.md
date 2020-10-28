# 内容分发网络

::: tip 内容分发网络（Content Distribution Network）

CDN是一种十分古老而又十分透明，没什么存在感的分流系统，许多人都说听过它，但真正了解过它的人却很少。

:::

前面几个小节介绍了客户端缓存、域名解析、链路优化，这节我们来讨论它们的一个经典的综合运用案例：[内容分发网络](https://en.wikipedia.org/wiki/Content_delivery_network)（Content Distribution Network，CDN，也有写作Content Delivery Network）。

内容分发网络是一种十分古老的应用，以至于笔者相信阅读本文的受众至少有八、九成应该对它有不同程度的了解的——起码是听说过它的名字的。如果把某个互联网系统比喻为一家开门营业的企业，那内容分发网络就是它遍布世界各地的分支销售机构，客户要买一块CPU就订机票飞到美国加州Intel总部去那肯定是不合适的，到本地电脑城找个装机铺才是正常人类的做法，此场景里，内容分发网络就相当于电脑城那吆喝着CPU三十块钱一斤的本地经销商。

内容分发网络又是一种十分透明的应用，以至于笔者相信阅读本文的受众至少有八、九成应该对它是如何为互联网站点分流、对它的工作原理并没有什么系统性的概念——起码没有自己亲自使用过。

如果抛却其他影响服务质量的因素，仅从网络传输的角度看，一个互联网系统的速度快慢取决于以下四点因素：

1. 网站服务器接入网络运营商的链路所能提供的出口带宽。
2. 用户客户端接入网络运营商的链路所能提供的入口带宽。
3. 从网站到用户之间经过的不同运营商之间互联节点的带宽，一般来说两个运营商之间只有固定的若干个点是互通的，所有跨运营商之间的交互都要经过这些点。
4. 从网站到用户之间的物理链路传输时延。爱打游戏的同学应该都清楚，延迟（Ping值）比带宽更重要。

以上四个网络问题，除了第二个只能由用户掏腰包装个更好的宽带才能够解决之外，其余三个都能通过内容分发网络来显著改善的。一个运作良好的内容分发网络，能为互联网系统解决跨运营商、跨地域物理距离所导致的时延问题，能为网站流量带宽起到分流、减负的作用。举个例子，如果不是有遍布全国乃至全世界的阿里云CDN网络支持，哪怕把整个杭州所有市民上网的权力都剥夺了，把带宽全部让给淘宝的机房，恐怕也撑不住双十一全国乃至全球用户的疯狂围殴。

内容分发网络的工作过程，主要涉及到路由解析、内容分发、负载均衡和所能支持的应用内容四个方面，由于下一节会专门讨论负载均衡的内容，所以这部分在本节就暂不涉及，我们来逐一了解CDN其余三个方面。

## 路由解析

介绍DNS域名解析时，笔者曾提到翻译域名无需像查电话本一样刻板地一对一翻译，根据来访机器、网络链路、服务内容等各种信息，可以玩出很多花样，内容分发网络将用户请求路由到它的资源服务器上就是依靠DNS服务器来实现的。根据我们已有对DNS域名解析的了解，一次没有内容分发网络参与的用户访问，其解析过程应该是这样的：

<mermaid style="margin-bottom: 0px">
sequenceDiagram
    浏览器 ->> 本地DNS: 查询网站icyfenix.cn
    loop 递归查询
	    本地DNS ->> 权威DNS: 查询网站icyfenix.cn
	end
	权威DNS -->> 本地DNS: 地址:xx.xx.xx.xx
	本地DNS -->> 浏览器: 地址:xx.xx.xx.xx
	浏览器 ->> 网站服务器: 请求
	网站服务器 -->> 浏览器: 响应
</mermaid>

有内容分发网络介入会发生什么变化呢？我们不妨先来看一段对网站`icyfenix.cn`进行DNS查询的真实应答记录，这个网站就是通过国内的内容分发网络对位于[GitHub Pages](https://pages.github.com/)上的静态页面进行加速的。通过dig或者host命令，就能很方便地得到DNS服务器的返回结果（结果中头4个IP的城市地址是笔者手工加入的，后面的其他记录就不一个一个查了），如下所示：

```bash
$ dig icyfenix.cn

; <<>> DiG 9.11.3-1ubuntu1.8-Ubuntu <<>> icyfenix.cn
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 60630
;; flags: qr rd ra; QUERY: 1, ANSWER: 17, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 65494
;; QUESTION SECTION:
;icyfenix.cn.                   IN      A

;; ANSWER SECTION:
icyfenix.cn.            600     IN      CNAME   icyfenix.cn.cdn.dnsv1.com.
icyfenix.cn.cdn.dnsv1.com. 599  IN      CNAME   4yi4q4z6.dispatch.spcdntip.com.
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	101.71.72.192      #浙江宁波市
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	113.200.16.234     #陕西省榆林市
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	116.95.25.196      #内蒙古自治区呼和浩特市
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	116.178.66.65      #新疆维吾尔自治区乌鲁木齐市
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	118.212.234.144
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	211.91.160.228
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	211.97.73.224
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	218.11.8.232
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	221.204.166.70
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	14.204.74.140
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	43.242.166.88
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	59.80.39.110
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	59.83.204.12
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	59.83.204.14
4yi4q4z6.dispatch.spcdntip.com.	60 IN	A	59.83.218.235

;; Query time: 74 msec
;; SERVER: 127.0.0.53#53(127.0.0.53)
;; WHEN: Sat Apr 11 22:33:56 CST 2020
;; MSG SIZE  rcvd: 152
```

根据以上解析信息，DNS服务为`icyfenix.cn`的查询结果先返回了一个[CNAME记录](https://en.wikipedia.org/wiki/CNAME_record)（`icyfenix.cn.cdn.dnsv1.com.`），递归查询该CNAME时候，返回了另一个看起来更奇怪的CNAME（`4yi4q4z6.dispatch.spcdntip.com.`）。继续查询后，这个CNAME返回了十几个位于全国不同地区的A记录，很明显，那些A记录就是分布在全国各地、存有本站缓存的CDN节点。CDN路由解析的具体工作过程是：

1. 架设好“`icyfenix.cn`”的服务器后，将服务器的IP地址在你的CDN服务商上注册为“源站”，注册后你会得到一个CNAME，即本例中的“`icyfenix.cn.cdn.dnsv1.com.`”。

2. 将得到的CNAME在你购买域名的DNS服务商上注册为一条CNAME记录。

3. 当第一位用户来访你的站点时，将首先发生一次未命中缓存的DNS查询，域名服务商解析出CNAME后，返回给本地DNS，至此之后链路解析的主导权就开始由内容分发网络的调度服务接管了。

4. 本地DNS查询CNAME时，由于能解析该CNAME的权威服务器只有CDN服务商所架设的权威DNS，这个DNS服务将根据一定的均衡策略和参数，如拓扑结构、容量、时延等，在全国各地能提供服务的CDN缓存节点中挑选一个最适合的，将它的IP代替源站的IP地址，返回给本地DNS。

5. 浏览器从本地DNS拿到IP地址，将该IP当作源站服务器来进行访问，此时该IP的CDN节点上可能有，也可能没有缓存过源站的资源，这点将在稍后“[内容分发](/architect-perspective/general-architecture/diversion-system/cdn.html#内容分发)”小节讨论。

6. 经过内容分发后的CDN节点，就有能力代替源站向用户提供所请求的资源。

以上步骤反映在时序图上，会如下图所示，请与本节开头给出的没有CDN参与的时序图进行对比：

<mermaid style="margin-bottom: 0px">
sequenceDiagram
    浏览器 ->> 本地DNS: 查询网站icyfenix.cn
    loop 递归查询
	    本地DNS ->> 域名的权威DNS: 查询网站icyfenix.cn
	end
	域名的权威DNS -->> 本地DNS: CNAME:icyfenix.cn.cdn.dnsv1.com.
	本地DNS -->> CNAME的权威DNS: 查询CNAME：icyfenix.cn.cdn.dnsv1.com.
	loop 递归查询
		CNAME的权威DNS ->> CNAME的权威DNS: 经过递归查询和负载均衡，确定合适的CDN
	end
	CNAME的权威DNS -->> 本地DNS: 地址:xx.xx.xx.xx
	本地DNS -->> 浏览器: 地址:xx.xx.xx.xx
	浏览器 ->> CDN服务器: 请求
	CDN服务器 ->> 源站服务器: 请求
	源站服务器 -->> CDN服务器: 响应
	CDN服务器 -->> 浏览器: 缓存并响应
</mermaid>

## 内容分发

在DNS服务器的协助下，无论是对用户还是服务器，内容分发网络都可以是完全透明的，在两者都不知情的情况下，由CDN的缓存节点接管了用户向服务器发出的资源请求。后面随之而来的问题是缓存节点中必须有用户想要请求的资源副本，才可能代替源站来响应用户请求。这里面又包括了两个子问题：“如何获取源站资源”和“如何管理（更新）资源”。

CDN获取源站资源的过程被称为“内容分发”，“内容分发网络”的名字正是由此而来，可见这是CDN的核心价值。目前主要有以下两种主流的内容分发方式：

- **主动分发**（Push）：分发由源站主动发起，将内容从源站或者其他资源库推送到用户边缘的各个CDN缓存节点上。这个推送的操作没有什么业界标准可循，可以采用任何传输方式（HTTP、FTP、P2P，等等）、任何推送策略（满足特定条件、定时、人工，等等）、任何推送时间，只要与后面说的更新策略相匹配即可。由于主动分发通常需要源站、CDN服务双方提供程序API接层面的配合，所以它对源站并不是透明的，只对用户一侧单向透明。主动分发一般用于网站要预载大量资源的场景。譬如双十一之前一段时间内，淘宝、京东等各个网络商城就会开始把未来活动中所需用到的资源推送到CDN缓存节点中，特别常用的资源甚至会直接缓存到你的手机APP的存储空间或者浏览器的[localStorage](https://en.wikipedia.org/wiki/Web_storage#localStorage)上。
- **被动回源**（Pull）：被动回源由用户访问所触发全自动、双向透明的资源缓存过程。当某个资源首次被用户请求的时候，CDN缓存节点发现自己没有该资源，就会实时从源站中获取，这时资源的响应时间可粗略认为是资源从源站到CDN缓存节点的时间，再加上资源从CDN发送到用户的时间之和。因此，被动回源的首次访问通常是比较慢的（但由于CDN的网络条件一般远高于普通用户，并不一定就会比用户直接访问源站更慢），不适合应用于数据量较大的资源。被动回源的优点是可以做到完全的双向透明，不需要源站在程序上做任何的配合，使用起来非常方便。这种分发方式是小型站点使用CDN服务的主流选择，如果不是自建CDN，而是购买阿里云、腾讯云的CDN服务的站点，多数采用的就是这种方式。

对于“CDN如何管理（更新）资源”这个问题，同样没有统一的标准可言，尽管在HTTP协议中，关于缓存的Header定义中确实是有对CDN这类共享缓存的一些指引性参数，譬如[Cache-Control](/architect-perspective/general-architecture/diversion-system/client-cache.html#强制缓存)的s-maxage，但是否要遵循，完全取决于CDN本身的实现策略。更令人感到无奈的是，由于大多数网站的开发和运维人员并不十分了解HTTP缓存机制，所以导致如果CDN完全照着HTTP Headers来控制缓存失效和更新，效果反而会相当的差，还可能引发其他问题。因此，CDN缓存的管理就不存在通用的准则。

现在，最常见的做法是超时被动失效与手工主动失效相结合。超时失效是指给予缓存资源一定的生存期，超过了生存期就在下次请求时重新被动回源一次。而手工失效是指CDN服务商一般会提供给程序调用来失效缓存的接口，在网站更新时，由持续集成的流水线自动调用该接口来实现缓存更新，譬如“`icyfenix.cn`”就是依靠[Travis-CI](https://travis-ci.com/)的持续集成服务来触发CDN失效和重新预热的。

## CDN应用

内容分发网络最初是为了快速分发静态资源而设计的，但今天的CDN所能做的事情已经远远超越了开始建设时的目标，这部分应用太多，无法展开逐一细说，笔者只能对现在CDN可以做的事情简要列举，以便读者有个总体认知：

- 加速静态资源：这是CDN本职工作。
- 安全防御：CDN在广义上可以视作你网站的堡垒机，源站只对CDN提供服务，由CDN来对外界其他用户服务，这样恶意攻击者就不容易直接威胁源站，CDN对防御某些攻击手段，如[DDoS攻击](https://zh.wikipedia.org/zh-tw/%E9%98%BB%E6%96%B7%E6%9C%8D%E5%8B%99%E6%94%BB%E6%93%8A)的尤其有效。但需注意，将安全都寄托在CDN上本身是不安全的，一旦源站真实IP被泄漏，就会面临很高风险。
- 协议升级：不少CDN提供商都同时对接（代售CA的）SSL证书服务，可以实现源站是HTTP协议的，而对外开放的网站是基于HTTPS的。同理，可以实现源站到CDN是HTTP/1.x协议，CDN提供的外部服务是HTTP/2或HTTP/3协议、实现源站是基于IPv4网络的，CDN提供的外部服务支持IPv6网络，等等。
- 状态缓存：第一节介绍客户端缓存时简要提到了状态缓存，CDN不仅可以缓存源站的资源，还可以缓存源站的状态，譬如源站的301/302转向就可以缓存起来让客户端直接跳转、还可以通过CDN开启[HSTS](https://es.wikipedia.org/wiki/HTTP_Strict_Transport_Security)、可以通过CDN进行[OCSP装订](https://zh.wikipedia.org/wiki/OCSP%E8%A3%85%E8%AE%A2)加速SSL证书访问，等等。有一些情况下甚至可以配置CDN对任意状态码（譬如404）进行一定时间的缓存，以减轻源站压力，但这个操作应当慎重，在网站状态发生改变时去及时刷新缓存。
- 修改资源：CDN可以在返回资源给用户的时候修改它的任何内容，以实现不同的目的。譬如，可以对源站未压缩的资源自动压缩并修改Content-Encoding，以节省用户的网络带宽消耗、可以对源站未启用客户端缓存的内容加上缓存Header，自动启用客户端缓存，可以修改[CORS](https://developer.mozilla.org/zh-CN/docs/Glossary/CORS)的相关Header，将源站不支持跨域的资源提供跨域能力，等等。
- 访问控制：CDN可以实现IP黑/白名单功能，根据不同的来访IP提供不同的响应结果，根据IP的访问流量来实现QoS控制、根据HTTP的Referer来实现防盗链，等等。
- 注入功能：CDN可以在不修改源站代码的前提下，为源站注入各种功能，下图是国际CDN巨头CloudFlare提供的Google Analytics、PACE、Hardenize等第三方应用，这些原本需要源站中注入代码的应用，在CDN下均能做到无需修改源站任何代码即可使用。![](./images/cloudflare.gif)
- 绕过某些“不存在的”网络措施，这也是在国内申请CDN也必须实名备案的原因，就不细说了。
- …………
