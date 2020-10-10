# Linux网络虚拟化

Linux目前提供的八种名称空间里，网络名称空间无疑是最为复杂的一种，它为名称空间内的所有进程提供了全套的网络设施，包括独立的设备界面、路由表、ARP表，IP地址表、iptables/ebtables规则、协议栈，等等。虚拟化容器是以Linux名称空间的隔离性为基础来实现的，那解决隔离的容器之间、容器与宿主机之间、乃至跨物理网络的不同容器间通讯问题的责任，很自然也落在了Linux网络虚拟化技术的肩上。本节里，我们暂时放下容器编排、云原生、微服务等这些上层概念，走入Linux网络的底层世界，去学习与设备、协议、通讯相关的基础网络知识。

本节的阅读对象设定为以实现业务功能为主、平常并不直接接触网络设备的普通开发人员，对于平台基础设施的开发者或者运维人员，可能会显得有点过于啰嗦或过于基础了，如果你已经提前掌握了这些知识，完全可以快速阅读，或者直接跳过。

## 网络通讯模型

笔者先抛开虚拟化，只谈网络，介绍一下Linux系统的网络通讯模型，即信息是如何从程序中发出，通过网络传输，再被另一个程序接收到的。整体上看，Linux系统的通讯过程无论按理论上的OSI七层模型，还是以实际上的TCP/IP四层模型来解构，都明显地呈现出“接口逐层调用，数据逐层封装”的特点，这种逐层处理的方式与程序执行时的方法栈很类似，因此它也常被称为“Linux网络协议栈”，下图体现了Linux网络通讯过程与OSI或者TCP/IP模型的对应关系，也展示了协议栈中的数据流动的路径。

:::center
![](./images/msg.png)
Linux系统下的网络通讯模型
:::

