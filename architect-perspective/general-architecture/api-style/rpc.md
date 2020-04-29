# 远程服务调用

分布式系统各个节点中的机器大都通过特定的网络协议（HTTP、TCP等公有协议或[JRMP](https://zh.wikipedia.org/wiki/Java%E8%BF%9C%E7%A8%8B%E6%96%B9%E6%B3%95%E5%8D%8F%E8%AE%AE)、[GIOP](https://zh.wikipedia.org/wiki/%E9%80%9A%E7%94%A8%E5%AF%B9%E8%B1%A1%E8%AF%B7%E6%B1%82%E4%BB%A3%E7%90%86%E9%97%B4%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE)这样专有协议）相互访问，但网络协议只是负责往目标机器发送了一段文本或二进制的数据，为了建立可靠的服务，还有很多问题需要考虑：

- 服务所需的参数，服务返回的结果以什么格式传输？
- 服务变化了，如何兼容前后不同版本的格式？
- 如何提高网络利用的效率，譬如连接是否可被多个请求复用以减少开销？多个请求是否可以同时发往一个连接上?
- 如何提高数据序列化的效率？
- 如何保证网络的可靠性？譬如调用期间某个链接忽然断开了怎么办？
- 怎样进行异常处理？异常该如何让调用者获知？
- 万一发送的请求服务端不回复该怎么办？
- ……

早在1988年，绝大多数人都对分布式、远程服务没有什么概念的时候（这话轻了，说那时候多数人对计算机没什么概念都不嫌过分），Sun Microsystems就起草并向IETF提交了[RFC 1050](https://tools.ietf.org/html/rfc1050)规范，正式提出了远程服务调用（Remote Procedure Call，RPC）的概念，并设计了一套通用的、基于TCP/IP网络的、面向C语言的RPC协议，后被称为[ONC RPC](https://zh.wikipedia.org/wiki/%E9%96%8B%E6%94%BE%E7%B6%B2%E8%B7%AF%E9%81%8B%E7%AE%97%E9%81%A0%E7%AB%AF%E7%A8%8B%E5%BA%8F%E5%91%BC%E5%8F%AB)（用以区别于Unix系统下专有的[DEC/RPC](https://zh.wikipedia.org/wiki/DCE/RPC)）。

:::quote 远程服务调用
Remote Procedure Call is a protocol that one program can use to request a service from a program located in another computer on a network without having to understand the network's details. A procedure call is also sometimes known as a function call or a subroutine call.
:::

1991年，万维网还没正式诞生的年代，[对象管理组织](https://zh.wikipedia.org/wiki/%E5%AF%B9%E8%B1%A1%E7%AE%A1%E7%90%86%E7%BB%84%E7%BB%87)（Object Management Group，OMG）发布了跨进程、面向异构语言的服务调用协议：CORBA 1.0（Common Object Request Broker Architecture，1.0版本只提供了C语言的调用）。到1997年发布的CORBA 2.0版本，CORBA支持了C、C++、Java（1998年新加入的Java语言映射）等主流编程语言，这是第一套由国际标准组织牵头，多个主流软件提供商共同参与的分布式规范，当时影响力只有微软私有的[DCOM](https://zh.wikipedia.org/wiki/Distributed_COM)可以与之媲美。

不过，CORBA与DCOM都没有获得最终的胜利，在1999年末，SOAP 1.0（Simple Object Access Protocol）规范的发布。SOAP是由微软和DevelopMentor共同起草的远程服务标准，随后提交给W3C成为国际标准，SOAP使用XML作为远程过程调用的编码载体（实际上并不绑定于XML-RPC，有SOAP over UDP这类其他载体的应用），当时XML是计算机工业最新的银弹，只要是定义为XML的东西几乎就都是好的，连微软自己都主动放弃了DCOM转投SOAP。

SOAP没有天生属于哪家公司的烙印，商业运作非常成功，很受市场欢迎，大量的厂商都想分一杯羹。但从技术角度来看，SOAP设计得并不优秀，甚至可以说是有显著缺陷的。对于开发者而言，SOAP最大的缺点是它那过于严格的规范定义，需要专门的客户端去调用和解析SOAP，也需要专门的服务去部署SOAP（如Apache Axis/CXF）。SOAP协议家族中，除它本身外包括了服务描述的[Web服务描述标准](https://zh.wikipedia.org/wiki/WSDL)（Web Service Description Language，WSDL）协议、服务发现的[统一描述、发现和集成](https://zh.wikipedia.org/wiki/UDDI)（Universal Description / Discovery and Integration，UDDI）协议、还有一堆几乎谁都说不清有多少个的[WS-*](https://zh.wikipedia.org/wiki/Web%E6%9C%8D%E5%8A%A1%E8%A7%84%E8%8C%83%E5%88%97%E8%A1%A8)的子功能协议，对开发者来说都是很大的学习负担。

人们对SOAP的热情迅速兴起，又逐渐冷却之后，远程服务器调用这个小小领域，开始进入了群雄混战、百家争鸣的战国时代，延续至今。相继出现了RMI（Sun/Oracle）、Thrift（Facebook）、Dubbo（阿里巴巴）、gRPC（Google）、Motan2（新浪）、Finagle（Twitter）、brpc（百度）、Arvo（Hadoop）、JSON-RPC 2.0（公开规范，JSON-RPC工作组）等等一系列的协议/框架。这些框架功能、特点各不相同，有的是某种语言私有，有的能支持跨越多门语言，有的运行在HTTP协议之上，有的能直接运行于TCP/UDP之上的，但总体而言，RPC在朝着三个主要方向发展：

- 朝着**对象**发展，不满足于RPC将面向过程的编码方式带到分布式，希望在分布式系统中也能够进行跨进程的面向对象编程，代表为RMI、.NET Remoting，之前的CORBA和DCOM也可以归入这类，这条线有一个别名叫做[分布式对象](https://en.wikipedia.org/wiki/Distributed_object)（Distributed Object）。
- 朝着**效率**发展，代表为gRPC和Thrift，传输效率（主要是Payload所占传输数据的比例大小，使用的传输协议和协议的设计都会影响到这点）和序列化效率的影响是最大的因素，gRPC和Thrift都有自己优秀的私有序列化器，传输协议一个是HTTP2，支持多路复用和Header压缩，另一个直接基于TCP。
- 朝着**简化**发展，代表为JSON-RPC，说要选速度最快的RPC可能会有争议，但选速度最慢的，JSON-RPC大概是逃不了的。牺牲了功能和效率，换来的是协议的简单，接口与格式都更为通用。

不同的RPC框架所提供的不同特性多少是有矛盾的，很难有某一种框架说“我全部都要”。譬如，要把面向对象那套全搬过来，就注定不会太简单（如建Stub、Skeleton就很烦了）；功能多起来，协议就要弄得复杂，效率一般就会受影响；要简单易用，那很多事情就必须遵循约定而不是配置才行；要重视效率，那就需要采用二进制的序列化器和较底层的传输协议，支持的语言范围容易受限。

也正是每一种RPC框架都有不完美的地方，所以才导致不断有新的RPC出现，也导致了有跳出RPC的新想法出现，REST便有了它诞生的土壤。