# 容器存储与生态

容器存储具有很强的多样性，如何对接后端实际的存储系统，并且完全发挥出它所有的性能与功能并不是 Kubernetes 团队所擅长的工作，这件事情只有存储提供商自己才能做到最好。由此可以理解容器编排系统为何会有很强烈的意愿想把存储功能独立到外部去实现，在前面的讲解中，笔者已经反复提到过多次 In-Tree、Out-of-Tree 插件，这节，我们会以存储插件的接口与实现为中心，去解析 Kubernetes 的容器存储生态。

## Kubernetes 存储架构

正式开始讲解 Kubernetes 的 In-Tree、Out-of-Tree 存储插件前，我们有必要先去了解一点 Kubernetes 存储架构的知识，大体上弄清一个真实的存储系统是如何接入到新创建的 Pod 中，成为可以读写访问的 Volume 的；以及当 Pod 被销毁时，Volume 如何被回收，回归到存储系统之中的。Kubernetes 参考了传统操作系统接入或移除新存储设备做法，把接入或移除外部存储这件事情分解为以下三种操作：

- 首先，决定应**准备**（Provision）何种存储，Provision 可类比为给操作系统扩容而购买了新的存储设备。这步确定了接入存储的来源、容量、性能以及其他技术参数，它的逆操作是**移除**（Delete）存储。
- 然后，将准备好的存储**附加**（Attach）到系统中，Attach 可类比为将存储设备接入操作系统，此时尽管设备还不能使用，但你已经可以用操作系统的`fdisk -l`命令查看到设备。这步确定了存储的设备名称、驱动方式等面向系统一侧的信息，它的逆操作是**分离**（Detach）存储设备。
- 最后，将附加好的存储**挂载**（Mount）到系统中，Mount 可类比为将设备挂载到系统的指定位置，也就是操作系统中`mount`命令的作用。这步确定了存储的访问目录、文件系统格式等面向应用一侧的信息，它的逆操作是**卸载**（Unmount）存储设备。

以上提到的 Provision、Delete、Attach、Detach、Mount、Unmount 六种操作，并不是直接由 Kubernetes 来实现，实际行为均是在存储插件中完成的，它们会分别被 Kubernetes 通过两个控制器及一个管理器来进行调用，这些控制器、管理器的作用分别是：

