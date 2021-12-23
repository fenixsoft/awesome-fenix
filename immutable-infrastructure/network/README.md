# 容器间网络

本章我们将会讨论[虚拟化网络](https://en.wikipedia.org/wiki/Network_virtualization)方面的话题，如果不加任何限定，“虚拟化网络”是一项内容十分丰富，研究历史十分悠久的计算机技术，是计算机科学中一门独立的分支，完全不依附于虚拟化容器而存在。网络运营商常提及的“[网络功能虚拟化](https://en.wikipedia.org/wiki/Network_function_virtualization)”（Network Function Virtualization，NFV），网络设备商和网络管理软件提供商常提及的“[软件定义网络](https://en.wikipedia.org/wiki/Software-defined_networking)”（Software Defined Networking，SDN）等都属于虚拟化网络的范畴。对于普通的软件开发者而言，要完全理解和掌握虚拟化网络，需要储备大量开发中不常用到的专业知识与消耗大量的时间成本，一般并无必要。

本节我们讨论的虚拟化网络是狭义的，它特指“基于 Linux 系统的网络虚拟化技术来实现的容器间网络通信”，更通俗一点说，就是只关注那些为了相互隔离的 Linux 网络名称空间可相互通信而设计出来的虚拟化网络设施，讨论这个问题所需的网络知识，基本还是在普通开发者应该具有的合理知识范畴之内。在这个语境中的“虚拟化网络”就是直接为容器服务的，说它是依附于容器而存在的亦无不可，因此为避免混淆，笔者在后文中会尽量回避“虚拟化网络”这个范畴过大的概念，后续的讨论将会以“Linux 网络虚拟化”和“容器网络与生态”为题来展开。