从图中传输模型可见，几乎整个网络栈（应用层以下）都实现在系统内核空间之中，之所以采用这种设计，主要是从安全隔离的角度出发来考虑的，让内核去处理网络栈尽管有较高的开销（数据在内核态和用户态之间的拷贝成本），会损失一些性能，但能够保证应用程序无法窃听到或者去伪造另一个应用程序的通讯内容；如果遇到需要特别关注收发性能的场景，也有直接在用户空间中实现全套协议栈的旁路方案，譬如开源的[Netmap](https://github.com/luigirizzo/netmap)以及Intel的[DPDK](https://en.wikipedia.org/wiki/Data_Plane_Development_Kit)，都能做到零拷贝收发包。从数据流动过程来看，信息从程序中发出，将经历如下几个阶段：

- Socket：应用层的程序基本上都是通过Socket编程接口来和内核空间的网络协议栈通信的。Linux Socket最初是从BSD Socket发展而来的，现在Socket已经成为各大主流操作系统的通用网络接口，是网络应用程序实际上的交互基础。应用程序通过读写收、发缓冲区（Receive/Send Buffer）来与Socket进行交互，在*nix系统中，出于“一切皆是文件”的设计哲学，对Socket操作被实现为对文件系统（socketfs）的读写访问操作。
- TCP/UDP：传输层协议族里最主要就是[传输控制协议](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)（Transmission Control Protocol，TCP）和[用户数据报协议](https://en.wikipedia.org/wiki/User_Datagram_Protocol)（User Datagram Protocol，UDP）两种，此外还有[流控制传输协议](https://en.wikipedia.org/wiki/Stream_Control_Transmission_Protocol)（Stream Control Transmission Protocol，SCTP）、[数据报拥塞控制协议](https://en.wikipedia.org/wiki/Datagram_Congestion_Control_Protocol)（Datagram Congestion Control Protocol，DCCP）等等。<br/>不同的协议处理过程大致是一样的，但封装的信息会有所不同，这里以TCP协议为例：内核发现Socket的发送缓冲区中有新的数据被拷贝进来后，会把数据构建为TCP Segment报文。常见网络协议的报文基本上都是由报文头（Header）和报文体（Body，也叫荷载：Payload）两部分组成。内核将缓冲区中用户要发送出去的数据作为报文体，然后把传输层中的必要控制信息，譬如代表哪个程序发、哪个程序收的源、目标端口号，用于保证可靠通讯（重发与控制顺序）的序列号、用于校验信息是否在传输中出现损失的校验和（Check Sum）等信息封装入报文头中。
- IP：网络层协议最主要就是网际协议（Internet Protocol，IP），其他还有[因特网组管理协议](https://en.wikipedia.org/wiki/Internet_Group_Management_Protocol)（Internet Group Management Protocol，IGMP）、大量的路由协议（EGP、NHRP、OSPF、IGRP、……）等等。<br/>以IP协议为例，它会将来自上一层（例子中的TCP的报文）的数据包作为报文体，再次加入自己的报文头，譬如指明数据应该发到哪里的路由地址、数据包的长度、协议的版本号，等等，封装成IP数据包后发往下一层。关于IP协议报文头的内容，笔者曾在“[负载均衡](/architect-perspective/general-architecture/diversion-system/load-balancing.html)”中讲解过，有需要的读者可以参考。
- Device：Device是网络访问层中面向系统一侧的接口，这里所说的设备（Device）与物理硬件设备并不是同一个概念，Device只是一种向操作系统端开放的接口，其背后既可能代表着真实的物理硬件，也可能是某段具有特定功能的程序代码。许多网络抓包工具，如[tcpdump](https://en.wikipedia.org/wiki/Tcpdump)、[Wirshark](https://en.wikipedia.org/wiki/Wireshark)便是在此工作。前面介绍微服务[流量控制](/distribution/traffic-management/traffic-control.html)时笔者曾提到过的网络流量整形也通常是在这里完成的。Device主要的作用是预留出一些让代码去介入收发包过程的手段，譬如确定数据应该从哪块网卡设备发送出去；还有就是准备好网卡驱动工作所需的数据，譬如来自上一层的IP数据包、[下一跳](https://en.wikipedia.org/wiki/Hop_(networking))（Next Hop）的MAC地址（这个地址是通过[ARP Request](https://en.wikipedia.org/wiki/Address_Resolution_Protocol)得到的）等等。
- Driver：Driver是网络访问层中面向硬件一侧的接口，网卡驱动程序（Driver）会通过[DMA](https://en.wikipedia.org/wiki/Direct_memory_access)将主存中的待发送的数据包复制到驱动内部的缓冲区之中。数据被复制的同时，也会将上层提供的IP数据包、下一跳MAC地址这些信息，加上网卡的MAC地址、VLAN Tag（这些内容稍后都会介绍到）等信息一并封装成为[以太帧](https://en.wikipedia.org/wiki/Ethernet_frame)（Ethernet Frame），并自动计算校验和。对于需要确认重发的信息，如果在没有收到确认（ACK）响应，那重发的工作也是在这里自动完成的。

上面这些阶段是信息从程序中对外发出时经过协议栈的过程，接收过程则是从相反方向进行的逆操作。程序发送数据做的是层层封包，加入协议头，传给下一层；接受数据则是层层解包，提取协议体，传给上一层。相信你应该能够举一反三，笔者就不再专门列举一遍数据接收步骤了。

## 干预网络通讯

网络协议栈的处理过程里，似乎除了在Device这里程序还有一点插手的空间以外，其他过程似乎都没有可供程序介入的余地了。然而事实并非如此，从Linux Kernel 2.4版开始，内核开放了一套通用的、可供代码干预数据在协议栈中流转的过滤器框架，这套名为Netfilter的框架是Linux防火墙和网络的主要维护者Rusty Russell提出并设计的。它围绕网络层（IP协议）的周围，埋下了五个[钩子](https://en.wikipedia.org/wiki/Hooking)（Hooks），每当有数据包流到网络层，经过这些钩子时，就会自动触发由内核模块注册在这里的回调函数 ，程序代码就能够通过回调来干预Linux的网络通讯。这五个钩子的名字与含义分别列举如下：

- PREROUTING：来自设备的数据包进入协议栈后立即触发此钩子。PREROUTING钩子在进入IP路由之前触发，这意味着只要接收到的数据包，无论是否真的发往本机，都会触发此钩子。一般用于目标网络地址转换（DNAT）。
- INPUT：报文经过IP路由后，如果确定是发往本机的，将会触发此钩子，一般用于加工发往本地进程的数据包。
- FORWARD：报文经过IP路由后，如果确定**不**是发往本机的，将会触发此钩子，一般用于处理转发到其他机器的数据包。
- OUTPUT：从本机程序发出的数据包，在经过IP路由前，将会触发此钩子，一般用于加工本地进程的输出数据包。
- POSTROUTING：从本机网卡出去的数据包，无论是本机的程序所发出的，还是由本机转发给其他机器的，都会触发此钩子，一般用于源网络地址转换（SNAT）。

:::center
![](./images/netfilter.png)
应用收、发数据包所经过的Netfilter钩子
:::

Netfilter允许在同一个钩子处注册多个回调函数，因此向钩子注册回调函数必须提供明确的优先级，以便触发时能按照优先级从高到低进行激活。由于回调函数有多个，看起来就像挂在同一个钩子上的一串链条，钩子触发的回调函数集合也被称为“回调链”（Chained Callbacks），这个名字导致了后续基于Netfilter设计的Xtables系工具，如稍后介绍的iptables均有使用到“链”（Chain）的概念。虽然现在看来Netfilter只是一些简单的事件回调机制而已，然而这样一套简单的设计，却成为了整座Linux网络大厦的重要基石，Linux系统提供的许多网络能力，如数据包过滤、封包处理（设置标志位、修改TTL等）、地址伪装、网络地址转换、透明代理、访问控制、基于协议类型的连接跟踪，带宽限速，等等，都是在Netfilter基础之上实现的。

以Netfilter为基础的应用有很多，其中最重要的毫无疑问要数Xtables系列工具，譬如iptables、ebtables、arptables、ip6tables等等。这里面至少[iptables](https://en.wikipedia.org/wiki/Iptables)应该是用过Linux系统的开发人员都或多或少会使用过，它常被称为是Linux系统自带的防火墙，然而iptables实际能做的事情已远远超出防火墙的范畴，它比较贴切的定位应是能够代替Netfilter多数常规功能的IP包过滤工具。Netfilter的钩子回调虽然很强大，但毕竟要通过程序编码才够能用，并不适合系统管理员用来运维。iptables的价值就便是使用配置去实现原本用Netfilter编码才能做到的事情。它先把用户常用的管理意图总结成行为，部分预置的行为有如下所列：

- DROP：直接将数据包丢弃。
- REJECT：给客户端返回Connection Refused或Destination Unreachable报文。
- QUEUE：将数据包放入用户空间的队列，供用户空间的程序处理。
- RETURN：跳出当前链，该链里后续的规则不再执行。
- ACCEPT：同意数据包通过，继续执行后续的规则。
- JUMP：跳转到其他用户自定义的链继续执行。
- REDIRECT：在本机做端口映射。
- MASQUERADE：地址伪装，自动用修改源或目标的IP地址来做NAT
- LOG：在/var/log/messages文件中记录日志信息。
- ……

这些行为本来能够被挂载到Netfilter钩子的回调链上，但iptables又抽象 了一层，不是把行为与链直接挂钩，而是根据这些底层操作的目的总结为更高层次的规则。举个具体例子，假设你挂载规则目的是实现网络地址转换（NAT），那就要对符合某种特征的流量（譬如来源于某个网段、从某张网卡发送出去）、在某个钩子上（譬如做SNAT通常在POSTROUTING，做DNAT通常在PREROUTING）进行MASQUERADE行为，这样具有相同目的的规则，就应该放到一起形成规则表，才便于管理。iptables内置了五张不可扩展的规则表（其中security表并不常用，很多资料只计算了前四张表），如下所列：

1. raw表：用于去除数据包上的[连接追踪机制](https://en.wikipedia.org/wiki/Netfilter#Connection_tracking)（Connection Tracking）。
2. mangle表：用于修改数据包的报文头信息，如服务类型（Type Of Service，TOS）、生存周期（Time To Live，TTL）以及为数据包设置Mark标记，典型的应用是链路的服务质量管理（Quality Of Service，QoS）。
3. nat表：用于修改数据包的源或者目的地址等信息，典型的应用是网络地址转换。
4. filter表：用于对数据包进行过滤，控制到达某条链上的数据包是继续放行、直接丢弃或拒绝（ACCEPT、DROP、REJECT），典型的应用是防火墙。
5. security表：用于在数据包上应用[SELinux](https://en.wikipedia.org/wiki/Security-Enhanced_Linux)，这张表并不常用。

以上五张规则表是具有优先级的：raw-->mangle-->nat-->filter-->security，也即是它们出现的顺序。在新增规则时，应该按照规则的意图指定要存入到哪张表中，如果没有指定，默认就是filter表。每张表能够使用到的链也有所不同，具体表与链的对应关系如下所示：

|                    | PREROUTING | POSTROUTING | FORWARD | INPUT | OUTPUT |
| ------------------ | :---: | :---: | :---: | :---: | :---: |
| raw                | √          | ×           | ×       | ×     | √      |
| mangle             | √          | √           | √       | √     | √      |
| nat（Source）      | ×          | √           | ×       | √     | ×      |
| nat（Destination） | √          | ×           | ×       | ×     | √      |
| filter             | ×          | ×           | √       | √     | √      |
| security           | ×          | ×           | √       | √     | √      |

预置的五条链直接源自于Netfilter的钩子，它们与五张规则表的对应关系是固定的。用户不能增加自定义的表，但可以增加自定义的链，新增的自定义链与钩子没有天然的对应关系，换而言之就是不会自动触发，必须使用JUMP行为从默认的五条链中跳转过去才能被执行。

iptables不仅仅是Linux系统自带的一个网络工具而已，它在容器间通讯中扮演相当重要的角色，譬如Kubernetes用来管理Sevice的Endpoints的核心组件kube-proxy，就依赖iptables来完成ClusterIP到Pod的通讯（也可以采用IPVS，IPVS同样是基于Netfilter的），这种通讯就是一种NAT访问。如果你平常较少在Linux系统下工作，可能需要一些用iptables充当防火墙过滤数据、当作路由器转发数据、当作网关做NAT转换的实际例子来帮助理解，由于这些操作在网上很容易找到，笔者就不专门举例了。

笔者用两个小节的篇幅去介绍Linux下网络通讯的协议栈模型，以及程序如何干涉在协议栈中流动的信息，它们与虚拟化并没有什么直接关系，而是整个Linux网络通讯的必要基础。从下一节开始，我们就要开始专注于与网络虚拟化密切相关的内容了。

## 虚拟化网络设备

虚拟化的网络并不需要完全遵照物理网络的样子来设计，不过，由于有大量现成的代码原本就是面向于物理存在的网络设备来实现的，也有出于方便理解和知识继承的方面的考虑，虚拟化网络与物理网络中的设备还是有相当高的可比性。所以，笔者准备从虚拟网络中那些与网卡、交换机、路由器等对应的虚拟设施，以及如何使用这些虚拟设施来组成网络开始说起。

### 网卡：tun/tap、veth

目前主流的虚拟网卡方案有[tun/tap](https://www.kernel.org/doc/Documentation/networking/tuntap.txt)和[veth](https://man7.org/linux/man-pages/man4/veth.4.html)两种，在时间上tun/tap出现得更早，它是一组通用的虚拟驱动程序包，里面包含了两个设备，分别是用于网络数据包处理的虚拟网卡驱动，以及用于内核空间与用户空间的间交互的[字符设备](https://en.wikipedia.org/wiki/Device_file#Character_devices)（Character Devices，这里具体指`/dev/net/tun`）驱动。大概在2000年左右，Solaris系统为了实现[隧道协议](https://en.wikipedia.org/wiki/Tunneling_protocol)（Tunneling Protocol）开发了这套驱动，从Linux Kernel 2.1版开始移植到Linux内核中，当时是源码中的可选模块，2.4版之后发布的内核都会默认编译tun/tap的驱动。

tun和tap是两个相对独立的虚拟网络设备，其中tap模拟了以太网设备，操作二层数据包（以太帧），tun则模拟了网络层设备，操作三层数据包（IP报文）。使用tun/tap设备的目的是实现把来自协议栈的数据包先交由某个打开了`/dev/net/tun`字符设备的用户进程处理后，再把数据包重新发回到链路中。你可以通俗地将它理解为这块虚拟化网卡驱动一端连接着网络协议栈，另一端连接着用户态程序，而普通的网卡驱动则是一端连接则网络协议栈，另一端连接着物理网卡。只要协议栈中的数据包能被用户态程序截获并加工处理，程序员就有足够的舞台空间去玩出各种花样，譬如数据压缩、流量加密、透明代理等功能都能够以此为基础来实现，以最典型的VPN应用为例，程序发送给tun设备的数据包，会经过如下所示的顺序流进VPN程序：

:::center
![](./images/tun.png)
VPN中数据流动示意图
:::

应用程序通过tun设备对外发送数据包后，tun设备如果发现另一端的字符设备已被VPN程序打开（这就是一端连接着网络协议栈，另一端连接着用户态程序），便会把数据包通过字符设备被发送给VPN程序，VPN收到数据包，便可以修改后再重新封装成新报文，譬如数据包原本是发送给A地址的，VPN把整个包进行加密，然后作为报文体，封装到另一个发送给B地址的新数据包当中。这种将一个数据包套进另一个数据包中的处理方式被形象地形容为“隧道”（Tunneling），隧道技术是在物理网络中构筑逻辑网络的典型做法。而其中提到的加密，也有标准的协议可遵循，譬如[IPSec](https://en.wikipedia.org/wiki/IPsec)协议。

使用tun/tap设备传输数据需要经过两次协议栈，不可避免地会有一些性能损耗，因此现在容器对容器的直接通讯并不会以tun/tap作为首选方案，一般是基于稍后介绍的veth来实现的。但是tun/tap没有veth那样要求设备成对出现、数据要原样传输的限制，数据包到用户态程序后，程序员就有完全掌控的权力，要进行哪些修改，要发送到什么地方，都可以编写代码去实现，因此tun/tap方案比起veth方案有更广泛的适用范围。

veth是另一种常见的虚拟网卡方案，在Linux Kernel 2.6版本，Linux开始支持网络名空间隔离的同时，也提供了专门的虚拟以太网（Virtual Ethernet，习惯简写做veth）让两个隔离的网络名称空间之间可以互相通讯。直接把veth比喻成是虚拟网卡其实并不十分准确，如果要和物理设备类比，它应该相当于由[交叉网线](https://en.wikipedia.org/wiki/Ethernet_over_twisted_pair)连接的**一对**物理网卡。

:::quote 额外知识：直连线序、交叉线序

交叉网线是指一头是T568A标准，另外一头是T568B标准的网线。直连网线则是两头采用同一种标准的网线。

网卡对网卡这样的同类设备需要使用交叉线序的网线来连接，网卡到交换机、路由器就采用直连线序的网线，不过现在的网卡大多带有线序翻转功能，直连线也可以网卡对网卡地连通了。

:::

veth实际上不是一个设备，而是一对设备，因而也常被称作veth pair。要使用veth，就需要在两个独立的网络名称空间中进行才有意义，因为veth pari是一端连着协议栈，另一端彼此相连的，在veth设备的其中一端输入数据，这些数据就会从设备的另外一端原样不变地流出，它工作时数据流动如下图所示：

:::center
![](./images/veth.png)
veth pair工作示意图
:::

由于两个容器之间采用veth通讯不需要经过协议栈，这让veth比起tap/tun具有更高的性能，也让veth pair的实现变的十分简单，内核中只用了几十行代码实现了一个数据复制函数就完成了veth的主体功能。veth以模拟网卡直连的方式很好地解决了两个容器之间的通讯问题，然而对多个容器间通讯，如果仍然单纯只用veth pair的话，事情就变得非常麻烦，让每个容器都为与它通讯的其他容器建立一对专用的veth pair并不实际，这时就需要有一台虚拟化的交换机来解决多容器之间的通讯问题了。

### 交换机：Linux Bridge

既然有了虚拟网卡，很自然也会联想到让网卡接入到交换机里，实现多个容器间的相互连接。[Linux Bridge](https://www.kernel.org/doc/html/latest/networking/bridge.html)便是Linux系统下的虚拟化交换机，虽然它以“网桥”（Bridge）而不是“交换机”（Switch）为名，然而使用过程中，你会发现Linux Bridge的目的看起来像交换机，功能使用起来像交换机、程序实现起来也像交换机，实际就是交换机的[Duck Typing](https://en.wikipedia.org/wiki/Duck_typing)。

Linux Bridge是在Linux Kernel 2.2版本开始提供的二层转发工具，由`brctl`命令创建和管理。Linux Bridge创建以后，便能够接入任何位于二层的网络设备，无论是真实的物理设备（譬如eth0）抑或是虚拟的设备（譬如veth或者tap）都能与网桥配合工作。当有二层数据包（以太帧）从网卡进入网桥，它将根据数据包的类型和目标MAC地址，按如下规则转发处理：

- 如果数据包是广播帧，转发给所有接入网桥的设备。
- 如果数据包是单播帧：
  - 且MAC地址在地址转发表中不存在，则[洪泛](https://en.wikipedia.org/wiki/Flooding_(computer_networking))（Flooding）给所有接入网桥的设备，并将响应设备的接口与MAC地址学习（MAC Learning）到自己的MAC地址转发表中。
  - 且MAC地址在地址转发表中已存在，则直接转发到地址表中指定的设备。
- 如果数据包是此前转发过的，又重新发回到此Bridge，说明冗余链路产生了环路。由于以太帧不像IP报文那样有TTL来约束，因此一旦出现环路，如果没有额外措施来处理的话就会永不停歇地转发下去。对于这种数据包就需要交换机实现[生成树协议](https://en.wikipedia.org/wiki/Spanning_Tree_Protocol)（Spanning Tree Protocol，STP）来交换拓扑信息，生成唯一拓扑链路以切断环路。

上面提到的这些名词，譬如二层转发、泛洪、STP、MAC学习、地址转发表，等等，都是物理交换机中极为成熟的概念，它们在Linux Bridge中都有对应的实现，所以说Linux Bridge不仅用起来像交换机，实现起来也像交换机。不过，它与普通的物理交换机也还是有一点差别的，普通交换机只会单纯地做二层转发，Linux Bridge却还支持把发给它自身的数据包接入到主机的三层的协议栈中。

对于通过`brctl`命令显式接入网桥的设备，Linux Bridge与物理交换机的转发行为是完全一致的，也不允许给接入的设备设置IP地址，因为网桥是根据MAC地址做二层转发的，就算设置了三层的IP地址也毫无意义。然而Linux Bridge与普通交换机的区别是除了显式接入的设备外，它自己也无可分割地连接着一台有着完整网络协议栈的Linux主机，网桥本身肯定是在某台Linux主机上创建的，可以看作网桥有一个与自己名字相同的隐藏端口，隐式地连接了创建它的那台Linux主机。因此，Linux Bridge允许给自己设置IP地址，比普通交换机多出一种特殊的转发情况：

- 如果数据包的目的MAC地址为网桥本身，并且网桥有设置了IP地址的话，那该数据包即被认为是收到发往创建网桥那台主机的数据包，此数据包将不会转发到任何设备，而是直接交给上层（三层）协议栈去处理。

此时，网桥就取代了eth0设备来对接协议栈，进行三层协议的处理。设置这条特殊转发规则的好处是，只要通过简单的NAT转换，就可以实现一个最原始的单IP容器网络。这种组网是最基本的容器间通讯形式，笔者举个具体例子来帮助你理解。假设现有如下设备及配置，它们的连接情况如图所示：

- 网桥br0：分配IP地址192.168.31.1；
- 容器：三个网络名称空间（容器），分别编号为1、2、3，均使用veth pair接入网桥，且有如下配置：
  - 在容器一端的网卡名为veth0，在网桥一端网卡名为veth1、veth2、veth3；
  - 三个容器中的veth0网卡分配IP地址：192.168.1.10、192.168.1.11、192.168.1.12；
  - 三个容器中的veth0网卡设置网关为网桥，即192.168.31.1；
  - 网桥中的veth1、veth2、veth3无IP地址；
- 物理网卡eth0：分配的IP地址14.123.254.86；
- 外部网络：外部网络中有一台服务器，地址为122.246.6.183

:::center
![](./images/bridge.png)
Linux Bridge构建单IP容器网络
:::



如果名称空间1中的应用程序想访问外网地址为122.246.6.183的服务器，由于容器没有自己的公网IP地址，程序发出的数据包将经过如下步骤处理后，才能最终到达外网服务器：

1. 应用程序调用Socket API发送数据，此时生成的原始数据包为：
   
   > - 源MAC：veth0的MAC
   > - 目标MAC：网关的MAC（即网桥的MAC）
   > - 源IP：veth0的IP，即192.168.31.1
   > - 目标IP：外网的IP，即122.246.6.183
2. 从veth0发送的数据，会在veth1中原样出来，网桥将会从veth1中接收到一个目标MAC为自己的数据包，并且网桥有配置IP地址，由此触发了Linux Bridge的特殊转发规则。这个数据包便不会转发给任何设备，而是转交给主机的协议栈处理。<br/>注意，从这步以后就是三层路由了，已不在网桥的工作范围之内，是由Linux主机依靠Netfilter进行IP转发（IP Forward）去实现的。
3. 数据包经过主机协议栈，Netfilter的钩子被激活，预置好的iptables nat规则会修改数据包的源IP地址，将其改为物理网卡eth0的IP地址，并在映射表中记录设备端口及两个IP地址之间的对应关系，经过SNAT之后的数据包，最终会从eth0出去，此时报文头中的地址为：

   > - 源MAC：eth0的MAC
   > - 目标MAC：下一跳（Hop）的MAC
   > - 源IP：eth0的IP，即14.123.254.86
   > - 目标IP：外网的IP，即122.246.6.183
4. 可见，经过主机协议栈后，数据包的源和目标IP地址均为公网的IP，这个数据包在外部网络中可以根据IP正确路由到目标服务器手上。当目标服务器处理完毕，对该请求发出响应后，返回数据包的目标地址也是公网IP，这个数据包经过链路所有跳点，由eth0达到网桥时，报文头中的地址为：

   > - 源MAC：eth0的MAC
   > - 目标MAC：网桥的MAC
   > - 源IP：外网的IP，即122.246.6.183
   > - 目标IP：eth0的IP，即14.123.254.86
5. 可见，这同样是一个以网桥MAC地址为目标的数据包，同样会触发特殊转发规则，交由协议栈处理。此时Linux将根据映射表中的转换关系做DNAT转换，把目标IP地址从eth0替换回veth0的IP，最终veth0收到的响应数据包为：
   > - 源MAC：网桥的MAC
   > - 目标MAC：veth0的MAC
   > - 源IP：外网的IP，即122.246.6.183
   > - 目标IP：veth0的IP，即192.168.31.1

在以上处理过程中，Linux主机承担了三层路由的职责，一定程度上扮演了路由器的角色。由于有Netfilter的存在，对网络层的路由转发，就无需像Linux Bridge一样专门提供`brctl`这样的命令去创建一个虚拟设备，通过Netfilter很容易就能在Linux内核完成根据IP地址进行路由的功能，你也可以理解为Linux内核天然就是一个虚拟的路由器。

限于篇幅，笔者仅介绍Linux Bridge这一种虚拟交换机的方案，此外还有OVS（Open vSwitch）等同样常见，而且更强大、更复杂的方案这里就不再涉及了。

### 网络：VXLAN

有了虚拟化网络设备后，下一步就是要使用这些设备组成网络，容器分布在不同的物理主机上，每一台物理主机都有物理网络相互联通，然而这种网络的物理拓扑结构是相对固定的，这很难跟上云原生时代的分布式系统的逻辑拓扑结构变动频率，譬如服务的扩缩、断路、限流等等，都可能要求网络跟随做出相应的变化。正因如此，软件定义网络（Software Defined Network，SDN）的需求变得前所未有地迫切，SDN的核心思路是在物理的网络之上再构造一层虚拟化的网络，将控制平面和数据平面分离开来，实现流量的灵活控制，为核心网络及应用的创新提供良好的平台。SDN里位于下层的物理网络被称为Underlay，它着重解决网络的连通性与可管理性，位于上层的逻辑网络被称为Overlay，它着重为上层应用提供与软件需求相符的传输服务和拓扑。

软件定义网络已经发展了十余年时间，远比云原生、微服务这些概念出现得早。网络设备商基于硬件设备开发出了EVI（Ethernet Virtualization Interconnect）、TRILL（Transparent Interconnection of Lots of Links)、SPB（Shortest Path Bridging）等大二层网络技术；软件厂商也提出了VXLAN（Virtual eXtensible LAN）、NVGRE（Network Virtualization Using Generic Routing Encapsulation）、STT（A Stateless Transport Tunneling Protocol for Network Virtualization）等一系列基于虚拟交换机实现的Overlay网络。跨主机的容器间通讯，用的大多是Overlay网络，本节里，笔者会以VXLAN为例去介绍Overlay网络的原理。

VXLAN你有可能没听说过，但[VLAN](https://en.wikipedia.org/wiki/Virtual_LAN)相信只要从事计算机专业的人都有所了解。VLAN的全称是“虚拟局域网”（Virtual Local Area Network），它也算是网络虚拟化技术的早期成果之一了。由于二层网络本身的工作特性决定了它非常依赖于广播，无论是广播帧（如ARP请求、DHCP、RIP都会产生广播帧），还是泛洪路由，其执行成本都随着接入二层网络设备数量的增加而等比例增长，当设备太多，广播又频繁的时候，很容易就会形成[广播风暴](https://en.wikipedia.org/wiki/Broadcast_radiation)（Broadcast Radiation）。因此，VLAN的首要职责就是划分广播域，将连接在同一个物理网络上的设备区分开来，划分的具体方法是在以太帧的报文头中加入VLAN Tag，让所有广播只针对具有相同VLAN Tag的设备生效。这样即缩小了广播域，也附带有提高了安全性和可管理性，因为两个VLAN之间不能通讯，如果确有通讯的需要，那就必须通过三层设备来进行，如[单臂路由](https://en.wikipedia.org/wiki/Router_on_a_stick)（Router on a Stick）或者三层交换机。

然而VLAN有两个明显的缺陷，第一个缺陷在于VLAN Tag的设计，定义VLAN的[802.1Q规范](https://en.wikipedia.org/wiki/IEEE_802.1Q)是在1998年提出的，当时的工程师完全不可能预料到未来云计算会如此地普及，因而只给VLAN Tag预留了32 Bits的空隙，其中还要分出16 Bits存储标签协议识别符（Tag Protocol Identifier）、3 Bits存储优先权代码点（Priority Code Point）、1 Bits存储标准格式指示（Canonical Format Indicator），剩下的12 Bits才能用来存储VLAN ID（Virtualization Network Identifier，VNI），换而言之，VLAN ID最多只能有2^12^=4096种取值。当云计算数据中心出现后，即使不考虑虚拟化，单是需要分配IP的物理设备都有可能数以十万、百万计，4096个VLAN肯定是不够用的。后来IEEE的工程师们提出[802.1AQ规范](https://zh.wikipedia.org/wiki/IEEE_802.1ad)力图补救这个缺陷，大致思路是给以太帧连续打上两个VLAN Tag，每个Tag里仍然只有12 Bits的VLAN ID，但两个加起来就可以存储2^24^=16777216个不同的VLAN ID了，由于两个VLAN Tag并排放在报文头上，802.1AQ规范还有了个QinQ（802.1Q in 802.1Q）的别名。

QinQ是2011年推出的规范，到现在都并没有特别普及，除了需要设备支持外，它还解决不了VLAN的第二个缺陷：跨数据中心传递。VLAN本身是为二层网络所设计的，但是在两个独立数据中心之间，信息只能跨三层传递，由于云计算的灵活性，大型分布式系统却完全有跨数据中心运作的可能性，此时如何让VLAN Tag在两个数据中心间传递又成了不得不考虑的麻烦事。

为了解决以上两个问题，IETF定义了VXLAN规范，这是[NVO3](https://datatracker.ietf.org/wg/nvo3/about/)（Network Virtualization over Layer 3）标准技术规范之一，是一种典型的Overlay网络。VXLAN采用L2 over L4 （Mac in UDP）的报文封装模式，把原本在二层传输的以太帧放到四层UDP协议的报文体内，同时加入了自己定义的VXLAN Header。在VXLAN Header里就有24 Bits的VLAN ID，同样可以存储1677万个不同的取值，VXLAN让二层网络得以在三层范围内进行扩展，不再受数据中心间传输的限制。VXLAN的整个报文结构如下图所示：

:::center
![.](./images/vxlan.jpg)
VXLAN报文结构<br/>（图片来源：[Orchestrating EVPN VXLAN Services with Cisco NSO](https://www.ciscolive.com/c/dam/r/ciscolive/emea/docs/2019/pdf/DEVWKS-1445.pdf)）
:::

VXLAN对网络架构的要求很低，不需要硬件提供的特别支持，只要三层可达的网络就能部署VXLAN。VXLAN网络的每个边缘入口上布置有一个VTEP（VXLAN Tunnel Endpoints）设备，它既可以是物理设备，也可以是虚拟化设备，负责VXLAN协议报文的封包和解包。[互联网号码分配局](https://en.wikipedia.org/wiki/Internet_Assigned_Numbers_Authority)（InternetAssigned Numbers Authority，IANA）专门分配了4789作为VTEP设备的UDP端口（以前Linux VXLAN用的默认端口是8472）。

从Linux Kernel 3.7版本起，Linux系统就开始支持VXLAN。到了3.12版本，Linux对VXLAN的支持已达到完全完备的程度，能够处理单播和组播，能够运行于IPv4和IPv6之上，一台Linux主机经过简单配置之后，便可以把Linux Bridge作为VTEP设备使用。

VXLAN带来了很高的灵活性、扩展性和可管理性，同一套物理网络中可以任意创建多个VXLAN网络，每个VXLAN中接入的设备都仿佛是在一个完全独立的二层局域网中一样，不会受到外部广播的干扰，也很难遭受外部的攻击，这使得VXLAN能够良好地匹配分布式系统的弹性需求。不过，VXLAN也带来了额外的复杂度和性能开销，具体表现在：

- 传输效率的下降，如果你仔细数过前面VXLAN报文结构中UDP、IP、以太帧报文头的字节数，会发现经过VXLAN封装后的报文，新增加的报文头部分就有整整占了50 Bytes（VXLAN报文头占8 Bytes，UDP报文头占8 Bytes，IP报文头占20 Bytes，以太帧的MAC头占14 Bytes），而原本只需要14 Bytes而已，而且现在这14 Bytes也还在，被封到了最里面的以太帧中。以太网的[MTU](https://en.wikipedia.org/wiki/Maximum_transmission_unit)是1500 Bytes，如果是传输大量数据，额外损耗50 Bytes并不算很高的成本，但如果传输的数据本来就只有几个Bytes的话，那传输消耗在报文头上的成本就很高昂了。

- 传输性能的下降，每个VXLAN报文的封包和解包操作都属于额外的处理过程，尤其是用软件来实现的VTEP，额外的运算资源消耗有时候会成为不可忽略的性能影响因素。

### 副本网卡：MACVLAN

理解了VLAN和VXLAN的原理后，我们就有足够的前置知识去了解[MACVLAN](https://github.com/moby/libnetwork/blob/master/docs/macvlan.md)这最后一种网络设备虚拟化的方式了。

前文中提到了两个VLAN之间位于独立的广播域，是完全二层隔离的，要通讯就只能通过三层设备。最基础的三层通讯就是靠单臂路由了。笔者以下图所示的网络拓扑结构来举个具体例子，介绍单臂路由是如何工作的：

:::center
![](./images/vlan-router.png)
VLAN单臂路由原理
:::

假设位于VLAN-A中的主机A1希望将数据包发送给VLAN-B中的主机B2，由于A、B两个VLAN之间二层链路不通，因此需引入单臂路由，单臂路由不属于任何VLAN，它与交换机之间的链路允许任何VLAN ID的数据包通过，这种接口被称为TRUNK。这样，A1要和B2通讯，A1就将数据包先发送给路由（把路由设置为网关即可），然后路由根据数据包上的IP地址得知B2的位置，去掉VLAN A的VLAN Tag，改用VLAN B的VLAN Tag重新封装数据包后发回给交换机，交换机收到后就可以顺利转发给B2了。这个过程并没什么复杂的地方，但你是否注意到一个问题，路由器应该设置怎样的IP地址呢？由于A、B处于独立的网段上，它们又各自要将同一个路由作为网关使用，这就要求路由器必须同时具备192.168.1.0/24和192.168.2.0/24的地址。如果真的就只有A、B两个VLAN，那把路由器上的两个接口分别设置IP地址，然后用两条网线分别连接到交换机上也勉强算是一个解决办法，但VLAN最多支持4096个VLAN，如果要接4000多条网线就太离谱了。为了解决这个问题，802.1Q规范中专门定义了子接口（Sub-Interface）的概念，允许在同一张物理网卡上，针对不同的VLAN绑定不同的IP地址。

MACVLAN的思路是在VLAN子接口的基础上更进一步，不仅允许对同一个网卡设置多个IP地址，还允许对同一张网卡上设置多个MAC地址，这也是MACVLAN名字的由来。原本MAC地址是网卡接口的“身份证”，应该是一对一的关系，而MACVLAN的原理是在物理设备之上、网络栈之下生成多个虚拟的Device，每个Device都有一个MAC地址，新增Device的操作相当于在系统中注册了一个收发特定数据包的回调函数，每个回调函数都能对一个MAC地址的数据包进行响应，当物理设备收到数据包时，会先根据MAC地址判断一次，确定交给哪个Device处理，如下图所示。以交换机一侧的视角来看，这个端口后面仿佛是另一台已经连接了多个设备的交换机而已。

:::center
![](./images/macvlan.png)
MACVLAN原理
:::

用MACVLAN技术虚拟出来的副本网卡，在逻辑上和物理网卡是完全对等的，物理网卡实际上确实承担着类似交换机的职责，收到数据包后，根据目的MAC地址判断这个包应转发给哪块副本网卡处理，由同一块物理网卡虚拟出来的副本网卡，天然处于同一个VLAN之中，可以直接通讯，不需要将流量转发到外部网络。

与Linux Bridge相比，这种模拟交换机的方法在功能层面上看并没有本质的不同，但MACVLAN在内部实现上要比Linux Bridge轻量得多。从数据流来看，副本网卡的通讯只比物理网卡多了一次判断而已，能获得很高的网络性能；从操作步骤来看，由于MAC地址是静态的，所以MACVLAN不需要像Linux Bridge那样考虑MAC地址学习、STP协议等复杂的算法，这进一步加大了MACVLAN的性能优势。

除了模拟交换机的Bridge模式外，MACVLAN还支持虚拟以太网端口聚合模式（Virtual Ethernet Port Aggregator，VEPA）、Private模式、Passthru模式、Source模式等另外几种工作模式，有兴趣可以参考相关资料，笔者就不再一一介绍了。

## 容器间通讯

经过对虚拟化网络基础知识的一番铺垫后，在最后这个小节里，我们尝试使用这些知识去理解容器间通讯，毕竟运用知识去解决问题才是笔者介绍网络虚拟化的根本目的。这节我们先以Docker为目标，谈一谈[Docker所提供的容器通讯方案](https://docs.docker.com/network/)。下节介绍过CNI下的网络插件生态后，你也许会觉得Docker的网络通讯相对简单，对于某些分布式系统的需求来说甚至是过于简陋了，然而，容器间的网络方案多种多样，但通讯主体都是固定的，不外乎没有物理设备的虚拟主体（容器、Pod、Service、Endpoints等等）、不需要跨网络的本地主机、以及通过网络连接的外部主机三种层次，所有的网络通讯问题，都可以归结为本地主机内部的多个容器之间、本地主机与内部容器之间和跨越不同主机的多个容器之间的通讯问题，所以Docekr网络的简单，在作为检验前面网络知识有没有理解到位时倒不失为一种优势。

Docker的网络方案在操作层面上是指能够直接通过`docker run --network`参数指定的网络，或者先`docker network create`创建后再被容器使用的网络。安装Docker过程中会自动在宿主机上创建一个名为docker0的网桥，以及三种不同的网络，分别是bridge、host和none，你可以通过`docker network ls`命令查看到这三种网络，具体如下所示：

```bash
$ docker network ls
NETWORK ID          NAME                                    DRIVER              SCOPE
2a25170d4064        bridge                                  bridge              local
a6867d58bd14        host                                    host                local
aeb4f8df39b1        none                                    null                local
```

这三种网络，对应着Docker提供的三种开箱即用的网络方案，它们分别为：

- **桥接模式**，使用`--network=bridge`指定，这种也是未指定网络参数时的默认网络。桥接模式下，Docekr会为新容器分配独立的网络名称空间，创建好veth pair，一端接入容器，另一端接入到docker0网桥上。Docker为每个容器自动分配好IP地址（默认配置下地址范围是172.17.0.0/24，docker0的地址默认是172.17.0.1），并且设置所有容器的网关均为docker0，这样所有接入同一个网桥内的容器直接依靠二层转发来通讯，在此范围之外的容器、主机就通过网关来访问，具体过程笔者在介绍Linux Bridge时举例详细讲解过。
- **主机模式**，使用`--network=host`指定。主机模式下，Docker不会为新容器创建独立的网络名称空间，这样容器一切的网络设施，如网卡、网络栈等都直接使用宿主机上的，容器也就不会有自己独立的IP地址。此模式下与外界通讯无需进行NAT转换，没有性能损耗，但缺点也很明显，没有隔离就无法避免网络资源（譬如端口号）的冲突。
- **空置模式**，使用`--network=none`指定，空置模式下，Docekr会给新容器创建独立的网络名称空间，但是不会创建任何虚拟的网络设备，此时容器能看到的只有一个回环设备（Loopback Device）而已。提供这种方式是为了方便用户去做自定义的网络配置，如自己增加网络设备、自己管理IP地址，等等。

除了三种开箱即用的网络外，Docker还支持以下自己创建的网络：

- **容器模式**，创建容器后使用`--network=container:容器名称`指定。容器模式下，新创建的容器将会加入指定的容器的网络名称空间，共享一切的网络资源（但其他资源，如文件、PID等默认仍然是隔离的），两个容器间可以直接使用回环地址（localhost）通讯，端口号等网络资源不能有冲突。
- **MACVLAN模式**：使用`docker network create -d macvlan`创建，此网络允许为容器指定一个副本网卡，容器通过副本网卡的MAC地址来使用宿主机上的物理设备，在追求通讯性能的场合这种网络是比较好的选择。Docker的MACVLAN只支持Bridge通讯模式，因此在功能表现上与桥接模式是类似的。
- **Overlay模式**：使用`docker network create -d overlay`创建，Docker说的Overlay网络实际上是VXLAN，主要用于Docker Swarm服务之间进行通讯。然而由于Docker Swarm败于Kubernetes，并未成为主流，所有这种网络模式实际很少使用。