- **PV 控制器**（PersistentVolume Controller）：“[以容器构建系统](/immutable-infrastructure/container/container-build-system.html#韧性与弹性)”一节中介绍过，Kubernetes 里所有的控制器都遵循着相同的工作模式——让实际状态尽可能接近期望状态。PV 控制器的期望状态有两个，分别是“所有未绑定的 PersistentVolume 都能处于可用状态”以及“所有处于等待状态的 PersistentVolumeClaim 都能配对到与之绑定的 PersistentVolume”，它内部也有两个相对独立的核心逻辑（ClaimWorker 和 VolumeWorker）来分别跟踪这两种期望状态，可以简单地理解为 PV 控制器实现了 PersistentVolume 和 PersistentVolumeClaim 的生命周期管理职能，在这个过程中，会根据需要调用存储驱动插件的 Provision/Delete 操作。
- **AD 控制器**（Attach/Detach Controller）：AD 控制器的期望状态是“所有被调度到准备新创建 Pod 的节点，都附加好了要使用的存储；当 Pod 被销毁后，原本运行 Pod 的节点都分离了不再被使用的存储”，如果实际状态不符合该期望，会根据需要调用存储驱动插件的 Attach/Detach 操作。
- **Volume 管理器**（Volume Manager）：Volume 管理器实际上是 kubelet 的一部分，是 kubelet 中众多管理器的其中一个，它主要是用来支持本节点中 Volume 执行 Attach/Detach/Mount/Unmount 操作。你可能注意到这里不仅有 Mount/Unmount 操作，也出现了 Attach/Detach 操作，这是历史原因导致的，由于最初版本的 Kubernetes 中并没有 AD 控制器，Attach/Detach 的职责也在 kubelet 中完成。现在 kubelet 默认情况下已经不再会执行 Attach/Detach 了，但有少量旧程序已经依赖了由 kubelet 来实现 Attach/Detach 的内部逻辑，所以 kubelet 不得不设计一个`--enable-controller-attach-detach`参数，如果将其设置为`false`的话就会重新回到旧的兼容模式上，由 kubelet 代替 AD 控制器来完成 Attach/Detach。

:::center
![](./images/storage-arch.png)
图 13-6 Kubernetes 存储架构
:::

后端的真实存储依次经过 Provision、Attach、Mount 操作之后，就形成了可以在容器中挂载的 Volume，当存储的生命周期完结，依次经过 Unmount、Detach、Delete 操作之后，Volume 便能够被存储系统回收。对于某些存储来说，其中有一些操作可能是无效的，譬如 NFS，实际使用并不需要 Attach，此时存储插件只需将 Attach 实现为空操作即可。

## FlexVolume 与 CSI

Kubernetes 目前同时支持[FlexVolume](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-storage/flexvolume.md)与[CSI](https://github.com/container-storage-interface/spec/blob/master/spec.md)（Container Storage Interface）两套独立的存储扩展机制。FlexVolume 是 Kubernetes 很早期版本（1.2 版开始提供，1.8 版达到 GA 状态）就开始支持的扩展机制，它是只针对 Kubernetes 的私有的存储扩展，目前已经处于冻结状态，可以正常使用但不再发展新功能了。CSI 则是从 Kubernetes 1.9 开始加入（1.13 版本达到 GA 状态）的扩展机制，如同之前介绍过的 CRI 和 CNI 那样，CSI 是公开的技术规范，任何容器运行时、容器编排引擎只要愿意支持，都可以使用 CSI 规范去扩展自己的存储能力，这是目前 Kubernetes 重点发展的扩展机制。

由于是专门为 Kubernetes 量身订造的，所以 FlexVolume 的实现逻辑与上一节介绍的 Kubernetes 存储架构高度一致。FlexVolume 驱动其实就是一个实现了 Attach、Detach、Mount、Unmount 操作的可执行文件（甚至可以仅仅是个 Shell 脚本）而已，该可执行文件应该存放在集群每个节点的`/usr/libexec/kubernetes/kubelet-plugins/volume/exec`目录里，其工作过程也就是当 AD 控制器和 Volume 管理器需要进行 Attach、Detach、Mount、Unmount 操作时自动调用它的对应方法接口，如图 13-7 所示。

:::center
![](./images/flexvolume.png)
图 13-7 FlexVolume Driver 工作过程（[图片来源](https://laptrinhx.com/kubernetes-volume-plugins-evolution-from-flexvolume-to-csi-2724482856/)）
:::

如果仅仅考虑支持最基本的 Static Provisioning，那实现一个 FlexVolume Driver 确实是非常简单的。然而也是由于 FlexVolume 过于简单了，导致它应用起来会有诸多不便之处，譬如：

- FlexVolume 并不是全功能的驱动：FlexVolume 不包含 Provision 和 Delete 操作，也就无法直接用于 Dynamic Provisioning，除非你愿意再单独编写一个 External Provisioner。
- FlexVolume 部署维护都相对繁琐：FlexVolume 是独立于 Kubernetes 的可执行文件，当集群节点增加时，需要由管理员在新节点上部署 FlexVolume Driver，有经验的系统管理员通常会专门编写一个 DaemonSet 来代替人工来完成这项任务。
- FlexVolume 实现复杂交互也相对繁琐：FlexVolume 的每一次操作，都是对插件可执行文件的一次独立调用，这种插件实现方式在各种操作需要相互通讯时很会别扭。譬如你希望在执行 Mount 操作的时候，生成一些额外的状态信息，这些信息在后面执行 Unmount 操作时去使用，那就只能把信息记录在某个约定好的临时文件中，对于一个面向生产的容器编排系统，这样的做法实在是过于简陋了。

相比起 FlexVolume 的种种不足，CSI 可算是一个十分完善的存储扩展规范，这里“十分完善”可不是客套话，根据 GitHub 的自动代码行统计，FlexVolume 的规范文档仅有 155 行，而 CSI 则长达 2704 行。总体上看，CSI 规范可以分为需要容器系统去实现的组件，以及需要存储提供商去实现的组件两大部分。前者包括了存储整体架构、Volume 的生命周期模型、驱动注册、Volume 创建、挂载、扩容、快照、度量等内容，这些 Kubernetes 都已经完整地实现了，大体上包括以下几个组件：

- [Driver Register](https://github.com/kubernetes-csi/driver-registrar)：负责注册第三方插件，CSI 0.3 版本之后已经处于 Deprecated 状态，将会被[Node Driver Register](https://kubernetes-csi.github.io/docs/node-driver-registrar.html)所取代。
- [External Provisioner](https://github.com/kubernetes-csi/external-provisioner)：调用第三方插件的接口来完成数据卷的创建与删除功能。
- [External Attacher](https://github.com/kubernetes-csi/external-attacher)：调用第三方插件的接口来完成数据卷的挂载和操作。
- [External Resizer](https://github.com/kubernetes-csi/external-resizer)：调用第三方插件的接口来完成数据卷的扩容操作。
- [External Snapshotter](https://github.com/kubernetes-csi/external-snapshotter)：调用第三方插件的接口来完成快照的创建和删除。
- [External Health Monitor](https://github.com/kubernetes-csi/external-health-monitor)：调用第三方插件的接口来提供度量监控数据。

需要存储提供商去实现的组件才是 CSI 的主体部分，即前文中多次提到的“第三方插件”。这部分着重定义了外部存储挂载到容器过程中所涉及操作的抽象接口和具体的通讯方式，主要包括以下三个 gRPC 接口：

- **CSI Identity 接口**：用于描述插件的基本信息，譬如插件版本号、插件所支持的 CSI 规范版本、插件是否支持存储卷创建、删除功能、是否支持存储卷挂载功能，等等。此外 Identity 接口还用于检查插件的健康状态，开发者可以通过实现 Probe 接口对外提供存储的健康度量信息。
- **CSI Controller 接口**：用于从存储系统的角度对存储资源进行管理，譬如准备和移除存储（Provision、Delete 操作）、附加与分离存储（Attach、Detach 操作）、对存储进行快照，等等。存储插件并不一定要实现这个接口的所有方法，对于存储本身就不支持的功能，可以在 CSI Identity 接口中声明为不提供。
- **CSI Node 接口**：用于从集群节点的角度对存储资源进行操作，譬如存储卷的分区和格式化、将存储卷挂载到指定目录上、或者将存储卷从指定目录上卸载，等等。

:::center
![](./images/csi-arch.png)
图 13-8 CSI 组件架构（[图片来源](https://medium.com/google-cloud/understanding-the-container-storage-interface-csi-ddbeb966a3b)）
:::

与 FlexVolume 以单独的可执行程序的存在形式不同，CSI 插件本身便是由一组标准的 Kubernetes 资源所构成，CSI Controller 接口是一个以 StatefulSet 方式部署的 gRPC 服务，CSI Node 接口则是基于 DaemonSet 方式部署的 gRPC 服务。这意味着虽然 CSI 实现起来要比 FlexVolume 复杂得多，但是却很容易安装——如同安装 CNI 插件及其它应用那样，直接载入 Manifest 文件即可，也不会遇到 FlexVolume 那样需要人工运维，或者自己编写 DaemonSet 来维护集群节点变更的问题。此外，通过 gRPC 协议传递参数比通过命令行参数传递参数更加严谨，灵活和可靠，最起码不会出现多个接口之间协作只能写临时文件这样的尴尬状况。

## 从 In-Tree 到 Out-of-Tree

Kubernetes 原本曾内置了相当多的 In-Tree 的存储驱动，时间上甚至还早于 Docker 宣布支持卷驱动功能，这种策略使得 Kubernetes 能够在云存储提供商发布官方驱动之前就将其纳入到支持范围中，同时减轻了管理员维护的工作量，为它在诞生初期快速占领市场做出了一定的贡献。但是，这种策略也让 Kubernetes 丧失了随时添加或修改存储驱动的灵活性，只能在更新大版本时才能加入或者修改驱动，导致云存储提供商被迫要与 Kubernetes 的发版节奏保持一致。此外，还涉及到第三方存储代码混杂在 Kubernetes 二进制文件中可能引起的可靠性及安全性问题。因此，当 Kubernetes 成为市场主流以后——准确的时间点是从 1.14 版本开始，Kubernetes 启动了 In-Tree 存储驱动的 CSI 外置迁移工作，按照计划，在 1.21 到 1.22 版本（大约在 2021 年中期）时，Kubernetes 中主要的存储驱动，如 AWS EBS、GCE PD、vSphere 等都会迁移至符合 CSI 规范的 Out-of-Tree 实现，不再提供 In-Tree 的支持。这种做法在设计上无疑是正确的，然而，这又面临了此前提过的该如何兼容旧功能的策略问题，譬如下面 YAML 定义了一个 Pod：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-pod-example
spec:
  containers:
  - name: nginx
    image: nginx:latest
    volumeMounts:
    - name: html-pages-volume
      mountPath: /usr/share/nginx/html
    - name: config-volume
      mountPath: /etc/nginx
    volumes:
    - name: html-pages-volume
      hostPath:                 # 来自本地的存储
        path: /srv/nginx/html
        type: Directory
    - name: config-volume
      awsElasticBlockStore:     # 来自AWS ESB的存储
        volumeID: vol-0b39e0b08745caef4
        fsType: ext4
```

其中用到了类型为 hostPath 的 Volume，这相当于 Docker 中驱动类型为 local 的 Volume，不需要专门的驱动；而类型为 awsElasticBlockStore 的 Volume，从名字上就能看出是指存储驱动为 AWS EBS 的 Volume，当 CSI 迁移完成，awsElasticBlockStore 从 In-Tree 卷驱动中移除掉之后，它就应该按照 CSI 的写法改写成如下形式：

```yaml
    - name: config-volume
      csi:
        driver: ebs.csi.aws.com
        volumeAttributes:
          - volumeID: vol-0b39e0b08745caef4
          - fsType: ext4
```

这样的要求有悖于升级版本不应影响还在大范围使用的已有功能这条原则，所以 Kubernetes 1.17 中又提出了称为[CSIMigration](https://kubernetes.io/blog/2019/12/09/kubernetes-1-17-feature-csi-migration-beta/)的解决方案，让 Out-of-Tree 的驱动能够自动伪装成 In-Tree 的接口来提供服务。
笔者专门花这两段来介绍 Volume 的 CSI 迁移，倒不是由于它算是多么重要的特性，而是这种兼容性设计本身就是 Kubernetes 设计理念的一个缩影，在 Kubernetes 的代码与功能中随处可见。好的设计需要权衡多个方面的利益，很多时候都得顾及现实的影响，要求设计向现实妥协，而不能仅仅考虑理论最优的方案。

## 容器插件生态

现在几乎所有云计算厂商都支持自家的容器通过 CSI 规范去接入外部存储，能够应用于 CSI 与 FlexVolume 的存储插件更是多达数十上百款，其中部分如下图所示，已经算是形成了初步的生态环境。限于篇幅，笔者不打算去谈论各种 CSI 存储插件的细节，这节会采取与 CNI 网络插件类似的讲述方式，以不同的存储类型为线索，介绍其中有代表性的实现。

:::center
![](./images/csi-protects.png)
图 13-9 部分容器存储提供商（[图片来源](https://blog.dellemc.com/en-us/kubernetes-data-protection-hits-mainstream-with-container-storage-interface-csi-117/)）
:::

目前出现过的存储系统和设备均可以划分到块存储、文件存储和对象存储这三种存储类型之中，划分的根本依据其实并非各种存储是如何储存数据的——那完全是存储系统私有的事情，更合理的划分依据是各种存储提供何种形式的接口供外部访问数据，不同的外部访问接口将反过来影响到存储的内部结构、性能与功能表现。虽然块存储、文件存储和对象存储可以彼此协同工作，但它们各自都有自己明确的擅长领域与优缺点，理解它们的工作原理，因地制宜地选择最适合的存储才能让系统达到最佳的工作状态。笔者按照它们出现的时间顺序分别介绍如下：

- **块存储**：块存储是数据存储的最古老形式，数据都储存在固定长度的一个或多个[块](<https://en.wikipedia.org/wiki/Block_(data_storage)>)（Block）中，想要读写访问数据，就必须使用与存储相匹配的协议（SCSI、SATA、SAS、FCP、FCoE、iSCSI……）来进行的。如果你是按顺序阅读本书内容的话，那笔者建议你类比上一章网络通讯中[网络栈](/immutable-infrastructure/network/linux-vnet.html#网络通讯模型)的数据流动过程，把存储设备中由块构成的信息流与网络设备中由数据包构成的信息流进行对比，事实上，像 iSCSI 这种协议真的就是建设在 TCP/IP 网络之上，上层以 SCSI 作为应用层协议对外提供服务的。

  我们熟悉的硬盘就是最经典的块存储设备，以机械硬盘为例，一个块就是一个扇区，大小通常在 512 Bytes 至 4096 Bytes 之间。老式机械硬盘用[柱面-磁头-扇区号](https://en.wikipedia.org/wiki/Cylinder-head-sector)（Cylinder-Head-Sector，CHS）组成的编号进行寻址，现代机械硬盘只用一个[逻辑块编号](https://en.wikipedia.org/wiki/Logical_block_addressing)（Logical Block Addressing，LBA）进行寻址。为了便于管理，硬盘通常会以多个块（这些块甚至可以来自不同的物理设备，譬如磁盘阵列的情况）来组成一个逻辑分区（Partition），将分区进行[高级格式化](https://en.wikipedia.org/wiki/Disk_formatting#High-level_formatting)之后就形成了卷（Volume），这便与上节“[Kubernetes 存储设计](/immutable-infrastructure/storage/storage-evolution.html)”中提到“Volume 是源于操作系统的概念”衔接了起来。

  块存储由于贴近底层硬件，没有文件、目录、访问权限等的牵绊，所以性能通常都是最优秀的，吞吐量高，延迟低。尽管人类作为信息系统的最终用户，并不会直接面对块来操作数据，多数应用程序也是基于文件而不是块来读写数据的，但是操作系统内核中许多地方就直接通过[块设备](https://en.wikipedia.org/wiki/Device_file#BLOCKDEV)（Block Device）接口来访问硬盘，一些追求 I/O 性能的软件，譬如高性能的数据库也会支持直接读写块设备以提升磁盘 I/O。块存储的特点是具有排它性，一旦块设备被某个客户端挂载后，其它客户端就无法再访问上面的数据了，因此，Kubernetes 中挂载的块存储大多访问模式都要求必须是 RWO（ReadWriteOnce）的。

- **文件存储**：文件存储是最贴近人类用户的数据存储形式，数据存储在长度不固定的文件之中，用户可以针对文件进行新增、写入、追加、移动、复制、删除、重命名等各种操作，通常文件存储还会提供有文件查找、目录管理、权限控制等额外的高级功能。文件存储的访问不像块存储那样有五花八门的协议，[POSIX](https://en.wikipedia.org/wiki/POSIX)接口（Portable Operating System Interface，POSIX）已经成为了事实标准，被各种商用的存储系统和操作系统共同支持。具体 POSIX 的文件操作接口笔者就不去举例罗列了，你不妨类比 Linux 下的各种文件管理命令来自行想象一下。

  绝大多数传统的文件存储都是基于块存储之上去实现的，“文件”这个概念的出现是因为“块”对人类用户来说实在是过于难以使用、难以管理了。可以近似地认为文件是由块所组成的更高级存储单位。对于固定不会发生变动的文件，直接让每个文件连续占用若干个块，在文件头尾加入标志区分即可，磁带、CD-ROM、DVD-ROM 就采用了由连续块来构成文件的存储方案；但对于可能发生变动的场景，就必须考虑如何跨多个不连续的块来构成为文件。这种需求在数据结构角度看只需在每个块中记录好下一个块的地址，形成链表结构即可满足。但是链表的缺点是只能依次顺序访问，这样访问文件中任何内容都要从头读取多个块，显然过于低效了。真正被广泛运用的解决方案是把形成链表的指针整合起来统一存放，这便形成了[文件分配表](https://en.wikipedia.org/wiki/File_Allocation_Table)（File Allocation Table，FAT）的概念。既然已经有了专门组织块结构来构成文件的分配表，那在表中再加入其他控制信息，就能很方便地扩展出更多的高级功能，譬如除了文件占用的块地址信息外，加上文件的逻辑位置就形成了目录，加上文件的访问标志就形成了权限，还可以再加上文件的名称、创建时间、所有者、修改者等一系列的元数据信息来构成其他应用形式。人们把定义文件分配表应该如何实现、储存哪些信息、提供什么功能的标准称为[文件系统](https://en.wikipedia.org/wiki/File_system)（File System），FAT32、NTFS、exFAT、ext2/3/4、XFS、BTRFS 等都是很常用的文件系统。而前面介绍存储插件接口时提到的对分区进行高级格式化操作，实际上就是在初始化一套空白的文件系统，供后续用户与应用程序访问。

  文件存储相对于块存储来说是更高层次的存储类型，加入目录、权限等元素后形成的树状结构以及路径访问方式方便了人类理解、记忆和访问；文件系统能够提供哪个进程打开或正在读写某个文件的信息，这也有利于文件的共享处理。但在另一方面，计算机需要把路径进行分解，然后逐级向下查找，最后才能查找到需要的文件，要从文件分配表中确定具体数据存储的位置，要判断文件的访问权限，要记录每次修改文件的用户与时间，这些额外操作对于性能产生负面影响也是无可避免的，因此，如果一个系统选择不采用文件存储的话，那磁盘 I/O 性能一般就是最主要的决定因素。

- **对象储存**：[对象存储](https://en.wikipedia.org/wiki/Object_storage)是相对较新的数据存储形式，是一种随着云数据中心的兴起而发展起来的存储，是以非结构化数据为目标的存储方案。这里的“对象”可以理解为一个元数据及与其配对的一个逻辑数据块的组合，元数据提供了对象所包含的上下文信息，譬如数据的类型、大小、权限、创建人、创建时间，等等，数据块则存储了对象的具体内容。你也可以简单地理解为数据和元数据这两样东西共同构成了一个对象。每个对象都有属于自己的全局唯一标识，这个标识会直接开放给最终用户使用，作为访问该对象的主要凭据，通常会是 UUID 的形式。对象存储的访问接口就是根据该唯一标识，对逻辑数据块进行的读写删除操作，通常接口都会十分简单，甚至连修改操作都不会提供。

  对象存储基本上只会在分布式存储系统之上去实现，由于对象存储天生就有明确的“元数据”概念，不必依靠文件系统来提供数据的描述信息，因此，完全可以将一大批对象的元数据集中存放在某一台（组）服务器上，再辅以多台 OSD（Object Storage Device）服务器来存储对象的数据块部分。当外部要访问对象时，多台 OSD 能够同时对外发送数据，因此对象存储不仅易于共享、容量庞大，还能提供非常高的吞吐量。不过，由于需要先经过元数据查询确定 OSD 存放对象的确切位置，该过程可能涉及多次网络传输，延迟方面就会表现得相对较差。

  由于对象的元数据仅描述对象本身的信息，与其他对象都没有关联，换而言之每个对象都是相互独立的，自然也就不存在目录的概念，可见对象存储天然就是扁平化的，与软件系统中很常见的 K/V 访问相类似，不过许多对象存储会提供 Bucket 的概念，用户可以在逻辑上把它看作是“单层的目录”来使用。由于对象存储天生的分布式特性，以及极其低廉的扩展成本，使它很适合于[CDN](/architect-perspective/general-architecture/diversion-system/cdn.html)一类的应用，拿来存放图片、音视频等媒体内容，以及网页、脚本等静态资源。

理解了三种存储类型的基本原理后，接下来又到了治疗选择困难症的环节。主流的云计算厂商，譬如国内的阿里云、腾讯云、华为云都有自己专门的块存储、文件存储和对象存储服务，关于选择服务提供商的问题，笔者不作建议，你根据价格、合作关系、技术和品牌知名度等因素自行去处理。关于应该选择三种存储类型中哪一种的问题，笔者这里以世界云计算市场占有率第一的亚马逊为例，简要对比介绍它不同存储类型产品的差异：

- 亚马逊的块存储服务是[Amazon Elastic Block Store](https://amazonaws-china.com/cn/ebs)（AWS EBS），你购买 EBS 之后，在 EC2（亚马逊的云计算主机）里看见的是一块原始的、未格式化的块设备。这点就决定了 EBS 并不能做为一个独立存储而存在，它总是和 EC2 同时被创建的，EC2 的操作系统也只能安装在 EBS 之上。EBS 的大小理论上取决于建立的分区方案，即块大小乘以块数量。MBR 分区的块数量是 2^32^，块大小通常是 512 Bytes，总容量为 2 TB；GPT 分区的块数量是 2^64^，块大小通常是 4096 Bytes，总容量 64 ZB。当然这是理论值，64 ZB 已经超过了世界上所有信息的总和，不会有操作系统支持这种离谱的容量，AWS 也设置了上限是 16 TB，在此范围内的实际值就只取决于你的预算额度；EBS 的性能取决于你选择的存储介质类型（SSD、HDD）还有优化类型（通用性、预置型、吞吐量优化、冷存储优化等），这也将直接影响存储的费用成本。

  EBS 适合作为系统引导卷，适合追求磁盘 I/O 的大型工作负载以及追求低时延的应用，譬如 Oracle 等可以直接访问块设备的大型数据库更是尤其合适。但 EBS 只允许被单个节点挂载，难以共享，这点在单机时代是天经地义的，但在云计算和分布式时代就成为了很要命的缺陷。除了少数特殊的工作负载外（如前面说的 Oracle 数据库），笔者并不建议将它作为容器编排系统的主要外置存储来使用。

- 亚马逊的文件存储服务是[Amazon Elastic File System](https://amazonaws-china.com/cn/efs/)（AWS EFS），你购买 EFS 之后，只要在 EFS 控制台上创建好文件系统，并且管理好网络信息（如 IP 地址、子网）就可以直接使用，无需依附于任何 EC2 云主机。EFS 本质是完全托管在云端的[网络文件系统](https://en.wikipedia.org/wiki/Network_File_System)（Network File System，NFS），可以在任何兼容 POSIX 的操作系统中直接挂载它，而不会在`/dev`中看到新设备存在。按照本节开头 Kubernetes 存储架构中的操作来说就是你只需要考虑 Mount，无需考虑 Attach 了。

  得益于 NFS 的天然特性，EFS 的扩缩可以是完全自动、实时的，创建新文件时无需预置存储，删除已有文件时也不必手动缩容以节省费用。在高性能网络的支持下，EFS 的性能已经能够达到相当高的水平，尽管由于网络访问的限制，性能最高的 EFS 依然比不过最高水平的 EBS，但仍然能充分满足绝大多数应用运行的需要。还有最重要的一点优势是由于脱离了块设备的束缚，EFS 能够轻易地被成百上千个 EC2 实例共享，考虑到 EFS 的性能、动态弹性、可共享这些因素，笔者给出的明确建议是它可以作为大部分容器工作负载的首选存储。

- 亚马逊的对象存储服务是[Amazon Simple Storage Service](https://amazonaws-china.com/cn/s3/)（AWS S3），S3 通常是以 REST Endpoint 的形式对外部提供文件访问服务的，这种方式下你应该直接使用程序代码来访问 S3，而不是靠操作系统或者容器编排系统去挂载它。如果你真的希望这样做，也可以通过存储网关（如[AWS Storage Gateway](https://amazonaws-china.com/cn/storagegateway)）将 S3 的存储能力转换为 NFS、SMB、iSCSI 等访问协议，经过转换后，操作系统或者容器就能够将其作为 Volume 来挂载了。

  S3 也许是 AWS 最出名、使用面最广的存储服务，这个结果不是由于它的性能优异，事实上 S3 的性能比起 EBS 和 EFS 来说是相对最差的，但它的优势在于它名字中“Simple”所标榜的简单，我们挂载外部存储的目的十有八九就是为了给程序提供存储服务，使用 S3 不必用写一行代码就能够直接通过 HTTP Endpoint 进行读写访问，且完全不需要考虑容量、维护和数据丢失的风险，这就是简单的价值。S3 的另一大优势就是它的价格相对于 EBS 和 EFS 来说往往要低一至两个数量级，因此程序的备份还原、数据归档、灾难恢复、静态页面的托管、多媒体分发等功能就非常适合使用 S3 来完成。

:::center
![](./images/aws.png)
图 13-10 AWS 的 S3、EFS、EBS 对比（图片来自 AWS 的[销售材料](https://blog.dellemc.com/en-us/kubernetes-data-protection-hits-mainstream-with-container-storage-interface-csi-117/)）
:::

图 13-10 是截取自亚马逊销售材料中三种存储的对比，从目前的存储技术发展来看，不会有哪一种存储方案能够包打天下。不同业务系统的场景需求不同，对存储的诉求会不同，选择自然会不同。
