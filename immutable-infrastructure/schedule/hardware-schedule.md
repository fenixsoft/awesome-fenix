# 资源与调度

容器编排系统要解决的最核心问题（之一）就是调度，“编排”一词本身便包含有“调度”的含义。调度具体是指为新创建出来的Pod寻找到一个最恰当的节点去运行它，这个过程成功与否、结果恰当与否，关键取决于Kubernetes是如何管理分配集群节点的资源的。可以说调度是必须以容器编排系统的资源管控为前提，那我们就首先从Kubernetes的资源模型谈起。

## 资源模型

开篇先来理清一个概念：资源是什么。资源在Kubernetes中是极为常见的术语，广义上讲，Kubernetes中所有你能够接触的内容都被抽象成了资源，譬如表示工作负荷的资源（Pod、ReplicaSet、Service、……），表示存储的资源（Volume、PersistentVolume、Secret、……），表示策略的资源（SecurityContext、ResourceQuota、LimitRange、……），表示身份的资源（ServiceAccount、Role、ClusterRole、……），等等。“一切皆为资源”的设计是Kubernetes能够顺利施行声明式API的必要前提，Kubernetes以此为资源为载体，建立了一套同时囊括了抽象元素（如策略、依赖、权限）和具象元素（如软件、硬件、网络）的[领域特定语言](https://en.wikipedia.org/wiki/Domain-specific_language)。通过不同层级资源间的使用关系来描述大到整个集群甚至是集群联邦，小到某一块内存区域或者一小部分的处理器核心的状态，这些对资源状态的描述便共同构成了一幅信息系统工作运行的全景图。

在“[以容器构建系统](/immutable-infrastructure/container/container-build-system.html)”一节里，笔者首次提到Kubernetes的层级资源模型，将它与控制器模式一并列为Kubernetes中最重要的两个设计思想。在本节里，笔者再次提到了资源模型，但这里所指的是狭义上的资源模型，意思是排除了广义上那些抽象的、逻辑的资源，只包括能够与真实的、物理底层硬件对应起来的资源，譬如处理器资源、内存资源、磁盘存储资源等等，因为我们讨论的话题是调度，Pod是调度的最基本单位，只有这些底层的资源才是会被Pod直接消耗使用。所以后文中提到资源，如无特别说明的话，均是特指狭义上的资源。

从编排系统的角度来看，Node是资源的提供者，Pod是资源的使用者，调度是将两者进行恰当的撮合。Node通常能够提供的三方面的资源：计算资源（CPU、GPU、内存）、存储资源（磁盘容量、不同类型的介质）和网络资源（带宽、IP地址），其中与调度关系最密切的是CPU和内存，虽然它们同属于计算资源，但两者在调度时又有一些关键的差别：CPU这样的资源被称作可压缩资源（Compressible Resources），特点是当可压缩资源不足时，Pod只会处于“饥饿状态”，但不会被杀死（容器被直接杀死，或要求限时退出）。而像内存这样的资源，则被称作不可压缩资源（Incompressible Resources），特点是当不可压缩资源不足，或者超过了容器自己声明的最大限度时，Pod就会因为内存溢出（Out-Of-Memory，OOM）而被系统直接杀掉。

Kubernetes给CPU资源设定的默认计量单位是“逻辑CPU的个数”。不过，具体“一个逻辑CPU”应该如何理解，取决于节点的宿主机是如何解释的，通常就是`/proc/cpuinfo`中看到的CPU数量。它有可能会是多路处理器系统上的一个CPU、多核处理器中的一个CPU核心、云计算主机上的一个[虚拟化CPU](https://en.wikipedia.org/wiki/Central_processing_unit#Virtual_CPUs)（Virtual CPU，vCPU），或者CPU里的一条[超线程](https://en.wikipedia.org/wiki/Hyper-threading)（Hyper-Threading）。Kubernetes只负责保证Pod能够使用到“一个CPU”的计算能力，然而对不同硬件环境构成的Kubernetes集群，乃至同一个集群中不同硬件的Node节点来说，”一个CPU“的算力完全有可能是完全不一样的。

在具体设置方面，Kubernetes沿用了云计算中CPU限额设置的一贯做法。如果不明确标注单位，譬如直接写0.5，默认单位就是`Core`，即0.5个CPU；也可以明确使用`Millcores`为单位，譬如写成500m同样代表0.5个CPU，因为Kubernetes规定了`1 Core = 1000 Millcores`。而对于内存来说，它早已经有了广泛使用的计量单位，即Bytes，如果设置中不明确标注单位就会默认以Bytes计数。为了实际设置的方便，Kubernetes还支持Ei、Pi、Ti、Gi、Mi、Ki，以及E、P、T、G、M、K为单位，这两者略微有一点点区别，以Mi和M为例，它们分别是`Mebibytes`与`Megabytes`的缩写，前者表示1024×1024 Bytes，后者表示1000×1000 Bytes。

## 限制资源

设定资源计量单位的其中一个目的是为了管理员能够限制某个Pod对资源的过度占用，避免影响到其他Pod的正常运行。Pod是由多个容器所组成，资源最终是交由各个容器去使用，所以对资源的约束值是设定在容器上的，具体的配置是Pod的`spec.containers[].resource.limits/requests.cpu/memory`字段。但是对资源约束值的应用操作则是针对Pod整体的，Pod的资源配额需求应该是它包含的每个容器需求的累加值。

为容器设定最大的资源配额的做法从cgroups诞生起就已经屡见不鲜了，但你是否注意到Kubernetes给出的配置中有`limits`和`requests`两个设置项？这两者的区别其实很简单：`request`是给调度用的，Kubernetes选择哪个节点运行Pod，只会根据`requests`的值来进行决策；`limits`才是给cgroups用的，Kubernetes在向cgroups的传递资源配额时，会按照`limits`的值来进行设置。

之所以Kubernetes采用这样的设计，是因为Google根据Borg和Omega系统长期运行的实践经验，总结出了一条经验法则：用户提交工作负载时设置的资源配额，并不一定是容器调度必须严格遵守的值，因为根据实际经验，大多数的工作负载运行过程中使用到的资源，其实都远小于它所请求的资源配额。

:::quote Purchase Quota 

Even though we encourage users to purchase no more quota than they need, many users overbuy because it insulates them against future shortages when their application’s user base grows.

即使我们已经努力建议用户不要过度申请资源配额，但仍难免有大量用户过度消费，他们总希望避免因用户增长而产生资源不足的现象。

:::right

—— [Large-Scale Cluster Management at Google with Borg](https://pdos.csail.mit.edu/6.824/papers/borg.pdf)，Google

:::

这种“多多益善”的想法符合普通人的心理，大家提交的资源需求普遍都是按照可能面临的最大压力去估计的，甚至考虑到了未来用户增长所导致的新需求。为了避免服务因资源不足而中断，通常都会往大了去申请，这可以理解，但如果直接按照申请的资源去分配限额，所导致的结果是服务器一方面在大多数时间里都会有大量硬件资源闲置，另一方面这些闲置资源又已经分配出去，有了明确的所有者，不能再被其他人使用。

Kubernetes并不是仅仅将一个资源配额的设置拆分成`limits`和`requests`两个设置项就能解决这个矛盾的，因为一旦选择不按照最保守、最安全的方式去分配资源，就意味着你必须为极端情况的出现而买单。如果允许节点分配资源需求总和已超过自己最大可提供资源的多个Pod，一旦某个时刻这些Pod的总消耗超过了节点硬件资源的总和，势必会导致节点硬件资源无法满足对Pod的资源承诺，此时，只能不得已要杀掉一部分Pod来保证其余Pod能正常运行，这个操作就是稍后要介绍的驱逐机制（Eviction）。同时，也要有明确资源不足时该先牺牲哪些Pod、后牺牲哪些Pod的准则，这就形成了Kubernetes的服务质量模型（Quality of Service，QoS）和优先级（Priority）的概念。如果Kubernetes不是为了理性对抗人类“多多益善”的心理，尽可能提高硬件利用效率，而是直接按申请的最大资源去安排调度，那就根本无需处理这些麻烦事。

在Pod层面上限制资源是仅针对单个Pod的低层次约束，现实中还常会遇到面向更高层次去控制资源的需求，譬如想限制由多个Pod构成的微服务系统耗用的总资源，或者是由多名成员组成的团队耗用的总资源。举个具体例子，想要在拥有32 GiB内存和16个CPU的集群里，允许A团队使用20 GiB内存和10个CPU的资源，再允许B 团队使用10 GiB内存和4个CPU的资源，再预留2 GiB内存和2个CPU供将来分配。要满足这种资源限制的需求，Kubernetes的解决方案是应该先为它门建立一个专用的名称空间，然后再在名称空间里建立ResourceQuota对象来描述如何进行整体的资源约束。

ResourceQuota与调度就没有关系，针对的对象也不是Pod，所以它所说的资源是广义上的资源，不仅可以设置CPU、内存等的限额，还可以设置诸如Pod最大数量、ReplicaSet最大数量、Service最大数量、全部PersistentVolumeClaim的总存储容量等各种资源限额。甚至当Kubernetes预置的资源模型不能满足约束需要时，还能够根据实际情况去拓展，譬如要控制GPU的使用数量，完全可以通过Kubernetes的设备插件（Device Plugin）机制拓展出诸如`nvidia.com/gpu: 4`这样的配置来。


## 服务质量与优先级

`limits`和`requests`除了满足调度资源和限制资源的需要外，还有一个额外的隐藏作用：它们共同决定了工作负载的服务质量等级（QoS Level）。一旦节点的资源已经不足以满足全部Pod正常运行所需时，显然应该优先保证那些比较重要的服务，放弃没那么重要的服务，服务质量等级就是衡量Pod重要性的准绳。

不知道你阅读上节“资源限制”时是否注意到了一个细节：如果不去设置`limits`和`requests`会怎样？答案是不设置CPU和内存的资源，就意味着没有上限，该Pod可以使用节点上所有可用的计算资源。但你先别高兴得太早，这类 Pod能以最灵活的方式去使用资源，但也正是这类Pod扮演着最不稳定的风险来源的角色。在论文《[Large-Scale Cluster Management at Google with Borg](https://pdos.csail.mit.edu/6.824/papers/borg.pdf)》中，Google明确地提出了针对这类Pod的一种近乎带惩罚性质的处理建议：当节点硬件资源不足时，优先杀掉这类Pod，说得文雅一点的话，就是给予这类Pod最低的服务质量等级。

Kubernetes目前提供的服务质量等级一共分为三级，由高到低分别为Guaranteed、Burstable和BestEffort。如果Pod中所有的容器都设置了`limits`和`requests`，且两者的值相等，那此Pod的服务质量等级便为Guaranteed；如果Pod中有部分容器的`requests`值小于`limits`值，或者只设置了`requests`而未设置`limits`，那此Pod的服务质量等级为Burstable，两个都没设置就是BestEffort了。

笔者通常建议将数据库应用或者一些重要的业务应用服务质量等级定为Guaranteed，这样除非Pod使用超过了它们的`limits`所描述的资源，或者节点的内存压力很大而且没有等级更低Pod存在了，否则它们都不会被系统自动杀死。将一些临时的、不重要的任务设置为BestEffort，这样有利于它们更容易调度到更大的节点范围中，寻找到资源更丰富的节点，快速完成任务，缩短影响；当系统资源紧张时也更容易被杀掉。

:::quote 小说《动物庄园》：

All animals are equal, but some animals are more equal than others.

所有动物生来平等，但有些动物比其他动物更加平等。

:::right

—— [Animal Farm: A Fairy Story](https://en.wikipedia.org/wiki/Animal_Farm)，[George Orwell](https://en.wikipedia.org/wiki/George_Orwell), 1945

:::

除了服务质量等级以外，Kubernetes还允许系统管理员自行决定Pod的优先级，这是通过类型为PriorityClass的资源来实现的。优先级决定了Pod之间并不是平等的关系，而且这种不平等还不是谁会占用更多一点的资源的问题，是会直接影响调度与Pod生存的问题。

优先级影响调度这很容易理解，是指当多个Pod同时被调度的话，高优先级的Pod会优先调度。Pod越晚被调度，就越大概率因节点资源被占用而不能成功。优先级影响更大的另一方面是指Kubernetes的抢占机制（Preemption），正常未设置优先级的情况下，如果Pod调度失败，就会暂时处于Pending状态被搁置起来，直到集群中有新节点加入或者旧Pod退出。但是，如果有一个被设置了优先级的Pod调度失败无法创建的话，Kubernetes就会在系统中寻找出一些牺牲者（Victims），将它们杀掉以让出资源。寻找的原则是根据在优先级低于待调度Pod的所有Pod里，按照优先级从低到高排序，从最低的杀起，直至腾出的资源足以满足待调度Pod的成功调度，或者已经找不到更低优先级的Pod为止。

## 驱逐机制

前面几节，笔者动不动就提要杀掉某个Pod，实在是有欠优雅，在Kubernetes中专业的称呼是“驱逐”（Eviction，即资源回收）。Pod的驱逐是通过kubelet来执行的，kubelet是部署在各个节点的管理代理，最容易感知到节点的资源实时耗用情况。kubelet一旦发现某种不可压缩资源将要耗尽，就会主动终止节点上较低服务质量等级的Pod，以保证其他更重要的Pod的生存。被驱逐的Pod中所有的容器都会被终止，其状态会被更改为Failed。

我们已经接触过内存这一种最重要的不可压缩资源，默认配置下，前面所说的“资源即将耗尽”的“即将”，具体阈值是可用内存小于100Mi。除了可用内存（`memory.available`）外，其他不可压缩资源还包括有：宿主机的可用磁盘空间（`nodefs.available`）、可用[inode](https://en.wikipedia.org/wiki/Inode)数量（`nodefs.inodesFree`），以及可用的容器运行时镜像存储空间（`imagefs.available`）。后面三个的阈值都是按照实际容量的百分比来计算的，具体默认值为：

```
memory.available < 100Mi
nodefs.available < 10%
nodefs.inodesFree < 5%
imagefs.available < 15%
```

你可以用kubelet的命令行参数来修改这一点，譬如可用内存只剩余100 Mi时才启动驱逐对于多数生产系统来说都太危险了，笔者建议通过以下命令调整为剩余10%后即开始驱逐：

```bash
$ kubelet --eviction-hard=memory.available<10%
```

如果你是Java语言的使用者，请注意Kubernetes的驱逐不能完全等同于Java虚拟机中的垃圾收集。垃圾收集是安全的，而驱逐Pod是一种毁坏性的行为，有可能会导致服务产生中断，必须更加谨慎。譬如，应该要同时兼顾到硬件资源可能只是短时间间歇性地超过了阈值的场景，以及资源正在被快速消耗，很快就会危及高服务质量的Pod甚至是整个节点稳定的场景。因此，驱逐机制中就有了软驱逐（Soft Eviction）、硬驱逐（Hard Eviction）以及优雅退出期（Grace Period）的概念：

- **软驱逐**：通常配置一个较低的警戒线（譬如可用内存仅剩20%），触及此线时，系统将进入一段观察期。如果只是暂时的资源抖动，在观察期内能够恢复到正常水平的话，那就不会真正启动驱逐操作。否则，资源持续超过警戒线一段时间，就会触发Pod的优雅退出（Grace Shutdown），系统会通知Pod进行必要的清理工作（譬如缓存落盘），然后自行结束。在优雅退出期结束后，系统会杀掉未曾自行了断的Pod。
- **硬驱逐**：通常配置一个较高的终止线（譬如可用内存仅剩10%），一旦触及此红线，立即强制杀掉Pod，不理会优雅退出。

软驱逐是为了减少资源抖动对服务的影响，硬驱逐是为了保障核心系统的稳定，它们并不矛盾，一般是同时使用，譬如以下例子所示：

```bash
$ kubelet --eviction-hard=memory.available<10% \
		  --eviction-soft=memory.available<20% \
		  --eviction-soft-grace-period=memory.available=1m30s \
		  --eviction-max-pod-grace-period=600
```

Kubernetes的驱逐与Java的垃圾收集另一个不同之处是垃圾收集可以“应收尽收”，而驱逐显然不行，不可能把整个节点中所有Pod都清空。但是，通常也不能只清理到刚刚低于警戒线就停止，必须考虑到驱逐之后的运行情况。譬如kubelet驱逐了若干个Pod，让资源使用率勉强低于阈值，那么很可能在极短的时间内，资源使用率又会因某个Pod稍微占用了少些资源而重新超过阈值，再产生新一次驱逐，如此往复。为此，Kubernetes提供了 `--eviction-minimum-reclaim`参数用于设置一旦驱逐发生之后，至少清理出来多少资源才会终止。然而问题并没有那么简单，Kubernetes中很少会单独创建Pod，通常都是由ReplicaSet、Deployment等更高层资源来管理的，这意味着当Pod被驱逐之后，它不会从此消失，Kubernetes将自动生成一个新的Pod来取代，并经过调度选择一个节点继续运行。如果没有额外的处理，那很大概率会被系统调度到当前这个节点上重新创建，因为上一次调度就选择了这个节点，而且这个节点刚刚驱逐完一批Pod得到了空闲资源。为了避免这类问题，Kubernetes又提供了另一个参数`--eviction-pressure-transition-period`来约束调度器，在驱逐发生之后多长时间内不往该节点调度Pod。

你应该意识到，既然这些措施既然被设计为以参数的形式开启，就说明了它们一定不是放之四海皆准的通用解法。譬如，假设当前Pod是由DaemonSet控制的，一旦该Pod被驱逐，你又强行不允许节点在一段时间内接受调度，那显然是有违DaemonSet的语义的。目前Kubernetes并没有办法区分Pod是由DaemonSet抑或是别的高层次资源创建的，因此这种假设情况确实有可能发生，比较合理的方案是让DaemonSet创建Guaranteed而不是BestEffort的Pod。总而言之，在Kubernetes还没有成熟到变为“傻瓜式”容器编排系统之前，因地制宜地合理配置和运维是都非常必要的。



## 默认调度器

本节的最后一部分，我们来探讨开篇提出的主旨问题：Kubernetes是如何撮合Pod与Node的，这其实也是最困难的一个问题。调度是为新创建出来的Pod寻找到一个最恰当的节点去运行它，这句话里就包含有“运行”和“恰当”两个调度中关键的步骤，它们具体是指：

1. **运行**：从集群所有节点中找出剩余资源可以满足该Pod运行的节点。为此，Kubernetes调度器设计了一组名为Predicate的筛选算法。
2. **恰当**：从符合运行要求的节点中找出最适合的节点完成调度。为此，Kubernetes调度器设计了一组名为Priority的评价算法。

这两个算法的具体内容稍后笔者会详细解释，这里要说明白一点：在几个、十几个节点的集群里进行调度，调度器怎么实现都不会太困难，但是对于数千个乃至更多节点的超大规模的集群，要实现高效的调度就绝不简单。请你想像一下，一个由数千节点组成的集群，每次Pod的创建都必须依据各节点的实时资源状态来确定目标节点，然而各节点的资源是无时无刻都在变动的，资源状况只有它本身才清楚，如果每次调度都要发生数千次的远程访问来获取这些信息，那压力与耗时都难压降下来。结果不仅会令调度器成为集群管理的性能瓶颈，还会出现因耗时过长，某些节点上资源状况已发生变化，调度器的资源信息过时而导致调度结果不准确的等问题。

:::quote Scheduler

Clusters and their workloads keep growing, and since the scheduler’s workload is roughly proportional to the cluster size, the scheduler is at risk of becoming a scalability bottleneck.

由于调度器的工作负载与集群规模大致成正比，随着集群和它们的工作负载不断增长，调度器很有可能会成为扩展性瓶颈所在。

:::right

—— [Omega: Flexible, Scalable Schedulers for Large Compute Clusters](https://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/41684.pdf)，Google

:::

针对以上问题，Google在论文《[Omega: Flexible, Scalable Schedulers for Large Compute Clusters](https://static.googleusercontent.com/media/research.google.com/zh-CN//pubs/archive/41684.pdf)》里总结了自身的经验，并参考了当时Mesos和Hadoop on Demand（HOD）的实现，提出了一种乐观并发（Optimistic Concurrency）的、共享状态（Shared State）的双循环调度机制。这种调度机制后来不仅应用在Google的Omega系统（Borg的下一代集群管理系统 ）中，也同样被Kubernetes继承了下来，它整体的工作流程图下图所示：

:::center
![context](./images/2loop.png)
状态共享的双循环
:::

“状态共享的双循环”中第一个控制循环可被称为“Informer Loop”，它是一系列[Informer](https://godoc.org/k8s.io/client-go/informers)的集合，这些Informer监视（Watch）Etcd中与调度相关的资源（主要是Pod、Node）的变化情况，一旦Pod、Node等资源出现变动，就会触发对应Informer的Handler。Informer Loop的职责是根据Etcd中的资源变化去更新调度队列（Priority Queue）和调度缓存（Scheduler Cache）中的信息，譬如当有新Pod生成，就将其入队（Enqueue）到调度队列中，如有必要，还会根据优先级触发前面提到过的插队和抢占操作。又譬如有新的节点加入集群，或者已有节点资源信息发生变动，Informer也会将这些信息更新同步到调度缓存之中。

另一个控制循环可被称为“Scheduler Loop”，它的核心逻辑是不停地将调度队列中的Pod出队（Pop），然后使用Predicate算法进行节点选择。Predicate本质上是一组节点过滤器（Filter），它根据预设的过滤策略来筛选节点，Kubernetes中默认有三种过滤策略，分别是：

- **通用过滤策略**：最基础的调度过滤策略，用来检查节点是否能满足Pod声明中需要的资源。譬如CPU、内存资源是否满足，主机端口与声明的NodePort是否存在冲突，Pod的选择器或者[nodeAffinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/#node-affinity)指定的节点是否与目标相匹配，等等。
- **卷过滤策略**：与存储相关的过滤策略，用来检查节点挂载的Volume是否存在冲突（譬如将一个块设备挂载到两个节点上），或者Volume的[可用区域](/distribution/connect/load-balancing.html#地域与区域)是否与目标节点冲突，等等。在“[Kubernetes存储设计](/immutable-infrastructure/storage/storage-evolution.html)”中提到的Local PersistentVolume的调度检查，便是在这里处理的。
- **节点过滤策略**：与宿主机相关的过滤策略，最典型的是Kubernetes的[污点与容忍度](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)（Taints and Tolerations）机制，譬如默认情况下Kubernetes会设置Master节点不允许被调度，这就是通过在Master中加污点来避免的。之前提到的控制节点处于驱逐状态，或者在驱逐后一段时间不允许调度，也是在这里实现的。

Predicate算法所使用的一切数据均来自于调度缓存，绝对不会去远程访问节点本身。Informer Loop与Etcd间的监视操作才会涉及到远程调用，Scheduler Loop中除了最后的异步绑定要发起一次远程的Etcd写入外，其余全部都是进程内访问，这一点是调度器执行效率的重要保证。

调度缓存是两个控制循环的共享状态（Shared State），这样的设计避免了每次调度时主动去轮询所有集群节点，保证了调度器的效率。但是并不能完全避免应节点信息同步不及时而导致调度过程中实际资源发生变化的情况，譬如节点的某个端口在获取调度信息后、发生实际调度前被意外占用了。为此，当调度结果出来以后，kubelet真正创建Pod以前，还必须执行一次Admit操作，在该节点上重新做一遍Predicate来进行二次确认。

经过Predicate算法筛选出来符合要求的节点集，会交给Priorities算法来打分（0-10分）排序，以便挑选出“最恰当”的一个。恰当是带有主观色彩的，Kubernetes也提供了不同的打分规则，譬如最常用的LeastRequestedPriority规则，它的计算公式是：

```
score = (cpu((capacity-sum(requested))×10/capacity) + memory((capacity-sum(requested))×10/capacity))/2
```

从公式上很容易看出这就是在选择CPU和内存空闲资源最多的节点，因为剩余越多，得分就越高。经常与它一起工作的是BalancedResourceAllocation规则，它的公式是：

```
score = 10 - variance(cpuFraction,memoryFraction,volumeFraction)×10
```

公式中三种Fraction的含义是Pod请求的资源除以节点上的可用资源，variance函数的作用是计算各种资源之间的差距，差距越大，函数值越大。由此可知BalancedResourceAllocation规则的意图是希望调度完成后，所有节点里各种资源分配均衡的，避免节点上出现诸如CPU被大量分配、而内存大量剩余的尴尬状况。Kubernetes内置的其他的评分规则还有ImageLocalityPriority、NodeAffinityPriority、TaintTolerationPriority等等，笔者就不再逐一解释了。

经过Predicate的筛选、Priorities的评分之后，调度器已经选出了调度的最终目标节点，最后一步是通知目标节点的kubelet可以去创建Pod了。调度器并不会直接与kubelet通讯来创建Pod，它只需要把待调度的Pod的nodeName字段更新为目标节点即可，kubelet本身会监视该值的变化。不过，从调度器在Etcd中更新nodeName，到kubelet从Etcd中检测到变化，再执行Admit操作二次确认调度可行性，最后到Pod开始实际创建，这个过程可能会持续一段不短的时间，如果一直等待调度最终完成，势必会显著影响调度器的效率。实际上Kubernetes调度器采用了乐观并发（Optimistic Concurrency）的策略，它会同步地更新调度缓存中Pod的nodeName字段，异步地更新Etcd中Pod的nodeName字段，这个操作被称为绑定（Bind）。如果最终调度成功了，那Etcd与调度缓存中的信息最终必定会保持一致，否则，如果调度失败了，那将由Informer来根据Pod的变动，重新同步回调度缓存中，以便促使另外一次调度的开始。

最后，请注意笔者在这一个部分的小标题用的是“**默认**调度器”，目的是强调以上行为仅是Kubernetes默认的行为。对调度过程的大部分行为，你都可以通过Scheduler Framework暴露的接口来进行扩展和自定义，如下图所示，绿色的部分就是Scheduler Framework暴露的扩展点。由于Scheduler Framework属于Kubernetes内部的扩展机制（通过Go语言的Plugin机制来实现的，需静态编译），通用性与本章提到的其他扩展机制（CRI、CNI、CSI那些）不能相提并论，所以笔者仅在这里简单地介绍，不多赘述了。

:::center
![context](./images/context.png)
Scheduler Framework的可扩展性（[图片来源](https://medium.com/dev-genius/kubernetes-scheduling-system-f8705e7ee226)）
:::