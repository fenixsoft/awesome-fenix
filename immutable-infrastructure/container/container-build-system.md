# 以容器构建系统

自从Docker提出“以封装应用为中心”的容器发展理念，成功取代了“以封装系统为中心”的LXC以后，一个容器封装一个单进程应用已经成为被广泛认可的最佳实践。然而单体时代过去之后，分布式系统里应用的概念已不再等同于进程，此时的应用需要多个进程共同协作，以集群的形式对外提供服务，以虚拟化方法实现这个目标的过程就被称为容器编排（Container Orchestration）。

容器之间顺畅地交互通讯是协作的核心需求，但容器协作并不仅仅是将容器以高速网络互相连接而已。如何调度容器，如何分配资源，如何扩缩规模，如何最大限度地接管系统中的非功能特性，让业务系统尽可能免受分布式复杂性的困扰都是容器编排框架必须考虑的问题，只有恰当解决了这一系列问题，云原生应用才有可能获得比比传统应用更高的生产力。

## 隔离与协作

笔者并不打算过多介绍Kubernetes具体有哪些功能，向你说明Kubernetes由Pod、Node、Deployment、ReplicaSet等各种类型的资源组成可用的服务、集群管理平面与节点之间如何工作、每种资源该如何配置使用等等并不是笔者的本意，如果你希望了解这方面信息，可以从Kubernetes官网的文档或任何一本以Kubernetes为主题的使用手册中得到。

笔者真正希望说清楚的问题是“为什么Kubernetes会设计成现在这个样子？”、“为什么以容器构建系统应该这样做？”，寻找这些问题的答案需从它们设计的实现意图出发，为此，笔者虚拟了一系列从简单到复杂的场景供你代入其中，理解并解决这些场景中的问题，并不要求你对Kubernetes已有多深入的了解，但要求你至少使用过Docker，熟悉它的核心功能与命令；此外还会涉及到一点儿Linux系统内核资源隔离的基础知识，别担心，只要你仔细读懂了上一节“[容器的崛起](/immutable-infrastructure/container/history.html)”，就已经足够用了。

现在开始试想一下，如果让你来设计一套容器编排系统，协调各种容器来共同来完成一项工作，会遇到什么问题？会如何着手解决？让我们从最简单的场景出发：

> **场景一**：假设你现在有两个应用，其中一个是Nginx，另一个是为该Nginx收集日志的Filebeat，你希望将它们封装为容器镜像，以方便日后分发。

