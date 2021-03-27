# 容器的崛起

容器的最初的目的不是为了部署软件，而是为了隔离计算机中的各类资源，以便降低软件开发、测试阶段可能产生的误操作风险，或者专门充当[蜜罐](https://en.wikipedia.org/wiki/Honeypot_(computing))，吸引黑客的攻击，以便监视黑客的行为。下面，笔者将以容器发展历史为线索，介绍容器技术在不同历史阶段中的主要关注点。

## 隔离文件：chroot

容器的起点可以追溯到1979年[Version 7 UNIX](https://en.wikipedia.org/wiki/Version_7_Unix)系统中提供的`chroot`命令，这个命令是英文单词“Change Root”的缩写，功能是当某个进程经过`chroot`操作之后，它的根目录就会被锁定在命令参数所指定的位置，以后它或者它的子进程将不能再访问和操作该目录之外的其他文件。

1991年，世界上第一个监控黑客行动的蜜罐程序就是使用`chroot`来实现的，那个参数指定的根目录当时被作者被戏称为“Chroot监狱”（Chroot Jail），黑客突破`chroot`限制的方法就称为Jailbreak。后来，FreeBSD 4.0系统重新实现了`chroot`命令，用它作为系统中进程沙箱隔离的基础，并将其命名为[FreeBSD jail](https://en.wikipedia.org/wiki/FreeBSD_jail)，再后来，苹果公司又以FreeBSD为基础研发出了举世闻名的iOS操作系统，此时，黑客们就将绕过iOS沙箱机制以root权限任意安装程序的方法称为“[越狱](https://en.wikipedia.org/wiki/IOS_jailbreaking)”（Jailbreak），这些故事都是题外话了。

2000年，Linux Kernel 2.3.41版内核引入了`pivot_root`技术来实现文件隔离，`pivot_root`直接切换了[根文件系统](https://en.wikipedia.org/wiki/Filesystem_Hierarchy_Standard)（rootfs），有效地避免了`chroot`命令可能出现的安全性漏洞。本文后续提到的容器技术，如LXC、Docker等也都是优先使用`pivot_root`来实现根文件系统切换的。

时至今日，`chroot`命令依然活跃在UNIX系统与几乎所有主流的Linux发行版中，同时以命令行工具（[chroot(8)](https://linux.die.net/man/8/linux-user-chroot)）或者系统调用（[chroot(2)](https://linux.die.net/man/2/chroot)）的形式存在，但无论是`chroot`命令抑或是`pivot_root`，都并不能提供完美的隔离性。原本按照UNIX的设计哲学，[一切资源都可以视为文件](https://en.wikipedia.org/wiki/Everything_is_a_file)（In UNIX，Everything is a File），一切处理都可以视为对文件的操作，理论上，只要隔离了文件系统，一切资源都应该被自动隔离才对。可是哲学归哲学，现实归现实，从硬件层面暴露的低层次资源，如磁盘、网络、内存、处理器，到经操作系统层面封装的高层次资源，如UNIX分时（UNIX Time-Sharing，UTS）、进程ID（Process ID，PID）、用户ID（User ID，UID）、进程间通信（Inter-Process Communication，IPC）都存在大量以非文件形式暴露的操作入口，因此，以`chroot`为代表的文件隔离，仅仅是容器崛起之路的起点而已。

## 隔离访问：namespaces

2002年，Linux Kernel 2.4.19版内核引入了一种全新的隔离机制：[Linux名称空间](https://en.wikipedia.org/wiki/Linux_namespaces)（Linux Namespaces）。名称空间的概念在很多现代的高级程序语言中都存在，用于避免不同开发者提供的API相互冲突，相信作为一名开发人员的你肯定不陌生。

Linux的名称空间是一种由内核直接提供的全局资源封装，是内核针对进程设计的访问隔离机制。进程在一个独立的Linux名称空间中朝系统看去，会觉得自己仿佛就是这方天地的主人，拥有这台Linux主机上的一切资源，不仅文件系统是独立的，还有着独立的PID编号（譬如拥有自己的0号进程，即系统初始化的进程）、UID/GID编号（譬如拥有自己独立的root用户）、网络（譬如完全独立的IP地址、网络栈、防火墙等设置），等等，此时进程的心情简直不能再好了。

Linux的名称空间是受“[贝尔实验室九号项目](https://en.wikipedia.org/wiki/Plan_9_from_Bell_Labs)”（一个分布式操作系统，“九号”项目并非代号，操作系统的名字就叫“Plan 9 from Bell Labs”，充满了赛博朋克风格）的启发而设计的，最初的目的依然只是为了隔离文件系统，而非为了什么容器化的实现。这点从2002年发布时只提供了Mount名称空间，并且其构造参数为“CLONE_NEWNS”（即Clone New Namespace的缩写）而非“CLONE_NEWMOUNT”便能看出一些端倪。后来，要求系统隔离其他访问操作的呼声愈发强烈，从2006年起，内核陆续添加了UTS、IPC等名称空间隔离，直到目前最新的Linux Kernel 5.6版内核为止，Linux名称空间支持以下八种资源的隔离（内核的官网[Kernel.org](https://www.kernel.org/)上仍然只列出了[前六种](https://www.kernel.org/doc/html/latest/admin-guide/namespaces/compatibility-list.html)，从Linux的Man命令能查到[全部八种](https://man7.org/linux/man-pages/man7/namespaces.7.html)）。

:::center

表11-1 Linux名称空间支持以下八种资源的隔离

:::

| <div style="width:70px">名称空间</div> | 隔离内容                                                     | <div style="width:50px">内核版本</div> |
| :------- | ------------------------------------------------------------ | -------- |
| Mount    | 隔离文件系统，功能上大致可以类比`chroot`                    | 2.4.19   |
| UTS      | 隔离主机的[Hostname](https://en.wikipedia.org/wiki/Hostname)、[Domain names](https://en.wikipedia.org/wiki/Domain_name) | 2.6.19   |
| IPC      | 隔离进程间通信的渠道（详见“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”中对IPC的介绍） | 2.6.19   |
| PID      | 隔离进程编号，无法看到其他名称空间中的PID，意味着无法对其他进程产生影响 | 2.6.24   |
| Network  | 隔离网络资源，如网卡、网络栈、IP地址、端口，等等             | 2.6.29   |
| User     | 隔离用户和用户组                                             | 3.8      |
| Cgroup   | 隔离`cgourps`信息，进程有自己的`cgroups`的根目录视图（在/proc/self/cgroup不会看到整个系统的信息）。`cgroups`的话题很重要，稍后笔者会安排一整节来介绍 | 4.6      |
| Time     | 隔离系统时间，2020年3月最新的5.6内核开始支持进程独立设置系统时间 | 5.6      |

如今，对文件、进程、用户、网络等各类信息的访问，都被囊括在Linux的名称空间中，即使一些今天仍有没被隔离的访问（譬如[syslog](https://en.wikipedia.org/wiki/Syslog)就还没被隔离，容器内可以看到容器外其他进程产生的内核syslog），日后也可以随内核版本的更新纳入到这套框架之内，现在距离完美的隔离性就只差最后一步了：资源的隔离。

## 隔离资源：cgroups

如果要让一台物理计算机中的各个进程看起来像独享整台虚拟计算机的话，不仅要隔离各自进程的访问操作，还必须能独立控制分配给各个进程的资源使用配额，不然的话，一个进程发生了内存溢出或者占满了处理器，其他进程就莫名其妙地被牵连挂起，这样肯定算不上是完美的隔离。

Linux系统解决以上问题的方案是[控制群组](https://en.wikipedia.org/wiki/Cgroups)（Control Groups，目前常用的简写为`cgroups`），它与名称空间一样都是直接由内核提供的功能，用于隔离或者说分配并限制某个进程组能够使用的资源配额，资源配额包括处理器时间、内存大小、磁盘I/O速度，等等，具体可以参见表11-2所示。

:::center

表11-2 Linux控制群组子系统

:::

| 控制组子系统 | 功能                                                         |
| ------------ | ------------------------------------------------------------ |
| blkio        | 为块设备（如磁盘，固态硬盘，USB 等等）设定I/O限额。          |
| cpu          | 控制`cgroups`中进程的处理器占用比率。                        |
| cpuacct      | 自动生成`cgroups`中进程所使用的处理器时间的报告。            |
| cpuset       | 为`cgroups`中的进程分配独立的处理器（包括多路系统的处理器，多核系统的处理器核心）。 |
| devices      | 设置`cgroups`中的进程访问某个设备的权限（读、写、创建三种权限）。 |
| freezer      | 挂起或者恢复`cgroups`中的进程。                              |
| memory       | 设定`cgroups`中进程使用内存的限制，并自动生成内存资源使用报告。 |
| net_cls      | 使用等级识别符标记网络数据包，可允许Linux流量控制程序识别从具体 `cgroups`中生成的数据包。 |
| net_prio     | 用来设置网络流量的优先级。                                   |
| hugetlb      | 主要针对于HugeTLB系统进行限制。                              |
| perf_event   | 允许Perf工具基于`cgroups`分组做性能监测。                    |

`cgroups`项目最早是由Google的工程师（主要是Paul Menage和Rohit Seth）在2006年发起的，当时取的名字就叫作“进程容器”（Process Containers），不过“容器”（Container）这个名词的定义在那时候尚不如今天清晰，不同场景中常有不同所指，为避免混乱，2007年这个项目才被重命名为`cgroups`，在2008年合并到2.6.24版的内核后正式对外发布，这一阶段的`cgroups`被称为“第一代`cgroups`”。2016年3月发布的Linux Kernel 4.5中，搭载了由Facebook工程师（主要是Tejun Heo）重新编写的“第二代`cgroups`”，其关键改进是支持统一层级管理（[Unified Hierarchy](https://www.kernel.org/doc/Documentation/cgroup-v2.txt)），使得管理员能更加清晰精确地控制资源的层级关系。目前这两个版本的`cgroups`在Linux内核代码中是并存的，稍后介绍的Docker暂时仅支持第一代的`cgroups`。

## 封装系统：LXC

当文件系统、访问、资源都可以被隔离后，容器已经有它降生所需的全部前置支撑条件，并且Linux的开发者们也已经明确地看到了这一点。为降低普通用户综合使用`namespaces`、`cgroups`这些低级特性的门槛，2008年Linux Kernel 2.6.24内核刚刚开始提供`cgroups`的同一时间，就马上发布了名为[Linux容器](https://en.wikipedia.org/wiki/LXC)（LinuX Containers，LXC）的系统级虚拟化功能。

此前，在Linux上并不是没有系统级虚拟化的解决方案，譬如传统的[OpenVZ](https://zh.wikipedia.org/wiki/OpenVZ)和[Linux-VServer](https://en.wikipedia.org/wiki/Linux-VServer)都能够实现容器隔离，并且只会有很低的性能损失（按OpenVZ提供的数据，只会有1-3%的损失），但它们都是非官方的技术，使用它们最大的阻碍是系统级虚拟化必须要有内核的支持，为此它们就只能通过非官方内核补丁的方式修改标准内核，才能获得那些原本在内核中不存在的能力。

LXC带着令人瞩目的光环登场，它的出现促使“容器”从一个阳春白雪的只流传于开发人员口中的技术词汇，逐渐向整个软件业的公共概念、共同语言发展，就如同今天的“服务器”、“客户端”和“互联网”一样。相信你现在肯定会好奇为什么现在一提到容器，大家首先联想到的是Docker而不是LXC？为什么去问10个开发人员，至少有9个听过Docker，但如果问LXC，可能只有1个人会听说过？

LXC的出现肯定受到了OpenVZ和Linux-VServer的启发，摸着巨人的肩膀过河这并没有什么不对。可惜的是，LXC在设定自己的发展目标时，也被前辈们的影响所局限住。LXC眼中的容器的定义与OpenVZ和Linux-VServer并无差别，是一种封装系统的轻量级虚拟机，而Docker眼中的容器的定义则是一种封装应用的技术手段。这两种封装理念在技术层面并没有什么本质区别，但应用效果就差异巨大。举个具体例子，如果你要建设一个[LAMP](https://en.wikipedia.org/wiki/LAMP_(software_bundle))（Linux、Apache、MySQL、PHP）应用，按照LXC的思路，你应该先编写或者寻找到[LAMP的template](https://gist.github.com/ralt/492a09d9f9fea64fb28b)（可以暂且不准确地类比为LXC版本的Dockerfile吧），以此构造出一个安装了LAMP的虚拟系统。如果按部署虚拟机的角度来看，这的还算挺方便的，作为那个时代（距今也就十年）的系统管理员，所有软件、补丁、配置都是自己搞定的，部署一台新虚拟机要花费一两天时间都很正常，有LXC的template，一下子帮你把LAMP都安装好了，还想要啥自行车？但是，作为一名现代的系统管理员，这里问题就相当大，如果我想把LAMP改为LNMP（Linux、Nginx、MySQL、PHP）该怎么办？如果我想把LAMP里的MySQL 5调整为MySQL 8该怎么办？都得找到或者自己编写新的template来解决。好吧，那这台机的软件、版本都配置对了，下一台机我要构建[LYME](https://en.wikipedia.org/wiki/LYME_(software_bundle))或者[MEAN](https://en.wikipedia.org/wiki/MEAN_(solution_stack))，又该怎么办？以封装系统为出发点，仍是按照先装系统然再装软件的思路，就永远无法做到一两分钟甚至十几秒钟就构造出一个合乎要求的软件运行环境，也决定了LXC不可能形成今天的容器生态的，所以，接下来舞台的聚光灯终于落到了Docker身上。

## 封装应用：Docker

2013年宣布开源的Docker毫无疑问是容器发展历史上里程碑式的发明，然而Docker的成功似乎没有太多技术驱动的成分。至少对开源早期的Docker而言，确实没有什么能构成壁垒的技术。它的容器化能力直接来源于LXC，它镜像分层组合的文件系统直接来源于[AUFS](https://en.wikipedia.org/wiki/Aufs)，Docker开源后不久，就有人仅用了一百多行Shell脚本便实现了Docker的核心功能（名为[Bocker](https://github.com/p8952/bocker)，提供了`docker build/pull/images/ps/run/exec/logs/commit/rm/rmi`等功能）。

那为何历史选择了Docker，而不是LXC或者其他容器技术呢？对于这个问题，笔者引用（转述非直译，有所精简）DotCloud公司（当年创造Docker的公司，已于2016年倒闭）创始人Solomon Hykes在[Stackoverflow上的一段问答](https://stackoverflow.com/questions/17989306/what-does-docker-add-to-lxc-tools-the-userspace-lxc-tools/)：

:::quote 为什么要用Docker而不是LXC？（Why would I use Docker over plain LXC？）

Docker除了包装来自Linux内核的特性之外，它的价值还在于：

-  **跨机器的绿色部署**：Docker定义了一种将应用及其所有的环境依赖都打包到一起的格式，仿佛它原本就是[绿色软件](https://en.wikipedia.org/wiki/Portable_application)一样。LXC并没有提供这样的能力，使用LXC部署的新机器很多细节都依赖人的介入，虚拟机的环境几乎肯定会跟你原本部署程序的机器有所差别。
- **以应用为中心的封装**：Docker封装应用而非封装机器的理念贯穿了它的设计、API、界面、文档等多个方面。相比之下，LXC将容器视为对系统的封装，这局限了容器的发展。
- **自动构建**：Docker提供了开发人员从在容器中构建产品的全部支持，开发人员无需关注目标机器的具体配置，即可使用任意的构建工具链，在容器中自动构建出最终产品。
- **多版本支持**：Docker支持像Git一样管理容器的连续版本，进行检查版本间差异、提交或者回滚等操作。从历史记录中你可以查看到该容器是如何一步一步构建成的，并且只增量上传或下载新版本中变更的部分。
- **组件重用**：Docker允许将任何现有容器作为基础镜像来使用，以此构建出更加专业的镜像。
- **共享**：Docker拥有公共的镜像仓库，成千上万的Docker用户在上面上传了自己的镜像，同时也使用他人上传的镜像。
- **工具生态**：Docker开放了一套可自动化和自行扩展的接口，在此之上，还有很多工具来扩展其功能，譬如容器编排、管理界面、持续集成等等。

:::right

—— Solomon Hykes，[Stackoverflow](https://stackoverflow.com/questions/17989306/what-does-docker-add-to-lxc-tools-the-userspace-lxc-tools/)，2013

:::

以上这段回答也同时被收录到了[Docker官网的FAQ](https://docs.docker.com/engine/faq/)上，从Docker开源至今从未改变。促使Docker的一问世就惊艳世间的，不是什么黑科技式的秘密武器，而是其符合历史潮流的创意与设计理念，还有充分开放的生态运营。可见，在正确的时候，正确的人手上有一个优秀的点子，确实有机会引爆一个时代。

:::center
![](./images/docker.jpg)
图11-1 受到广泛认可的Docker<br/>以上是Docker开源一年后（截至2014年12月）获得的成绩，图片来自[Docker官网](https://www.docker.com/company/aboutus/)
:::

从开源到现在也只过了短短数年时间，Docker已成为软件开发、测试、分发、部署等各个环节都难以或缺的基础支撑，自身的架构也发生了相当大的改变，Docker被分解为由Docker Client、Docker Daemon、Docker Registry、Docker Container等子系统，以及Graph、Driver、libcontainer等各司其职的模块组成，此时再说一百多行脚本能实现Docker核心功能，再说Docker没有太高的技术含量，就已经不再合适了。

2014年，Docker开源了自己用Golang开发的[libcontainer](https://github.com/opencontainers/runc/tree/master/libcontainer)，这是一个越过LXC直接操作`namespaces`和`cgroups`的核心模块，有了libcontainer以后，Docker就能直接与系统内核打交道，不必依赖LXC来提供容器化隔离能力了。

2015年，在Docker的主导和倡议下，多家公司联合制定了“[开放容器交互标准](https://en.wikipedia.org/wiki/Open_Container_Initiative)”（Open Container Initiative，OCI），这是一个关于容器格式和运行时的规范文件，其中包含运行时标准（[runtime-spec](https://github.com/opencontainers/runtime-spec/blob/master/spec.md) ）、容器镜像标准（[image-spec](https://github.com/opencontainers/image-spec/blob/master/spec.md)）和镜像分发标准（[distribution-spec](https://github.com/opencontainers/distribution-spec/blob/master/spec.md)，分发标准还未正式发布）。运行时标准定义了应该如何运行一个容器、如何管理容器的状态和生命周期、如何使用操作系统的底层特性（`namespaces`、`cgroup`、`pivot_root`等）；容器镜像标准规定了容器镜像的格式、配置、元数据的格式，可以理解为对镜像的静态描述；镜像分发标准则规定了镜像推送和拉取的网络交互过程。

为了符合OCI标准，Docker推动自身的架构继续向前演进，首先将libcontainer独立出来，封装重构成[runC项目](https://github.com/opencontainers/runc)，并捐献给了Linux基金会管理。runC是OCI Runtime的首个参考实现，提出了“让标准容器无所不在”（Make Standard Containers Available Everywhere）的口号。为了能够兼容所有符合标准的OCI Runtime实现，Docker进一步重构了Docker Daemon子系统，将其中与运行时交互的部分抽象为[containerd项目](https://containerd.io/)，这是一个负责管理容器执行、分发、监控、网络、构建、日志等功能的核心模块，内部会为每个容器运行时创建一个containerd-shim适配进程，默认与runC搭配工作，但也可以切换到其他OCI Runtime实现上（然而实际并没做到，最后containerd仍是紧密绑定于runC）。2016年，Docker把containerd捐献给了CNCF管理，runC与containerd两个项目的捐赠托管，即带有Docker对开源信念的追求，也带有Docker在众多云计算大厂夹击下自救的无奈，这两个项目将成为未来Docker消亡和存续的伏笔（看到本节末尾你就能理解这句矛盾的话了）。

:::center
![](./images/runc.png)
图11-2 Docker、containerd和runC的交互关系
:::

以上笔者列举的这些Docker推动的开源与标准化工作，既是对Docker为开源乃至整个软件业做出贡献的赞赏，也是为后面介绍容器编排时，讲述当前容器引擎的混乱关系做的前置铺垫。Docker目前无疑在容器领域具有统治地位，但统治的稳固程度不仅没到高枕无忧，说是危机四伏都不为过。目前已经有了可见的、足以威胁动摇Docker地位的潜在可能性正在酝酿，风险源于虽然Docker赢得了容器战争，但Docker Swarm却输掉了容器编排战争。从结果回望当初，Docker赢得容器战争有一些偶然，Docker Swarm输掉的编排战争却是必然的。

## 封装集群：Kubernetes

如果说以Docker为代表的容器引擎将软件的发布流程从分发二进制安装包转变为直接分发虚拟化后的整个运行环境，令应用得以实现跨机器的绿色部署；那以Kubernetes为代表的容器编排框架，就是把大型软件系统运行所依赖的集群环境也进行了虚拟化，令集群得以实现跨数据中心的绿色部署，并能够根据实际情况自动扩缩。

容器的崛起之路讲到Docker和Kubernetes这阶段，已经不再是介绍历史了，从这里开始发生的变化，都是近几年软件业界中的热点事件，也是这章要讨论的主要话题。现在笔者暂时不打算介绍Kubernetes的技术细节，它们将会被留到后面的文章中更详细的解析。这节里，我们首先从宏观层面去理解Kubernetes的诞生与演变的驱动力，这对正确理解未来云原生的发展方向至关重要。

Kubernetes可谓出身名门，前身是Google内部已运行多年的集群管理系统Borg，2014年6月使用Golang完全重写后开源。自诞生之日起，只要与云计算能稍微扯上关系的业界巨头都对Kubernetes争相追捧，IBM、RedHat、Microsoft、VMware和华为都是它最早期的代码贡献者。此时，云计算从实验室到工业化应用已经有十个年头，然而大量应用使用云计算的方式仍停滞在传统IDC（Internet Data Center）时代，仅仅是用云端的虚拟机代替了传统的物理机。尽管早在2013年，Pivotal（持有着Spring Framework和Cloud Foundry的公司）就提出了“云原生”的概念，但是要实现服务化、具备韧性（Resilience）、弹性（Elasticity）、可观测性（Observability）的软件系统十分困难，在当时基本只能依靠架构师和程序员高超的个人能力，云计算本身帮不上什么忙。在云的时代不能充分利用云的强大能力，这让云计算厂商无比遗憾，也无比焦虑。直到Kubernetes横空出世，大家终于等到了破局的希望，认准了这就是云原生时代的操作系统，是让复杂软件在云计算下获得韧性、弹性、可观测性的最佳路径，也是为厂商们推动云计算时代加速到来的关键引擎之一。

2015年7月，Kubernetes发布了第一个正式版本1.0版，更重要的事件是Google宣布与Linux基金会共同筹建[云原生基金会](https://www.cncf.io/)（Cloud Native Computing Foundation，CNCF），并且将Kubernetes托管到CNCF，成为其第一个项目。随后，Kubernetes以摧枯拉朽之势覆灭了容器编排领域的其他竞争对手，哪怕Docker Swarm有着Docker在容器引擎方面的先天优势，DotCloud后来甚至将Swarm直接内置入Docker之中都未能稍稍阻挡Kubernetes的前进的步伐。

Kubernetes的成功与Docker的成功并不相同，Docker靠的是优秀的理念，以一个“好点子”引爆了一个时代。笔者相信就算没有Docker也会有Cocker或者Eocker的出现，但由成立仅三年的DotCloud公司（三年后又倒闭）做成了这样的产品确实有一定的偶然性。而Kubernetes的成功不仅有Google深厚的技术功底作支撑，有领先时代的设计理念，更加关键的是Kubernetes的出现符合所有云计算大厂的切身利益，有着业界巨头不遗余力的广泛支持，它的成功便是一种必然。

:::center
![](./images/kubernetes.png)
图11-3 Kubernetes与容器引擎的调用关系
:::

Kubernetes与Docker两者的关系十分微妙，把握住两者关系的变化过程，是理解Kubernetes架构演变与CRI、OCI规范的良好线索。在Kubernetes开源的早期，它是完全依赖且绑定Docker的，并没有过多考虑够日后有使用其他容器引擎的可能性。直至Kubernetes 1.5之前，Kubernetes 管理容器的方式都是通过内部的DockerManager向Docker Engine以HTTP方式发送指令，通过Docker来操作镜像的增删改查的，如上图最右边线路的箭头所示（图中的kubelet是集群节点中的代理程序，负责与管理集群的Master通信，其他节点的含义在后文介绍到时都会有解释）。将这个阶段Kubernetes与容器引擎的调用关系捋直，并结合上一节提到的Docker捐献containerd与runC后重构的调用，完整的调用链条如下所示：

:::center
> Kubernetes Master --> kubelet --> DockerManager --> Docker Engine --> containerd --> runC
:::

2016年，Kubernetes 1.5版本开始引入“[容器运行时接口](https://kubernetes.io/blog/2016/12/container-runtime-interface-cri-in-kubernetes/)”（Container Runtime Interface，CRI），这是一个定义容器运行时应该如何接入到kubelet的规范标准，从此Kubernetes内部的DockerManager就被更为通用的KubeGenericRuntimeManager所替代（实际上在1.6.6之前都仍然可以看到DockerManager），kubelet与KubeGenericRuntimeManager之间通过gRPC协议通信。由于CRI是在Docker之后才发布的规范，Docker是肯定不支持CRI的，所以Kubernetes又提供了DockerShim服务作为Docker与CRI的适配层，由它与Docker Engine以HTTP形式通信，实现了原来DockerManager的全部功能。此时，Docker对Kubernetes来说只是一项默认依赖，而非之前的无可或缺了，它们的调用链为：

:::center

> Kubernetes Master --> kubelet --> KubeGenericRuntimeManager --> DockerShim --> Docker Engine --> containerd --> runC
:::

2017年，由Google、RedHat、Intel、SUSE、IBM联合发起的[CRI-O](https://github.com/cri-o/cri-o)（Container Runtime Interface Orchestrator）项目发布了首个正式版本。从名字就可以看出，它肯定是完全遵循CRI规范进行实现的，另一方面，它可以支持所有符合OCI运行时标准的容器引擎，默认仍然是与runC搭配工作的，若要换成[Clear Containers](https://github.com/clearcontainers)、[Kata Containers](https://katacontainers.io/)等其他OCI运行时也完全没有问题。虽然开源版Kubernetes是使用CRI-O、cri-containerd抑或是DockerShim作为CRI实现，完全可以由用户自由选择（根据用户宿主机的环境选择），但在RedHat自己扩展定制的Kubernetes企业版，即[OpenShift 4](https://en.wikipedia.org/wiki/OpenShift)中，调用链已经没有了Docker Engine的身影：

:::center

> Kubernetes Master --> kubelet --> KubeGenericRuntimeManager --> CRI-O--> runC
:::

由于此时Docker在容器引擎中的市场份额仍然占有绝对优势，对于普通用户来说，如果没有明确的收益，并没有什么动力要把Docker换成别的引擎，所以CRI-O即使摆出了直接挖掉Docker根基的凶悍姿势，其实也并没有给Docker带来太多即时可见的影响，不过能够想像此时Docker心中肯定充斥了难以言喻的危机感。

2018年，由Docker捐献给CNCF的containerd，在CNCF的精心孵化下发布了1.1版，1.1版与1.0版的最大区别是此时它已完美地支持了CRI标准，这意味着原本用作CRI适配器的cri-containerd从此不再需要。此时，再观察Kubernetes到容器运行时的调用链，你会发现调用步骤会比通过DockerShim、Docker Engine与containerd交互的步骤要减少两步，这又意味着用户只要愿意抛弃掉Docker情怀的话，在容器编排上便可至少省略一次HTTP调用，获得性能上的收益，且根据Kubernetes官方给出的[测试数据](https://kubernetes.io/blog/2018/05/24/kubernetes-containerd-integration-goes-ga/)，这些免费的收益还相当地可观。Kubernetes从1.10版本宣布开始支持containerd 1.1，在调用链中已经能够完全抹去Docker Engine的存在：

:::center

> Kubernetes Master --> kubelet --> KubeGenericRuntimeManager --> containerd --> runC
:::

今天，要使用哪一种容器运行时取决于你安装Kubernetes时宿主机上的容器运行时环境，但对于云计算厂商来说，譬如国内的[阿里云ACK](https://cn.aliyun.com/product/kubernetes)、[腾讯云TKE](https://cloud.tencent.com/product/tke)等直接提供的Kubernetes容器环境，采用的容器运行时普遍都已是containerd，毕竟运行性能对它们来说就是核心生产力和竞争力。

未来，随着Kubernetes的持续发展壮大，Docker Engine经历从不可或缺、默认依赖、可选择、直到淘汰是大概率事件，这件事情表面上是Google、RedHat等云计算大厂联手所为，实际淘汰它的还是技术发展的潮流趋势，就如同Docker诞生时依赖LXC，到最后用libcontainer取代掉LXC一般。同时，我们也该看到事情的另一面，现在连LXC都还没有挂掉，反倒还发展出了更加专注于与OpenVZ等系统级虚拟化竞争的[LXD](https://linuxcontainers.org/lxd/introduction/)，相信Docker本身也很难彻底消亡的，已经养成习惯的CLI界面，已经形成成熟生态的镜像仓库等都应该会长期存在，只是在容器编排领域，未来的Docker很可能只会以runC和containerd的形式存续下去，毕竟它们最初都源于Docker的血脉。