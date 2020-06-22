# 远程服务调用

分布式系统各个节点中的机器大都通过特定的网络协议（HTTP、TCP等通用协议或[JRMP](https://zh.wikipedia.org/wiki/Java%E8%BF%9C%E7%A8%8B%E6%96%B9%E6%B3%95%E5%8D%8F%E8%AE%AE)、[GIOP](https://zh.wikipedia.org/wiki/%E9%80%9A%E7%94%A8%E5%AF%B9%E8%B1%A1%E8%AF%B7%E6%B1%82%E4%BB%A3%E7%90%86%E9%97%B4%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE)这样专有协议）相互访问，但网络协议只是负责往目标机器发送了一段文本或二进制的数据，为了建立可靠的服务，还需要考虑很多网络传输之外的问题，譬如：

- 服务所需的参数，服务返回的结果以什么格式传输？
- 服务变化了，如何兼容前后不同版本的格式？
- 如何提高网络利用的效率，譬如连接是否可被多个请求复用以减少开销？多个请求是否可以同时发往一个连接上?
- 如何提高数据序列化的效率？
- 如何保证网络的可靠性？譬如调用期间某个链接忽然断开了怎么办？
- 怎样进行异常处理？异常该如何让调用者获知？
- 万一发送的请求服务端收不到回复该怎么办？
- ……

分析以上这些问题，每一个都能够直接或者间接地归属到最终的原因：从本地到网络转变。“网络”可能是计算机世界中最不靠谱的东西，一旦涉及到了它，麻烦事很快就会接踵而至。Bill Joy、Tom Lyon、Peter Deutsch和James Gosling曾经总结出[通过网络进行分布式计算时的8个谬误](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing)（即编程时经常会忽略掉这些问题），任何一个成熟的、通用的、有普适价值的RPC框架，都必须要解决或绕开（转嫁给下层协议去解决）这8个问题:

> 1. The network is reliable;<br/>
>    网络是可靠的
> 2. Latency is zero;<br/>
>    延迟是不存在的
> 3. Bandwidth is infinite;<br/>
>    带宽是无限的
> 4. The network is secure;<br/>
>    网络是安全的
> 5. Topology doesn't change;<br/>
>    拓扑结构是一成不变的
> 6. There is one administrator;<br/>
>    总会有一个管理员
> 7. Transport cost is zero;<br/>
>    不必考虑传输成本
> 8. The network is homogeneous.<br/>
>    网络是同质化的

麻烦归麻烦，却并没有阻止计算机科学朝这个方向探索。根据[原始分布式时代](/architecture/architect-history/primitive-distribution)中的介绍，早在1980年代初期，惠普和Apollo已经提出了[网络运算架构](https://en.wikipedia.org/wiki/Network_Computing_System)（Network Computing Architecture，NCA）的设想，并随后在[DCE项目](https://en.wikipedia.org/wiki/Distributed_Computing_Environment)中发展成在Unix系统下的远程服务调用框架[DCE/RPC](https://zh.wikipedia.org/wiki/DCE/RPC)，此时已经明确提出了“远程服务调用”（Remote Procedure Call，RPC）的概念，DEC/RPC可算是计算机历史上第一个面向通用程序的远程服务调用协议。不过，由于DEC本身就是基于Unix操作系统的，所以“通用”的程度也仅限在Unix系统程序间通用，在1988年，Sun Microsystems起草并向[互联网工程任务组](https://en.wikipedia.org/wiki/Internet_Engineering_Task_Force)（Internet Engineering Task Force，IETF）提交了[RFC 1050](https://tools.ietf.org/html/rfc1050)规范，此规范中设计了一套更普适的、基于TCP/IP网络而不限于具体某种操作系统支持的、面向C语言的RPC协议，后被称为[ONC RPC](https://zh.wikipedia.org/wiki/%E9%96%8B%E6%94%BE%E7%B6%B2%E8%B7%AF%E9%81%8B%E7%AE%97%E9%81%A0%E7%AB%AF%E7%A8%8B%E5%BA%8F%E5%91%BC%E5%8F%AB)，这个协议已经可算是如今我们谈论RPC的鼻祖了。

:::quote 远程服务调用（RPC）
Remote Procedure Call is a protocol that one program can use to request a service from a program located in another computer on a network without having to understand the network's details. A procedure call is also sometimes known as a function call or a subroutine call.
:::

ONC RPC使得远程服务调用得以脱离操作系统的限制，可是很快又遇到了跨语言的需求，其实并没有真正流行过。1991年，万维网还没正式诞生的年代，[对象管理组织](https://zh.wikipedia.org/wiki/%E5%AF%B9%E8%B1%A1%E7%AE%A1%E7%90%86%E7%BB%84%E7%BB%87)（Object Management Group，OMG）便发布了跨进程、面向异构语言的服务调用协议：CORBA 1.0（Common Object Request Broker Architecture，1.0版本只提供了C语言的调用）。到1997年发布的CORBA 2.0版本，CORBA支持了C、C++、Java（1998年新加入的Java语言映射）等几种主流编程语言，这是一套由国际标准组织牵头，由主流软件提供商共同参与的分布式规范，当时影响力只有微软私有的[DCOM](https://zh.wikipedia.org/wiki/Distributed_COM)可以与之媲美，但微软的DCOM与DCE一样，是受限于操作系统的（不过比DCE厉害的是DCOM能跨语言），所以同时支持跨系统、跨语言的CORBA原本是最有机会统一RPC这个细分领域的竞争者，但无奈它本身设计得实在是太过于啰嗦繁琐，甚至有些规定简直到了荒谬的程度——写一个对象请求代理（ORB，这是CORBA中的关键概念）大概要200行代码，其中大概有170行都是纯粹的废话（这鞭尸性质的得罪人评价不是笔者写的，是CORBA的首席科学家Michi Henning在论文《[The Rise and Fall of CORBA](https://dl.acm.org/doi/pdf/10.1145/1142031.1142044)》中自己说的）。最终结果是CORBA错失了统一RPC的机会，与DCOM一样，最后都成了历史的失败者。

在CORBA都还没彻底凉透的时候，很快另外一次统一RPC领域的机会再次降临。1999年末，SOAP 1.0（Simple Object Access Protocol）规范的发布。SOAP是由微软和DevelopMentor共同起草的远程服务标准，随后提交给W3C成为国际标准，SOAP使用XML作为远程过程调用的编码载体（实际上并不绑定于XML-RPC，有SOAP over UDP这类其他载体的应用），当时XML是计算机工业最新的银弹，只要是定义为XML的东西几乎就都被认为是好的，连微软自己都主动宣布放弃DCOM，转投SOAP的怀抱。

SOAP没有天生属于哪家公司的烙印，商业运作非常成功，很受市场欢迎，大量的厂商都想分一杯羹。但从技术角度来看，SOAP设计得也并不优秀，甚至同样可以说是有显著缺陷的。对于开发者而言，SOAP的一大缺点是它那过于严格的数据和接口定义所导致的性能问题，尽管SOAP吸取了CORBA失败的教训，不需要程序员手工去编写对象的描述，但XML是描述性语言，SOAP又是跨语言的RPC协议，这使得一个简单的字段，为了在不同语言中不会产生歧义，要以XML描述去清楚的话，可能比原本存储这个字段值的空间多出十几倍乃至几十倍。这个特点导致了使用SOAP必须要专门的客户端去调用和解析SOAP，也需要专门的服务去部署（如Java中的Apache Axis/CXF），更加导致了每一次数据交互都包含大量的冗余信息，性能奇差。

如果只是需要客户端、传输性能差也就算了，[又不是不能用](https://www.zhihu.com/topic/20003839/hot)。既然选择了XML，获得自描述能力，本来也就没有打算把性能放到第一位，但SOAP还有另外一点原罪：贪心。“贪心”是指希望在一套协议上一揽子解决分布式计算中可能遇到的所有问题，这导致SOAP生出了一整个家族的协议出来（这句话居然没有用拟人修辞）。SOAP协议家族中，除它本身外包括了服务描述的[Web服务描述标准](https://zh.wikipedia.org/wiki/WSDL)（Web Service Description Language，WSDL）协议、服务发现的[统一描述、发现和集成](https://zh.wikipedia.org/wiki/UDDI)（Universal Description / Discovery and Integration，UDDI）协议之外，还有一堆几乎说不清有多少个的[WS-*](https://en.wikipedia.org/wiki/List_of_web_service_specifications)的子功能协议，子子孙孙无穷无尽，对开发者造成了非常沉重的学习负担，这会就真算是得了罪开发者，谁爱用谁用去了。

当程序员们对SOAP的热情迅速兴起，又逐渐冷却之后，自己也不仅开始反思：那些面向透明的、简单的RPC协议，如DCE/RPC、DCOM，要么依赖于操作系统，要么依赖于特定语言，总有一些先天约束；那些面向通用的、普适的RPC协议；如CORBA，就无法逃过使用复杂性的困扰，CORBA弄出IDL（接口定义语言）、ORB（对象请求代理）这些概念就很好的佐证；而那些意图通过技术手段来屏蔽复杂性的RPC协议，如SOAP，又不免受到性能问题的束缚。简单、普适、高性能这三点，似乎真的难以同时满足。

由于一直没有一个同时满足以上三点的“完美RPC协议”出现，所以远程服务器调用这个小小领域里，逐渐进入了群雄混战、百家争鸣的战国时代，距离“统一”越走越远，并一直延续至今。如今，相继出现了RMI（Sun/Oracle）、Thrift（Facebook）、Dubbo（阿里巴巴）、gRPC（Google）、Motan2（新浪）、Finagle（Twitter）、brpc（百度）、Arvo（Hadoop）、JSON-RPC 2.0（公开规范，JSON-RPC工作组）……等等一系列的协议/框架。这些框架功能、特点各不相同，有的是某种语言私有，有的能支持跨越多门语言，有的运行在HTTP协议之上，有的能直接运行于TCP/UDP之上的，但肯定不存在哪一款是“最完美的RPC”。任何一款具有生命力的RPC框架，都有自己的针对性特点作为主要的发展方向，譬如：

- 朝着**面向对象**发展，不满足于RPC将面向过程的编码方式带到分布式，希望在分布式系统中也能够进行跨进程的面向对象编程，代表为RMI、.NET Remoting，之前的CORBA和DCOM也可以归入这类，这条线有一个别名叫做[分布式对象](https://en.wikipedia.org/wiki/Distributed_object)（Distributed Object）。
- 朝着**性能**发展，代表为gRPC和Thrift，传输效率（主要是Payload所占传输数据的比例大小，使用的传输协议和协议的设计都会影响到这点）和序列化效率的影响是最大的因素，gRPC和Thrift都有自己优秀的私有序列化器，而传输协议它俩一个是HTTP2，支持多路复用和Header压缩，另一个直接基于TCP协议自己来处理编码。
- 朝着**简化**发展，代表为JSON-RPC，说要选功能最强、速度最快的RPC可能会有争议，但选功能弱的、速度慢的，JSON-RPC肯定会候选人中之一。牺牲了功能和效率，换来的是协议的简单，接口与格式都更为通用，尤其适合支持Web浏览器这类一般不会有额外协议、客户端支持的应用场合。
- ……

经历了RPC框架的“战国时代”，开发者们认可了不同的RPC框架所提供的不同特性或多或少是有矛盾的，很难有某一种框架说“我全部都要”。要把面向对象那套全搬过来，就注定不会太简单（如建Stub、Skeleton就很烦了）；功能多起来，协议就要弄得复杂，效率一般就会受影响；要简单易用，那很多事情就必须遵循约定而不是配置才行；要重视效率，那就需要采用二进制的序列化器和较底层的传输协议，支持的语言范围容易受限。也正是每一种RPC框架都有不完美的地方，所以才导致不断有新的RPC出现，决定了选择框架时在获得一些利益的同时，要付出另外一些代价，权衡利弊，这总是架构师最核心的工作。

最后提一句，前文提及的DCOM、CORBA、SOAP的失败时，可能笔者的口吻多少有一些戏虐，这只是落笔行文的方式，这些框架即使没有成功，但作为早期的探索先驱，并没有什么该去讽刺的地方。而且它们的后续发展，都称得上是知耻后勇的表现，反而值得我们去赞赏。譬如说到CORBA的消亡，OMG痛定思痛之后，提出了基于RTPS协议栈的“[数据分发服务](https://en.wikipedia.org/wiki/Data_Distribution_Service)”商业标准（Data Distribution Service，DDS，“商业”就是要付费使用的意思），如今主要流行于物联网领域，能够做到微秒级延时，还能支持大规模并发通讯。譬如说到DCOM的失败和SOAP的式微，微软在它们的基础上推出的[.NET WCF](https://en.wikipedia.org/wiki/Windows_Communication_Foundation)（Windows Communication Foundation，Windows通信基础），不仅同时将REST、TCP、SOAP等不同形式的调用自动封装为完全一致的如同本地方法调用一般的程序接口，还依靠自家的“地表最强IDE”Visual Studio将工作量减少到只需要指定一个远程服务地址，就可以获取服务描述、绑定各种特性（譬如安全传输）、自动生成客户端调用代码、甚至还能选择同步还是异步之类细节的程度。尽管这东西只支持.NET平台，而且与SOAP一样采用XML描述，但使用起来体验真的是异常地畅快，能挽回SOAP中得罪开发者丢掉的全部印象分。