如果将Nginx和Filebeat编译成同一个容器镜像是可以做到的，而且并不复杂，然而这样做会埋下隐患：这种镜像违背了Docker提倡的单个容器封装单进程应用的理念，Docker设计的Dockerfile只允许有一个ENTRYPOINT，这并非无故添加的人为限制，而是因为Docker只会通过监视PID为1的进程（即由ENTRYPOINT启动的进程）的运行状态来判断容器的状态是否正常，容器退出执行清理，容器崩溃自动重启等操作都必须先判断状态。设想一下，即使我们使用了[supervisord](http://supervisord.org/)之类的进程控制器来解决同时启动Nginx和Filebeat进程的问题，如果因某种原因它们不停发生崩溃、重启，那Docker也无法察觉到，它只能观察到supervisord的运行状态，因此，以上需求会理所当然地演化成场景二。

> **场景二**：假设你现在有两个Docker镜像，其中一个封装了HTTP服务，为便于称呼，我们叫它Nginx容器，另一个封装了日志收集服务，我们叫它Filebeat容器。现在要求Filebeat容器能收集Nginx容器产生的日志信息。

这依然很容易解决，只要在Nginx容器和Filebeat容器启动时，分别将它们的日志目录和收集目录挂在为主机同一个磁盘位置的Volume即可，这种操作在Docker中是极为常用的容器间信息交换手段。那我们继续，假如此时我又引入了一个新的工具[confd](https://github.com/kelseyhightower/confd)——Linux下的一种配置管理工具，作用是根据配置中心（Etcd、ZooKeeper、Consul）的变化自动更新Nginx的配置。这里又会遇到一个新问题，confd需要向Nginx发送HUP信号以便[通知Nginx](http://nginx.org/en/docs/control.html)配置已经发生了变更，这要求confd与Nginx能够进行IPC通讯才行。尽管共享IPC名称空间远不如共享Volume常用，但Docker确实支持了该功能，`docker run`提供了`--ipc`参数，用于把多个容器挂在到同一个父容器的IPC名称空间之下，实现共享IPC名称空间。类似地，如果要共享UTS名称空间，可以使用`--uts`参数，要共享网络名称空间的话，就使用`--network`参数，等等。

以上便是Docker针对场景二这种不跨机器的多容器协作所给出的解决方案，这也是[Docker Compose](https://docs.docker.com/compose/)的基本工作原理，它可以工作，却并不够优雅，也谈不上有什么系统性。容器的本质是对cgroups和namespaces所提供的隔离能力的一种封装，在Docker提倡的单进程封装的理念影响下，容器蕴含的隔离性也多了仅针对于单个进程的额外局限，然而Linux的cgroups和namespaces原本都是针对**进程组**而不仅仅是单个进程来设计的，同一个进程组中的多个进程天然就可以共享着相同的访问权限与资源配额。如果现在我们把容器与进程在概念上对应起来，那容器编排的第一个扩展点，就是要找到容器领域中与“进程组”相对应的概念，这是实现容器从隔离到协作的第一步，在Kubernetes的设计里，这个对应物叫做Pod。

:::quote 额外知识：Pod名字的由来与含义

Pod的概念在容器化出现之前的Borg系统中就已经存在，从Google的发表的《[Large-Scale Cluster Management at Google with Borg](https://pdos.csail.mit.edu/6.824/papers/borg.pdf)》可以看出，Kubernetes时代的Pod整合了Borg时代的“Prod”（Production Task的缩写）与“Non-Prod”的职能。由于Pod一直没有权威的中文翻译，笔者在后续文章中会尽量用英文指代，偶尔需要中文的场合就使用Borg中Prod的译法，即“生产任务”。

:::

扮演“容器组”的角色，解决场景二中的容器共享名称空间的需求，是Pod的两大最基本职责之一，同处于一个Pod内的多个容器，相互之间以超亲密的方式协作。请注意，“超亲密”在这里并非带强烈感情色彩的形容词，而是有一种有具体定义的协作程度，对于普通非亲密的容器，它们一般以网络交互方式（其他譬如共享分布式存储来交换信息也算跨网络）协作；对亲密协作的容器，是指它们被调度到同一个集群节点上，可以通过共享本地磁盘等方式协作；而超亲密的协作是特指多个容器位于同一个Pod这种特殊关系，它们将共享：

- UTS名称空间：所有容器都有相同的主机名和域名。
- 网络名称空间：所有容器都共享一样的网卡、网络栈、IP地址，等等。因此，同一个Pod中不同容器占用的端口不能冲突。
- IPC名称空间：所有容器都可以通过信号量或者POSIX共享内存等方式通讯。
- 时间名称空间：所有容器都共享相同的系统时间。

同一个Pod的容器，只有PID名称空间和文件名称空间默认是隔离的。PID的隔离令每个容器都有独立的进程ID编号，它们封装的应用进程就是PID 1进程，可以通过Pod元数据定义中的`spec.shareProcessNamespace`来改变这点。一旦要求共享PID名称空间，容器封装的应用进程就不再具有PID 1了，这有可能导致部分依赖该特性的应用出现异常。在文件名称空间方面，容器要求文件名称空间的隔离是很理所当然的需求，因为容器需要相互独立的文件系统以避免冲突。但容器间可以共享存储卷，这就是通过Kubernetes的Volume来实现。

:::quote 额外知识：Kubernetes中Pod名称空间共享的实现细节

Pod内部多个容器共享UTS、IPC、网络等名称空间是通过一个名为Infra Container的容器来实现的，这个容器是整个Pod中第一个启动的容器，只有几百KB大小（代码只有很短的几十行，见[这里](https://github.com/kubernetes/kubernetes/tree/master/build/pause)），Pod中的其他容器都会以Infra Container作为父容器，UTS、IPC、网络等名称空间实质上都是来自Infra Container的。

如果容器设置为共享PID名称空间的话，Infra Container中的进程将作为PID 1进程，其他容器的进程将以它的子进程的方式存在，此时将由Infra Container来负责进程管理（譬如清理[僵尸进程](https://en.wikipedia.org/wiki/Zombie_process)）、感知状态和传递状态。

由于Infra Container的代码除了注册SIGINT、SIGTERM、SIGCHLD等信号的处理器外，就只是一个以pause()方法为循环体的无限循环，永远处于Pause状态，所以也常被称为Pause Container。

:::

Pod存在的另外一个基本职责是实现原子性调度，如果容器编排不跨越集群节点，是否具有原子性都无关紧要。但是在集群环境中，容器可能跨机器调度时，以容器为单位来调度的话，不同容器就可能被分配到不同机器上。两台机器之间本来就是物理隔离、网络连接的，这时候谈什么名称空间共享、cgropus配额共享都没有意义了，我们由此从场景二又演化出以下场景三。

> **场景三**：假设你现在有Filebeat、Nginx两个Docker镜像，在一个具有多个节点的集群环境下，要求每次调度都必须让Filebeat和Nginx容器运行于同一个节点上。

两个关联的协作任务必须一起调度的需求在容器出现之前就存在已久，譬如在传统的[并发系统](https://en.wikipedia.org/wiki/Concurrency_(computer_science))的调度中，如果两个线程或者进程是紧密依赖的，单独给谁分配处理时间、而另一个被挂起都会导致不能工作，如此就有了[协同调度](https://en.wikipedia.org/wiki/Coscheduling)（Coscheduling）的概念，以保证一组紧密联系的任务能够被同时分配资源。如果我们在容器编排中仍然坚持将容器视为调度的最小粒度，那对容器运行所需资源的需求声明就要设定在容器上，这样集群每个节点剩余资源越紧张，单个无法容纳全部协同容器的概率就越大，协同的容器被分配到不同节点的可能性就越高。

协同调度是很麻烦的，实现起来要么很低效，譬如Apache Mesos的Resource Hoarding调度策略，就要等所有需要调度的任务都完备后才会开始分配资源；要么就会实现得很复杂。但是如果将运行资源的需求声明定义在Pod上，直接以Pod为最小的原子单位来实现调度的话，由于Pod之间绝不存在超亲密的协同关系，只通过网络非亲密地协作，那就根本没有协同的说法，自然也不需要考虑复杂的调度了（Kubernetes的调度还是相对较为复杂的，具体过程可参见“[资源与调度](/immutable-infrastructure/schedule/hardware-schedule.html)”）。

:::center
![](./images/pods.png)
Kubernetes资源层级模型
:::

Pod是Kubernetes资源层级模型中一种仅在逻辑上存在、没有物理对应的概念（因为对应的“进程组”也只是个逻辑概念），也是其他编排系统没有的概念，所以笔者用较大量的篇幅去介绍它的设计意图，而不是像帮助手册那样直接给出它的作用和特性。对于Kubernetes资源层级模型的其他方面，像Node、Cluster等有切实的物理对应物，很容易就能形成共同的认知，笔者也就不逐一详细介绍了。Kubernetes资源层级模型上至最大的Federation，下至最小的Container，每一项都有自己的设计意图，笔者简要列出如下：

- **容器**（Container）：延续了自Docker以来一个容器封装一个应用进程的理念，是镜像管理的最小单位。
- **生产任务**（Pod）：补充了容器化后缺失的与进程组对应的“容器组”的概念，Pod中容器共享UTS、IPC、网络等名称空间，是资源调度的最小单位。
- **节点**（Node）：对应于集群中的单台机器，这里的机器即可以是生产环境中的物理机，也可以是云计算环境中的虚拟节点，节点是处理器和内存等资源的资源池，是硬件单元的最小单位。
- **集群**（Cluster）：对应于整个集群，Kubernetes提倡理念是面向集群来管理应用。当你要部署应用的时候，只需要通过声明式API将你的意图写成一份元数据（Manifests），将它提交给集群即可，而无需关心它具体分配到哪个节点（尽管通过标签选择器你也完全可以控制它分配到哪个节点）、如何实现Pod间通讯、如何保证韧性与弹性，等等，所以集群是处理元数据的最小单位。
- **集群联邦**（Federation）：对应于多个集群，通过联邦可以统一管理多个Kubernetes集群，联邦的一种常见应用是支持跨可用区域多活、跨地域容灾的需求。

## 韧性与弹性

笔者曾看过一部叫做《[Bubble Boy](https://movie.douban.com/subject/1296612/)》的电影，讲述了一个体内没有任何免疫系统的小男孩，终日只能生活在无菌的圆形气球里，对常人来说不值一提的细菌，都能够直接威胁到他的性命。小男孩尽管能够降生于世间，但并不能真正与世界交流，这种生命是极度脆弱的。

真实世界的软件系统与电影世界中的小男孩具有可比性。让容器得以相互连通，相互协作仅仅是以容器构建系统的第一步，我们不仅希望得到一个能够运行起来的系统，而且还希望得到一个能够健壮运行的系统、能够抵御意外与风险的系统。在Kubernetes，你确实可以直接创建Pod将应用运行起来，但这样的应用就如同电影中只能存活在气球中的小男孩一般脆弱，无论是软件代码、意外操作或者硬件故障，都可能导致在复杂协作的过程中某个容器出现异常，进而出现系统性的崩溃。为此，架构师专门设计了[服务容错](/distribution/traffic-management/failure.html)的策略和模式，Kubernetes作为云原生时代的基础设施，也尽力帮助程序员以最小的代价来实现容错，为系统健壮运行提供底层支持。此外，如何实现具有韧性与弹性的系统也是展示Kubernetes控制器设计模式的最好示例，控制器模式是继资源层级模型之后，本节介绍的另一个Kubernetes核心设计理念。下面，我们就从如何解决以下场景中的问题开始。

> **场景四**：假设有一个由数十个Node、数百个Pod、近千个Container所组成的分布式系统，要避免系统因为外部流量压力、代码缺陷、软件更新、硬件升级、资源分配等各种原因而出现中断，作为管理员，你希望编排系统能为你提供何种支持？

我当然最希望编排系统能把所有意外因素都消灭掉，让任何每一个服务都永远健康永不出错，不过这个愿望大概只有凑齐七颗龙珠才有望办到。那退而求其次，让编排系统在这些服务出现问题，状态不正确的时候，能自动将它们调整成正确的状态。这种需求听起来也挺贪心的，但起码合理些，应对的解决办法[工业控制系统](https://en.wikipedia.org/wiki/Industrial_control_system)里已经很常见，叫做[控制回路](https://en.wikipedia.org/wiki/Control_loop)（Control Loop）。[Kubernetes官网](https://kubernetes.io/zh/docs/concepts/architecture/controller/)中以房间中空调自动调节温度为例子介绍了控制回路的一般工作过程：当你设置好了温度，就是告诉空调你对温度的“期望状态”（Desired State），而传感器测量出的房间实际温度是`当前状态”（Current State）。根据当前状态与期望状态的差距，控制器对空调制冷的开关进行调节控制，就能让其当前状态逐渐接近期望状态。

:::center
![](./images/controller.png)
控制循环
:::

为了能够以声明式的API来描述资源的期望状态，Kubernetes中已经内置了有相当多的资源对象，它们有一部分是已经出现在上节的资源层级模型中对容器运行环境不同粒度的抽象，另一部分则对应于安全、服务、令牌、网络等许多具体功能的抽象。每种资源都可以向Kubernetes声明它的期望状态，如果你已有实际操作Kubernetes的经验，那在元数据文件中的`spec`字段所描述的便是资源的期望状态。

:::quote 额外知识：Kubernates的资源对象与控制器

目前，Kubernetes已内置支持相当多的资源对象，并且还可以使用[CRD](/immutable-infrastructure/extension/crd.html)（Custom Resource Definition）来自定义扩充，你可以使用`kubectl api-resources`来查看它们。笔者根据用途分类列举了以下常见的资源：

- 用于描述如何创建、销毁、更新、扩缩Pod，包括：Autoscaling（HPA）、CronJob、DaemonSet、Deployment、Job、Pod、ReplicaSet、StatefulSet
- 用于配置信息的设置与更新，包括：ConfigMap、Secret
- 用于持久性地存储文件或者Pod之间的文件共享，包括：Volume、LocalVolume、PersistentVolume、PersistentVolumeClaim、StorageClass
- 用于维护网络通讯和服务访问的安全，包括：SecurityContext、ServiceAccount、Endpoint、NetworkPolicy
- 用于定义服务与访问，包括：Ingress、Service、EndpointSlice
- 用于划分虚拟集群、节点和资源配额，包括：Namespace、Node、ResourceQuota

这些资源在控制器管理框架中一般都会有相应的控制器来管理，笔者列举常见的控制器，按照它们的启动情况分类如下：

- 必须启用的控制器：EndpointController、ReplicationController、PodGCController、ResourceQuotaController、NamespaceController、ServiceAccountController、GarbageCollectorController、DaemonSetController、JobController、DeploymentController、ReplicaSetController、HPAController、DisruptionController、StatefulSetController、CronJobController、CSRSigningController、CSRApprovingController、TTLController
- 默认启用的可选控制器，可通过选项禁止：TokenController、NodeController、ServiceController、RouteController、PVBinderController、AttachDetachController
- 默认禁止的可选控制器，可通过选项启用：BootstrapSignerController、TokenCleanerController

:::

相应地，只要是状态会自动发生变化的资源对象，通常都会有对应的控制器进行追踪，每个控制器至少会追踪一种类型的资源。此外，Kubernetes还设计了统一的控制器管理框架（[kube-controller-manager](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-controller-manager/)）来维护这些控制器的正常运作，以及统一的指标监视器（[kube-apiserver](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-apiserver/)）来为控制器工作时提供其追踪资源的度量数据。

由于篇幅所限，笔者无法将每个控制器都详细展开讲解，毕竟不是在写Kubernetes的操作手册。尽管如此，只要将场景四进一步具体化，转换成场景五，便可以得到一个很好的例子，以部署控制器（Deployment Controller）、副本集控制器（ReplicaSet Controller）和自动扩缩控制器（HPA Controller）为例来介绍Kubernetes控制器模式的工作原理。

> **场景五**：通过服务编排，对任何分布式系统自动实现以下三种通用的能力：
>
> 1. Pod出现故障时，能够自动恢复，不中断服务；
> 2. Pod更新程序时，能够滚动更新，不中断服务；
> 3. Pod遇到压力时，能够水平扩展，不中断服务；

之前提到，虽然Pod本身也是资源，完全可以直接创建，但这样做是十分脆弱的，并不提倡。正确的做法是通过副本集（ReplicaSet）来创建Pod。ReplicaSet是一种资源，代表一个或多个Pod副本的集合，你可以在ReplicaSet资源的元数据中描述你期望Pod副本的数量（即`spec.replicas`的值）。当ReplicaSet成功创建之后，副本集控制器就会持续跟踪该资源，如果有Pod崩溃退出，或者状态异常（你可以在Pod中设置探针，以自定义的方式告诉Kubernetes出现何种情况Pod才算状态异常），ReplicaSet都会自动创建新的Pod来替代它；如果异常多出现了额外数量的Pod，也会被ReplicaSet自动回收掉，总之就是确保任何时候集群中这个Pod副本的数量都向期望状态靠拢。

ReplicaSet本身就足以满足场景五中的第一项能力，可以保证Pod出现故障时自动恢复，但是在升级程序版本时，ReplicaSet不得不主动中断旧Pod的运行，重新创建新版的Pod，这会造成服务中断。对于那些不允许中断的业务，以前的Kubernetes曾经提供过`kubectl rolling-update`命令来辅助实现滚动更新。所谓滚动更新（Rolling Updates）是指先停止少量旧副本，维持大量旧副本继续提供服务，当停止的旧副本更新成功、可以提供服务以后，再重复以上操作，直至所有的副本都更新成功。将这个过程放到ReplicaSet上，就是先创建新版本的ReplicaSet，然后一边让新ReplicaSet逐步创建新版Pod的副本，一边让旧的ReplicaSet逐渐减少旧版Pod的副本。

:::center
![](./images/rolling.png)
Deployment滚动更新过程
:::

之所以`kubectl rolling-update`命令会被淘汰，是因为这样的命令式交互完全不符合Kubernetes的设计理念（这是台面上的说法，笔者觉得淘汰的根本原因肯定是因为它不好用呀），如果你希望改变某个资源的某种状态，应该将期望状态告诉Kubernetes，而不是告诉Kubernetes具体该如何操作。为此，部署资源（Deployment）与部署控制器被设计出来，由Deployment来创建ReplicaSet，再由ReplicaSet来创建Pod，当你更新Deployment中的信息（典型的如程序版本）以后，部署控制器就会跟踪到你新的期望状态，自动地创建新ReplicaSet，并逐渐缩减旧的ReplicaSet的副本数，直至升级完成后彻底删除掉旧ReplicaSet，如上图所示。

场景五中最后一种情况，遇到流量压力时，你可以通过手动修改Deployment中的副本数量，或者通过`kubectl scale`命令指定副本数量，促使Kubernetes部署更多的Pod副本来应对压力，然而这种扩容方式不仅需要人工参与，且只靠人类经验来判断需要扩容的副本数量的难以做到精确、及时。为此Kubernetes提供了Autoscaling资源和自动扩缩控制器，能够实现自动根据度量指标（如处理器、内存占用率、用户自定义的度量值等）来设置Deployment（或者ReplicaSet）的期望状态，实现当度量指标出现变化时，系统自动按照“Autoscaling-->Deployment-->ReplicaSet-->Pod”这样的层层变更，最终实现根据度量指标自动扩容缩容。

故障恢复、滚动更新、自动扩缩这些特性，在云原生中时代里常被概括成服务的弹性（Elasticity）与韧性（Resilience），这些资源的操作在Kubernetes中也属于是所有教材资料都会讲到的“基础必修课”。如果你准备学习Kubernetes，建议不要死记硬背地学习每个资源的元数据文件该如何编写、有哪些指令、有哪些操作，而是站在更高层次去理解为什么Kubernetes要设计这些资源和控制器，为什么这些资源和控制器会被设计成这种样子。

如果你觉得已经理解了前面的几种资源和控制器的例子，那不妨思考一下：如果我想限制某个Pod持有的最大存储卷数量，应该会如何设计？如果集群中某个Node发生硬件故障，Kubernetes要让调度任务避开这个Node，应该如何设计？如果一旦这个Node重新恢复，Kubernetes要能尽快利用上面的资源，又该如何去设计？只要你真正接受了资源与控制器是贯穿整个Kubernetes的基本理念，即使不去查文档手册，也应该能推想出个大概轮廓。如此以后，当你再去看手册或者源码时，必定能够事半功倍。