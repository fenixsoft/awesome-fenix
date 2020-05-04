# 原始分布式时代

:::tip Unix时代的分布式设计哲学

使用多个独立的分布式服务共同构建一个更大型系统，尽可能促使服务交互透明与简单，令开发人员不必过份关注他们访问的方法或其他资源是位于本地还是远程。

:::

可能与绝大多数人心中的认知会有差异，“使用多个独立的分布式服务共同构建一个更大型系统”的设想与实际尝试，反而要比今天大家所了解的大型单体系统出现的时间更早。

在20世纪的70年代末期到80年代初，计算机科学刚经历了从以大型机为主向以微型机为主的蜕变，计算机逐渐从一种存在于研究机构、实验室当中的科研设备，转变为存在于商业企业中甚至家庭用户的生产设备。此时的计算机系统通常具有16位、不足5MB Hz时钟频率的处理器和128KB左右的内存空间，譬如，著名英特尔处理器的鼻祖，[Intel 8086处理器](https://zh.wikipedia.org/zh-tw/Intel_8086)就是在1978年发布，流行于80年代中期，甚至一直持续到90年代初期。当时计算机的硬件水平的局限性，已直接妨碍到了单台计算机上信息系统软件能够达到的最大规模，为了突破硬件算力限制，Unix系统标准化组织[开放软件基金会](https://zh.wikipedia.org/wiki/%E9%96%8B%E6%94%BE%E8%BB%9F%E9%AB%94%E5%9F%BA%E9%87%91%E6%9C%83)（Open Software Foundation，OSF，也即后来的“国际开放标准组织”）制订了一种名为“[分布式运算环境](https://zh.wikipedia.org/wiki/%E5%88%86%E6%95%A3%E5%BC%8F%E9%81%8B%E7%AE%97%E7%92%B0%E5%A2%83)”（Distributed Computing Environment，DCE）的软件架构，其中包括了一整套完整的分布式服务组件与规范，DCE提出的很多技术、概念对*nix系统后续的发展，甚至是今天计算机科学的诸多领域都产生了巨大而深远的影响，譬如远程服务调用（Remote Procedure Call，当时被称为[DCE/RPC](https://zh.wikipedia.org/wiki/DCE/RPC)，后来Sun向IEFT提交了不局限于Unix系统的、基于TCP/IP、更通用的远程服务调用标准[ONC RPC](https://zh.wikipedia.org/wiki/%E9%96%8B%E6%94%BE%E7%B6%B2%E8%B7%AF%E9%81%8B%E7%AE%97%E9%81%A0%E7%AB%AF%E7%A8%8B%E5%BA%8F%E5%91%BC%E5%8F%AB)），分布式文件系统（Distributed File System，当时被称为[DCE/DFS](DCE/DFS)）、时间服务、授权服务，等等。

当时研究这些分布式技术，最主要的目标是实现分布式环境中的服务调用、资源访问、数据存储等操作尽可能的透明化，使开发人员不必过于关注他们访问的方法或其他资源是位于本地还是远程，这样的主旨非常符合一贯的[Unix设计哲学](https://en.wikipedia.org/wiki/Unix_philosophy#cite_note-0)（曾有过几个版本的不同说法，不过广为人知的[“KISS”原则](https://en.wikipedia.org/wiki/KISS_principle)是最基础、无争议的一条），但这个过于理想化的目标背后其实蕴含着当时根本不可能完美解决的技术困难，研究最终结果是实现了远程服务的调用，但远远没有能做到“透明”，本地与远程无论是编码、运行还是效率角度上看，都有着天壤之别。

这次研究是计算机科学中第一次有组织领导、有标准可循、有巨大投入的分布式计算的尝试，但无论是DCE还是稍后出现的CORBA，都不能算取得了成功，将一个系统直接拆分到不同的机器之中，这样做带来的服务的发现、跟踪、通讯、容错、隔离、配置、传输、数据一致性和编码复杂度等方面的问题，所付出的代价远远超过了分布式所取得的收益，这次尝试最大的收获就是对RPC、DFS等概念的开创，以及得到了一个价值千金的教训：“**某个功能能够进行分布式，并不意味着它就应该进行分布式，强行这么做，只会自寻苦果**”。

:::quote Observation about distributed computing

Just because something **can** be distributed doesn’t mean it **should** be distributed. Trying to make a distributed call act like a local call always ends in tears

:::right 

—— [Kyle Brown](https://en.wikipedia.org/wiki/Kyle_Brown_(computer_scientist))，IBM Fellow，[Beyond buzzwords: A brief history of microservices patterns](https://developer.ibm.com/technologies/microservices/articles/cl-evolution-microservices-patterns/)，2016

:::

上世纪80年代正是[摩尔定律](https://zh.wikipedia.org/wiki/%E6%91%A9%E5%B0%94%E5%AE%9A%E5%BE%8B)开始稳定发挥作用的黄金时期，微型计算机的性能以每两年增长一倍的速度提升。硬件算力束缚软件规模的链条很快变得松动，信息系统开始了以单台或少数几台微机即可作为服务器的单体系统时代，尽管如此，对分布式计算、远程服务调用的研究从未有过中断。关于远程服务调用这条分支早期的发展与现状，笔者已在服务设计风格中“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html)”一节有过介绍。而在原始分布式时代中遭遇到的其他问题，还将会在后面几个时代中被反复提起。

