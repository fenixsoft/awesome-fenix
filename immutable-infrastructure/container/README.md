# 虚拟化容器

容器技术可以说是云计算、微服务等许多当前软件业界热门词汇的共同前提，容器最基本的目标是让软件分发部署过程从传统的分发安装包、由人工部署转变为直接分发已经部署好的、包含整套运行环境的虚拟化镜像。在容器技术成熟之前，软件部署过程多由系统管理员拿到静态的二进制安装包，根据软件的部署说明文档准备好正确的操作系统、动态链接库、配置文件、资源权限等各种前置依赖以后，才能将程序正确地运行起来。[Chad Fowler](http://chadfowler.com/)提出“不可变基础设施”这个概念的文章《[Trash Your Servers and Burn Your Code](http://chadfowler.com/2013/06/23/immutable-deployments.html)》中开篇就直接吐槽：要把一个不知道打过多少个升级补丁，不知道经历了多少任管理员的系统迁移到其他机器上，无疑是一场灾难。

让软件能够在任何环境、任何物理机器上达到“一次编译，到处运行”是Java早年提出的宣传口号，这不是一个简单的目标，通用意义的“到处运行”仅靠Java语言和Java虚拟机也是很难达成的。一个计算机软件要能够正确运行，需要有以下三方面的兼容性保证：

- **ISA兼容**：目标机器指令集兼容性，譬如ARM架构的计算机无法直接运行面向x86架构编译的程序。
- **ABI兼容**：目标系统或者依赖库的二进制兼容性，譬如Windows系统环境中无法直接运行Linux的程序，又譬如DirectX 12的游戏无法运行在DirectX 9之上。
- **环境兼容**：目标环境的兼容性，譬如没有正确设置的配置文件、服务注册中心、数据库地址、文件系统的权限等等，任何一个环境因素出现错误，都会让你的程序无法正常运行。

人们把使用仿真（Emulation，代表为[QEMU](https://www.qemu.org/)和[Bochs](http://bochs.sourceforge.net/)）或者虚拟化（Virtualization，主要包括软件的二进制翻译和硬件虚拟化两种，代表是[VMware](https://www.vmware.com/)和[VirtualBox](https://www.virtualbox.org/)）技术来解决以上三项兼容性的方法都统称为虚拟化。

:::quote 额外知识：ISA与ABI

[指令集架构](https://en.wikipedia.org/wiki/Instruction_set_architecture)（Instruction Set Architecture，ISA）是计算机体系结构中与程序设计有关的部分，包含了基本数据类型，指令集，寄存器，寻址模式，存储体系，中断，异常处理以及外部I/O。指令集架构包含一系列的Opcode操作码（即通常所说的机器语言），以及由特定处理器执行的基本命令。

[应用二进制接口](https://en.wikipedia.org/wiki/Application_binary_interface)（Application Binary Interface，ABI）是应用程序与操作系统之间或其他依赖库之间的低级接口。ABI涵盖了各种底层细节，如数据类型的宽度大小、对象的布局、接口调用约定等等。ABI不同于应用程序接口（Application Programming Interface，API），API定义的是源代码和库之间的接口，因此同样的代码可以在支持这个API的任何系统中编译，然而ABI允许编译好的目标代码在使用兼容ABI的系统中无需改动就能直接运行。

:::

我们今天所讨论的虚拟化容器并没有提供以上全部三项兼容性，容器化（Containerization）只是虚拟化的一个子集，在“容器”这个名称流行之前，它更多被称做[操作系统层虚拟化](https://en.wikipedia.org/wiki/OS-level_virtualization)（OS-Level Virtualization），只提供了操作系统内核以上的部分ABI兼容性与完整的环境兼容性。这决定了如果没有其他虚拟化手段的帮助，我们在Windows系统上是不能运行Linux的Docker镜像的（现在可以，是因为有其他虚拟机或者[WSL2](https://docs.microsoft.com/en-us/windows/wsl/wsl2-index)的支持），反之亦然。也决定了如果你Docker宿主机的内核版本是Linux Kernel 5.5，那无论上面运行的镜像是Ubuntu、RHEL、Fedora、Mint或者任何发行版，看到的内核一定都是相同的Linux Kernel 5.5。