# 透明通讯的涅槃

:::tip 被分布式舍弃的Unix的设计哲学

原始分布式时代提出的构建“符合Unix的设计哲学的”、“如同本地调用一般简单透明的”分布式系统这个目标，是软件开发者对分布式系统最初的美好愿景，迫于现实，它会在一定时期内被妥协、被舍弃，分布式将会经过一段越来越复杂的发展进程。但是，到了三十多年以后的未来，随着微服务的逐渐成熟完善，成为大型软件的主流架构风格以后，这个美好的愿景终将还是会重新被开发者拾起。

:::right

—— [服务架构演进史](/architecture/architect-history/) · [原始分布式时代](/architecture/architect-history/primitive-distribution.html)

:::

Kubernetes为它管理的工作负载提供了工业级的韧性与弹性，还为每个处于运行状态的Pod维护了相互连通的虚拟化网络。不过，程序之间的通讯不同于简单地在网络上拷贝数据，具备可连通的网络环境仅仅是程序间能够可靠通讯的必要但非充分的条件，作为一名经历过SOA、微服务、云原生洗礼的的分布式程序员，你必定已深谙路由、容错、限流、加密、认证、授权、跟踪、度量等问题在分布式系统中都是无可回避的。

在本文档的“[远程服务调用](/architect-perspective/general-architecture/api-style/rpc.html#通信的成本)”里，笔者曾以“通讯的成本”为题，讲述了三十多年计算机科学家们对“远程服务调用有否可能实现为透明通讯”的一场声势浩大的论战。今天服务网格的诞生在某种意义上可以说是当年透明通讯的重生，服务网格试图以容器、虚拟化网络、边车代理等技术所构筑的新一代通讯基础设施为武器，重新对已盖棺定论三十多年的程序间通讯原则发起冲击。今天，这场关于通讯的变革仍然在酝酿发展当中，最后到底会是成功的逆袭，抑或是另一场失败，笔者不敢妄言定论，但是作为通讯发展历史的一名见证者，笔者丝毫不吝对服务网格投去最高的期许与最深的祝愿。

## 通讯的成本

程序间通讯作为服务架构的核心内容，本文档开篇的[服务架构演进史](/architecture/architect-history/)其实已从宏观角度讲述过它的演进过程。这节里，我们不妨再从更微观更聚焦的角度，通过以下五个阶段的变化，观察分布式服务的通讯是如何逐步演进至本节主角服务网格的。

- **第一阶段**：将通讯的非功能性需求视作业务逻辑的一部分，通讯的可靠性由程序员来保障。<br/>本阶段是早期软件企业尝试分布式时选择的技术策略。这类系统原本所具有的通讯能力通常不是作为业务功能的一部分被设计出来的，而是遇到问题后修补累积所形成的。开始时，系统往往只具最基本的网络API，譬如集成了OKHTTP、gRPC这样库来访问远程服务，如果远程访问接收到异常，就编写对应的重试或降级逻辑去应对。系统进入生产环境后，遇到并解决的每一个通讯问题，都在业务系统中留下了越来越多关于通讯的代码逻辑。这些通讯的逻辑由业务系统的开发人员直接编写，与业务逻辑直接共处在一个进程空间之中，如下图所示（注：本图与后面一系列图片中，笔者均以“断路器”和“服务发现”这两个常见的功能来泛指所有的分布式通讯所需的能力）。

  :::center
  ![](./images/service-mesh-1.png)
  控制逻辑和业务逻辑耦合
  :::

  这一阶段的主要矛盾是绝大多数擅长业务逻辑的开发人员都并不擅长处理通讯方面的问题，要写出正确、高效、健壮的分布式通讯代码，是一项专业性极强的工作。由此决定了大多数的普通软件企业都很难在这个阶段支撑起一个靠谱的分布式系统来。另一方面，把专业的通讯功能强加于普通开发人员，无疑为他们带来了更多工作量，尤其是这些“额外的工作”与原有的业务逻辑耦合在一起，让系统越来越复杂，也越来越容易出错。

- **第二阶段**：将代码中的通讯功能重构抽离成为公共组件库，通讯的可靠性由专业的平台程序员来保障。<br/>
  解耦依赖的有效办法是抽取分离代码与封装重构组件。微服务的普及离不开一系列封装了分布式通讯能力的公共组件库，代表性产品有Twitter的Finagle、Spring Cloud中的许多组件等。这些公共的通讯组件由熟悉分布式的专业开发人员编写和维护，不仅效率更高、质量更好，一般还提供了经过良好设计的API接口，让业务代码可以使用它们的能力，又无需把处理通讯的逻辑散布于业务代码当中。

  :::center
  ![](./images/service-mesh-2.png)
  抽取公共的分布式通讯组件
  :::

  分布式通讯组件让普通程序员开发出靠谱的微服务系统成为可能，这是无可抹杀的成绩，但普通程序员使用它们的成本依然很高，不仅要学习分布式的知识、要学习这些公共组件的功能应该如何使用，最麻烦的是，对于同一种问题往往还需学习多种不同的组件才能解决。这是因为通讯组件首先是一段特定语言开发出来的程序，是与语言绑定的，一个Python写的组件再优秀，对Java系统来说也没有太多价值。目前，基于公共组件库开发微服务仍然是应用最为广泛的解决方案，但肯定不是一种完美的解决方案，这是微服务基础设施完全成熟之前必然会出现的应用形态，同时也一定是微服务进化过程中必然会被替代的过渡形态。

- **第三阶段**：将负责通讯的公共组件库分离到进程之外，程序通过网络代理来保障可靠的通讯，通讯的可靠性由专门的网络代理提供商来保障。<br/>为了能够把分布式通讯组件与具体的编程语言脱钩，也为了避免程序员还要去专门学习这些组件的编程模型与API接口，这一阶段进化出了能专门负责可靠通讯的网络代理。这些网络代理不再与业务逻辑部署于同一个进程空间，但仍然与业务系统处于同一个容器或者虚拟机当中，可以通过回环设备或者[UDS](https://en.wikipedia.org/wiki/Unix_domain_socket)（Unix Domain Socket）进行访问，通常具备较高的网络性能。只要使用代理接管掉程序七层或四层流量，就能够在代理上完成断路、容错等几乎所有的分布式通讯功能，前面提到过的Netflix Prana就是这类产品的典型代表。

  :::center
  ![](./images/service-mesh-3.png)
  通过网络代理获得可靠的通讯能力
  :::

  通过网络代理来提升通讯质量的思路提出以后，它本身使用面并不算十分广泛，但它的方向是正确的。这种思路后来演化出了两种改进形态：一方面，如果将网络代理从进程身边拉远，让它与进程处于不同的机器上，就可以同时给多个进程提供可靠通讯的代理服务，这条路线形成了今天常见的微服务网关，在网关上同样可以实现流控、容错等功能。另一方面，如果将网络代理往进程方向推近，让它与进程处于一个共享了网络名称空间的容器组之中，这便形成了下一阶段所说的边车代理。

- **第四阶段**：将网络代理以边车的形式注入到应用容器，自动劫持应用的网络流量，通讯的可靠性由专门的通讯基础设施来保障。<br/>与前一阶段的独立代理相比，以边车模式运作的网络代理拥有两个无可比拟的重要优势：第一个优势是它对流量的劫持是强制性的，通常是靠直接写容器的iptables转发表来实现。此前，独立的网络代理只有程序首先去访问它，它才能被动地为程序提供可靠通讯服务，只要程序依然有选择不访问它的可能性（请注意上阶段的图中保留了两个容器网络设备直接连接的箭头就代表这种可能性，并注意到这阶段图中服务与网络名称空间的虚线箭头代表被劫持后实际不存在的流量），代理就永远只能充当服务者而不能成为管理者。另一个优势是边车代理对应用是透明的，无需对已部署的应用程序代码进行任何改动，不需要引入任何的库（并非全部都不需要，有部分边车代理也会要求有轻量级的SDK），也不需要程序专门去访问某个特定的网络位置。这意味着它对所有现存程序都具备直接的可用性，适用面极其广泛。目前边车代理的代表性产品有Linkerd、Envoy、MOSN等等。

  :::center
  ![](./images/service-mesh-4.png)
  边车代理模式
  :::

  如果说边车代理还有什么不足的话，那大概就是来自于运维人员的不满了。边车代理能够透明且具有强制力地解决可靠通讯的问题，但它本身也需要有足够的信息才能完成这项工作，譬如获取可用服务的列表，譬如得到每个服务名称对应的IP地址，等等。这些信息不会从天上掉下来自动到边车里去，是需要由管理员主动去告知代理，或者代理主动从约定的好的位置获取的。可见，管理代理本身也会产生通讯的需求。如果没有额外的支持，这些管理方面的通讯都得由运维人员去埋单，由此而生的不满可以理解。为了管理与协调边车代理，程序间通讯进化到了最后一个阶段：服务网格。

- **第五阶段**：将边车代理统一管控起来实现安全、可控、可观测的通讯，将数据平面与控制平面分离开来，实现通用、透明的通讯，这项工作就由专门的服务网格框架来保障。<br/>从总体架构看，服务网格包括两大块内容，分别是由一系列与微服务共同部署的边车代理，以及用于控制这些代理的管理器所构成。代理与代理之间需要通讯，用以转发程序间通讯的数据包；代理与管理器之间也需要通讯，用以传递路由管理、服务发现、数据遥测等控制信息。服务网格使用[数据平面](https://en.wikipedia.org/wiki/Forwarding_plane)（Data Plane）通讯和[控制平面](https://en.wikipedia.org/wiki/Control_plane)（Control Plane）通讯来形容这两类流量，下图中实线就表示数据平面通讯，虚线表示控制平面通讯。

  :::center
  ![](./images/service-mesh-5.png)
  服务网格的控制平面通讯与数据平面通讯（[图片来源](https://philcalcado.com/2017/08/03/pattern_service_mesh.html)）
  :::

  数据平面与控制平面并非什么新鲜概念，它最初出现在计算机网络之中，通常是指网络层的划分。软件定义网络更是将解耦数据平面与控制平面作为其最主要特征之一。服务网格把计算机网络的经典概念引入到程序通讯之中，既可以说是对程序通讯的一种变革创新，也可以说是对网络通讯的一种发展传承。

  分离数据平面与控制平面的实质是将“程序”与“网络”进行解藕，将网络可能出现的问题（譬如中断后重试、降级），与可能需要的功能（譬如实现追踪度量）的解决过程从程序中拿出，放到由控制平面指导的数据平面通讯中去处理，制造出一种“这些问题在程序间通讯中根本不存在”的假象，仿佛网络和远程服务都是完美可靠的。这种完美的假象，让应用之间可以非常简单地交互而不必考过多虑异常情况，能够在不同的云服务提供商的环境间平稳地迁移；同时，也让管理者能够不依赖程序支持就得到遥测所需的全部信息，或者根据角色、权限进行统一的访问控制，这些就都是服务网格的核心价值所在。

## 数据平面

在“数据平面”和“控制平面”这两个小节里，笔者会延续服务网格将“程序”与“网络”解藕的思路，介绍几个数据平面通讯与控制平面通讯中的核心问题。目前在工业界，数据平面已有Linkerd、Nginx、Envoy等实现，控制平面也有Istio、Open Service Mesh、Consul等实现，下文中笔者会以目前市场占有率最高的Istio与Envoy为例进行讲述，但主要目的是介绍两种平面通讯的基础原理，这些原理在各种服务网格产品中一般都是通用的，并不局限于某种具体实现。

数据平面由一系列边车代理所构成，核心职责是转发应用的入站（Inbound）和出站（Outbound）数据包，因此数据平面也有个别名叫转发平面（Forwarding Plane）。同时，为了在不可靠的物理网络中保证程序间通讯最大的可靠性，数据平面需要依据控制平面下发策略的指导，在应用无感知的情况下自动完成服务路由、健康检查、负载均衡、认证鉴权、产生监控数据等一系列工作。为了达成上述的工作目标，至少需要妥善解决以下三个关键问题：

- 代理注入：边车代理是如何注入到应用程序中的？
- 流量劫持：边车代理是如何劫持应用程序的通讯流量的？
- 可靠通讯：边车代理是如何保证应用程序的通讯可靠性的？

### 代理注入

从职责上说，注入边车代理是控制平面的工作，但从本文的叙述逻辑上放在数据平面中介绍更合适。将边车代理注入到应用的过程并不一定必须是透明的，现在的服务网格产品存在有以下三种方式将边车代理接入到应用程序中：

- **基座模式**（Chassis）：这种方式接入的边车代理对程序是不透明的，它至少会包括一个SDK，通讯由SDK中的接口去处理。基座模式的好处是在程序代码的帮助，有可能达到更好的性能，功能也更容易实现，但坏处是对代码有侵入性，对编程语言有依赖性。典型产品如由华为开源后捐献给ASF的[Apache ServiceComb Mesher](https://github.com/apache/servicecomb-mesher)。采用基座模式的接入目前并不属于主流方式，因此笔者也不展开介绍。
- **注入模式**（Injector）：根据注入方式不同，又可以分为：
  - 手动注入模式：这种接入方式对使用者来说不透明，但对程序来说是透明的。由于边车代理的定义就是一个与应用共享网络名称空间的辅助容器，这天然就符合了Pod的定义，因此在Kubernetes中要进行手动注入是很简单的——就是为Pod增加一个额外容器而已，即使没有工具帮助，自己修改Pod的Manifest也能轻易办到。如果你以前不曾尝试过，不妨找一个Pod的配置文件，用`istioctl kube-inject -f YOUR_POD.YAML`命令来查看一下手动注入会对原有的Pod产生什么变化。
  - 自动注入模式：这种接入方式对使用者和程序都是透明的，是Istio推荐的代理注入方式。在Kubernetes中，通常会依靠“[动态准入控制](https://kubernetes.io/zh/docs/reference/access-authn-authz/extensible-admission-controllers/)”（Dynamic Admission Control）中的[Mutating Webhook](https://kubernetes.io/zh/docs/reference/access-authn-authz/admission-controllers/#mutatingadmissionwebhook)控制器来实现。

:::quote 额外知识

[istio-proxy](https://github.com/istio/proxy)是Istio对Envoy代理的包装容器，其中包含用Golang编写的`pilot-agent`和用C++编写的`envoy`两个进程。[pilot-agent](https://istio.io/v1.6/docs/reference/commands/pilot-agent/)进程负责Envoy的生命周期管理，譬如启动、重启、优雅退出等，并维护Envoy所需的配置信息，譬如初始化配置，随时根据控制平面的指令热更新Envoy的配置等。

:::

笔者以Istio自动注入边车代理（istio-proxy容器）的过程为例，介绍一下自动注入的具体的流程。只要对Istio有基本了解的同学都知道，对任何设置了`istio-injection=enabled`标签的名称空间，Istio都会自动为其中新创建的Pod注入一个名为istio-proxy的容器。之所以能做到自动这一点，是因为Istio预先在Kubernetes中注册了一个类型为`MutatingWebhookConfiguration`的资源，它的主要内容如下所示：

```yaml
apiVersion: admissionregistration.k8s.io/v1beta1
kind: MutatingWebhookConfiguration
metadata:
  name: istio-sidecar-injector
  .....
webhooks:
- clientConfig:
    service:
      name: istio-sidecar-injector
      namespace: istio-system
      path: /inject
  name: sidecar-injector.istio.io
  namespaceSelector:
    matchLabels:
      istio-injection: enabled
  rules:
  - apiGroups:
    - ""
    apiVersions:
    - v1
    operations:
    - CREATE
    resources:
    - pods
```

以上配置告诉Kubernetes，对于符合标签`istio-injection: enabled`的名称空间，在资源`pods`进行`CREATE`操作时，会触发一个Webhook调用，调用的位置是`istio-system`名称空间中的服务`istio-sidecar-injector`，URL路径是`/inject`。Kubernetes会把拟新建的Pod定义作为参数发送给该地址，然后从该服务返回注入了边车代理的Pod定义，以此自动实现注入。

### 流量劫持

边车代理做流量劫持最常用的方式是基于iptables进行的数据转发，笔者曾在“[Linux网络虚拟化](/immutable-infrastructure/network/linux-vnet.html#干预网络通讯)”中介绍过Netfilter与iptables的工作原理。这里仍然以Istio为例，它在注入边车代理后，除了生成封装Envoy的istio-proxy容器外，还会生成一个initContainer，作用就是修改iptables，其主要内容如下所示：

```yaml
initContainers:
  image: docker.io/istio/proxyv2:1.5.1
  name: istio-init
- command:
  - istio-iptables -p "15001" -z "15006"-u "1337" -m REDIRECT -i '*' -x "" -b '*' -d 15090,15020
```

以上命令行中的[istio-iptables](https://github.com/istio/cni/blob/master/tools/packaging/common/istio-iptables.sh)是Istio提供的用于配置iptables的Shell脚本，这行的意思是让边车代理拦截所有的进出Pod的流量，具体动作为：拦截除15090、15020端口（这两个分别是Mixer和Ingress Gateway的端口，关于Istio占用的固定端口可参考[官方文档](https://istio.io/zh/docs/ops/deployment/requirements/)所列）外的所有入站流量，全部转发至15006端口（Envoy入站端口），经Envoy处理后，从15001端口（Envoy出站端口）发送出去。该命令会在iptables中的PREROUTING和OUTPUT链中挂载相应的转发规则，以使用`iptables -t nat -L -v`命令可以查看到如下所示配置信息：

```bash
Chain PREROUTING
 pkts bytes target				prot opt in     out     source               destination
 2701  162K ISTIO_INBOUND		tcp  --  any    any     anywhere             anywhere

Chain OUTPUT
 pkts bytes target				prot opt in     out     source               destination
   15   900 ISTIO_OUTPUT		tcp  --  any    any     anywhere             anywhere

Chain ISTIO_INBOUND (1 references)
 pkts bytes target				prot opt in     out     source               destination
    0     0 RETURN				tcp  --  any    any     anywhere             anywhere             tcp dpt:ssh
    2   120 RETURN				tcp  --  any    any     anywhere             anywhere             tcp dpt:15090
 2699  162K RETURN				tcp  --  any    any     anywhere             anywhere             tcp dpt:15020
    0     0 ISTIO_IN_REDIRECT	tcp  --  any    any     anywhere             anywhere

Chain ISTIO_IN_REDIRECT (3 references)
 pkts bytes target				prot opt in     out     source               destination
    0     0 REDIRECT			tcp  --  any    any     anywhere             anywhere             redir ports 15006

Chain ISTIO_OUTPUT (1 references)
 pkts bytes target				prot opt in     out     source               destination
    0     0 RETURN				all  --  any    lo      127.0.0.6            anywhere
    0     0 ISTIO_IN_REDIRECT	all  --  any    lo      anywhere            !localhost            owner UID match 1337
    0     0 RETURN				all  --  any    lo      anywhere             anywhere             ! owner UID match 1337
   15   900 RETURN				all  --  any    any     anywhere             anywhere             owner UID match 1337
    0     0 ISTIO_IN_REDIRECT	all  --  any    lo      anywhere            !localhost            owner GID match 1337
    0     0 RETURN				all  --  any    lo      anywhere             anywhere             ! owner GID match 1337
    0     0 RETURN				all  --  any    any     anywhere             anywhere             owner GID match 1337
    0     0 RETURN				all  --  any    any     anywhere             localhost
    0     0 ISTIO_REDIRECT		all  --  any    any     anywhere             anywhere

Chain ISTIO_REDIRECT (1 references)
 pkts bytes target				prot opt in     out     source               destination
    0     0 REDIRECT			tcp  --  any    any     anywhere             anywhere             redir ports 15001
```

用iptables进行流量劫持是最经典、最通用的手段，不过，iptables 重定向流量本质上是通过回环设备（Loopback）交换数据，流量不得不多穿越一次协议栈，如下图所示。

:::center
![](./images/iptables.png)
经过iptables转发的通讯
:::

这种方案在不以网络I/O为主要瓶颈的系统中非常合适，但在大并发场景下会损失较多的转发性能。目前，如何实现更优化的数据平面流量劫持，已成为服务网格发展的前言课题之一，其中一种可行的优化方案是使用[eBPF](https://en.wikipedia.org/wiki/Berkeley_Packet_Filter)（Extended Berkeley Packet Filter）技术，在Socket层面直接完成数据转发，而不需要再往下经过更底层的TCP/IP协议栈的处理，从而减少它在数据链路上的通信链路长度。

:::center
![](./images/ebpf.png)
经过eBPF直接转发的通讯
:::

另一种可以考虑的方案是服务网格与CNI插件配合来实现流量劫持，譬如Istio就有提供[自己实现的CNI插件](https://github.com/istio/istio/tree/master/cni)。只要安装了这个CNI插件，整个虚拟化网络都由Istio自己来控制，那自然就无需再依赖iptables，也不必存在initContainers配置和istio-init容器了。这种方案有极高的上限与自由度，不过，要实现一个功能全面、管理灵活、性能优秀、表现稳定的CNI网络插件并非易事，连Kubernetes自己都迫不及待想从网络插件中脱坑，其麻烦程度可见一斑，因此目前这种方案使用也并不算广泛。

流量劫持技术的发展与服务网格的落地效果密切相关，有一些服务网格通过基座模式中的SDK也能达到很好的转发性能，但考虑到应用程序通用、环境迁移的问题，无侵入式的低时延、低管理成本的流量劫持方案仍然是研究的主流方向。

### 可靠通讯

注入边车代理，劫持应用流量，最终的目的都是为了代理能够接管应用通讯，然而，代理接管了应用的通讯之后会做什么呢？这个问题的答案是：不确定。代理的行为需要根据控制平面提供的策略来决定，传统的代理，譬如HAProxy、Nginx是使用静态配置文件来承载转发策略的，这种静态配置很难跟得上应用需求的变化与网络拓扑结构的变动。Envoy在这方面进行了创新，它将代理的转发的行为规则抽象成Listener、Router、Cluster三种资源，以此为基础，定义了应该如何发现和访问这些资源的一系列API，统称为xDS协议族。从此，数据平面有了策略描述的标准，控制平面也有了与控制平面交互的标准。目前xDS v3.0协议族已经包含有以下具体协议：

| 简称</div> |             全称             |                服务描述                 |
| :----- | :-------------------------- | :--------------------------------- |
|  <div style="width:60px">LDS</div>    |  Listener Discovery Service  |           监听器发现服务            |
|   RDS    |   Route Discovery Service    |            路由发现服务             |
|   CDS    |  Cluster Discovery Service   |            集群发现服务             |
|   EDS    |  Endpoint Discovery Service  |          集群成员发现服务           |
|   ADS    | Aggregated Discovery Service |            聚合发现服务             |
|   HDS    |   Health Discovery Service   |           健康度发现服务            |
|   SDS    |   Secret Discovery Service   |            密钥发现服务             |
|    MS    |        Metric Service        |            度量指标服务           |
|   RLS    |      Rate Limit Service      |          速率限制服务           |
| ALS | gRPC Access Log Service | gRPC访问日志服务 |
| LRS | Load Reporting service             | 负载报告服务 |
| RTDS | Runtime Discovery Service | 运行时发现服务 |
| CSDS | Client Status Discovery Service | 客户端状态发现服务 |
| ECDS | Extension Config Discovery Service | 扩展配置发现服务 |

笔者不会逐一介绍这些协议，但应该应当说明清楚它们一致的运作原理，这需要弄明白Listener、Router、Cluster三种资源的具体含义：

- **Listener**：Listener可以简单理解为Envoy的一个监听端口，用于接收来自下游应用程序（Downstream）的数据。Envoy能够同时支持多个Listener，不同的Listener之间的策略配置是相互隔离的。<br/>自动发现Listener的服务被称为LDS（Listener Discovery Service），这是所有其他xDS协议的基础，如果没有LDS（也没有在Envoy启动时静态配置Listener的话），其他所有xDS服务也就失去了意义，因为没有监听端口的Envoy不能为任何应用提供服务。

- **Cluster**：Cluster是Envoy能够连接到的一组逻辑上提供相同服务的上游主机。Cluster包含该服务的连接池、超时时间、Endpoints地址、端口、类型等信息。具体到Kubernetes环境下，可以认为Cluster与Service是对等的概念，Cluster实际上承担了[服务发现](/distribution/connect/service-discovery.html)的职责。<br/>自动发现Cluster的服务被称为CDS（Cluster Discovery Service），通常情况下，控制平面会将它从外部环境中获取的所有可访问服务全量推送给Envoy。与CDS紧密相关的另一种服务是EDS（Endpoint Discovery Service）。当Cluster的类型被标识为需要EDS时，则说明该Cluster的所有Endpoints地址应该由xDS服务下发，而不是依靠DNS服务去解析。

- **Router**：Listener负责接收来自下游的数据，Cluster负责将数据转发送给上游的服务，而Router则决定Listener在接收到下游的数据之后，具体应该将数据交给哪一个Cluster处理，由此定义可知，Router实际上是承担了[服务网关](/distribution/connect/service-routing.html)的职责。<br/>自动发现Router的服务被称为RDS（Router Discovery Service），Router中最核心信息是目标Cluster及其匹配规则，即实现网关的路由职能。此外，视Envoy中的插件配置情况，也可能包含重试、分流、限流等动作，实现网关的过滤器职能。

:::center
![](./images/xds.png)
xDS协议运作模型
:::

Envoy的另外一个重点是它的Filter机制，Filter通俗地讲就是Envoy的插件，通过Filter机制Envoy提供了强大的可扩展能力，不仅是无关重要的外围功能，很多核心功能都使用Filter来实现的。譬如对HTTP流量的治理、Tracing机制、多协议支持，等等。利用Filter机制，Envoy理论上可以实现任意协议的支持以及协议之间的转换，可以对请求流量进行全方位的修改和定制，同时还保证优秀的可维护性。

## 控制平面

如果说数据平面是行驶中的车辆，那控制平面就是车辆上的导航系统；如果说数据平面是城市的交通道路，那控制平面就是路口的指示牌与交通信号灯。控制平面的特点是不直接参与程序间通讯，而只会与数据平面中的代理通讯，主要负责下发配置和策略，指导数据平面工作。由于服务网格并没有大规模引入计算机网络中[管理平面](https://en.wikipedia.org/wiki/Management_plane)（Management Plane）的概念，所以控制平面通常也会附带地实现譬如网络行为的可视化、配置传输等一系列管理职能（是有专门的管理平面工具的，譬如[Meshery](https://github.com/layer5io/meshery)、[ServiceMeshHub](https://github.com/solo-io/service-mesh-hub)）。笔者仍然以Istio为例具体介绍一下控制平面的主要功能。

Istio在1.5版本之前，Istio自身也是采用微服务架构开发的，将控制平面的职责分解为Mixer、Pilot、Galley、Citadel四个模块去实现，其中Mixer负责鉴权策略与遥测；Pilot负责对接Envoy的数据平面，遵循xDS协议进行策略分发；Galley负责配置管理，为服务网格提供配置输入能力；Citadel负责安全加密，提供服务和用户层面的认证和鉴权、管理凭据和RBAC等安全相关能力。不过，经过两、三年的实践应用，很多用户都有反馈Istio的微服务架构有过度设计的嫌疑，lstio在定义项目目标时，曾非常理想化的提出控制平面的各个组件都应可以独立部署，然而在实际应用场景里却并非如此，独立的组件反而带来了部署复杂、职责划分不清晰等问题。

:::center
![](./images/istio-arch.png)
Istio 1.5版本之后的架构（图片来自[Istio官方文档](https://istio.io/latest/docs/ops/deployment/architecture/)）
:::

从1.5版本起，Istio开始回归单体架构，将Pilot、Galley、Citadel的功能全部集成到新的Istiod之中。当然，这也并不是说完全推翻之前的设计，只是将原有的多进程形态优化成单进程的形态，之前各个独立组件变成了Istiod的内部子模块而已。单体化之后出现的新进程Istiod就承担所有的控制平面职责，具体包括有：

- **数据平面交互**：这是部分是满足服务网格正常工作所需的必要工作，具体有：
  - **边车注入**：在Kubernetes中注册Mutating Webhook控制器，实现代理容器的自动注入，并生成Envoy的启动配置信息。
  - **策略分发**：接手了原来Pilot的核心工作，为所有的Envoy代理提供符合xDS协议的策略分发的服务。
  - **配置分发**：接手了原来Galley的核心工作，负责监听来自多种支持配置源的数据，譬如kube-apiserver，本地配置文件，或者定义为[网格配置协议](https://github.com/istio/api/tree/master/mcp)（Mesh Configuration Protocol，MCP）的配置信息。原来Galley需要处理的API校验和配置转发功能也包含在内。
- **流量控制**：这通常是用户使用服务网格的最主要目的，具体包括以下几个方面：
  - **请求路由**：通过[VirtualService](https://istio.io/latest/docs/reference/config/networking/virtual-service/)、[DestinationRule](https://istio.io/latest/docs/reference/config/networking/destination-rule/)等Kubernetes CRD资源实现了灵活的服务版本切分与规则路由。譬如根据服务的迭代版本号（如v1.0版、v2.0版）、根据部署环境（如Development版、Production版）作为路由规则来控制流量，实现诸如金丝雀发布这类应用需求。
  - **流量治理**：包括熔断、超时、重试等功能，譬如通过修改Envoy的最大连接数，实现对请求的流量控制；通过修改负载均衡策略，在轮询、随机、最少访问等方式间进行切换；通过设置异常探测策略，将满足异常条件的实例从负载均衡池中摘除，以保证服务的稳定性，等等。
  - **调试能力**：包括故障注入和流量镜像等功能，譬如在系统中人为的设置一些故障，来测试系统的稳定性和系统恢复的能力。又譬如通过复制一份请求流量，把它发送到镜像服务，从而满足[A/B验证](https://en.wikipedia.org/wiki/A/B_testing)的需要。
- **通讯安全**：包括通讯中的加密、凭证、认证、授权等功能，具体有：
  - **生成CA证书**：接手了原来Galley的核心工作，负责生成通讯加密所需私钥和CA证书。
  - **SDS服务代理**：最初Istio是通过Kubernetes的Secret卷的方式将证书分发到Pod中的，从Istio 1.1之后改为通过SDS服务代理来解决，这种方式保证了私钥证书不会在网络中传输，仅存在于SDS代理和Envoy的内存中，证书刷新轮换也不需要重启Envoy。
  - **认证**：提供基于节点的服务认证和基于请求的用户认证，这项功能笔者曾在服务安全的“[认证](/distribution/secure/service-security.html#认证)”中详细介绍过。
  - **授权**：提供不同级别的访问控制，这项功能笔者也曾在服务安全的“[授权](/distribution/secure/service-security.html#授权)”中详细介绍过。
- **可观测性**：包括日志、追踪、度量三大块能力，具体有：
  - **日志收集**：程序日志的收集并不属于服务网格的处理范畴，通常会使用ELK Stack去完成，这里是指访问日志的收集，对等的类比目标应该是以前Nginx、Tomcat的日志。
  - **链路追踪**：为请求途径的所有服务生成分布式追踪数据并自动上报，运维人员可以通过Zipkin等追踪系统从数据中重建服务调用链，开发人员可以借此了解网格内服务的依赖和调用流程。
  - **指标度量**：基于四类不同的监控标识（响应延迟、流量大小、错误数量、饱和度）生成一系列观测不同服务的监控指标，用于记录和展示网格中服务状态。
