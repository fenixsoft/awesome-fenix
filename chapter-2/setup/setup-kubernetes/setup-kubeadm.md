# 使用Kubeadm部署Kubernetes集群

尽管使用Rancher或者KubeSphere这样更高层次的管理工具，可以更“傻瓜式”地部署Kubernetes集群，但kubeadm作为官方提供的用于快速安装Kbuernetes的命令行工具，仍然是应该掌握的基础技能。kubeadm随着新版的Kubernetes同步更新，时效性也会比其他更高层次的管理工具来的更好。

随着Kubernetes不断成熟，kuberadm无论是部署单控制平面（single control-plane，一个Master节点）集群还是高可用（high-availability，多个Master节点）集群，都已经有了更优秀的易用性，现在手工部署Kubernetes集群已经不是什么太复杂、困难的事情了。本文以Debian系的Linux为例，介绍通过kuberadm部署集群的全过程。

> **注意事项** 
>
> 安装Kubernetes集群，需要从谷歌的仓库中拉取镜像，由于国内访问谷歌的网络受阻，需要通过科学上网或者在Docker中预先拉取好所需镜像等方式解决。
>
> 集群中每台机器的Hostname不要重复，否则Kubernetes从不同机器收集状态信息时会产生干扰，被认为是同一台机器。
>
> 安装Kubernetes最小需要2核CPU、2GB内存。对于物理机来说，今时今日要找一台不满足的机器很困难，但对于虚拟机来说，尤其是购买云服务上最低配置的同学，要注意一下是否达到了最低要求。

###### 注册apt软件源

由于Kubernetes并不在主流Debian系统自带的软件源中，所以要手工注册，然后才能使用apt-get安装。

官方的GPG Key地址为：[https://packages.cloud.google.com/apt/doc/apt-key.gpg](https://packages.cloud.google.com/apt/doc/apt-key.gpg)，其中包括的软件源的地址为：https://apt.kubernetes.io/（该地址最终又会被重定向至：[https://packages.cloud.google.com/apt/](https://packages.cloud.google.com/apt/)）。如果能访问google.com域名的机器，采用以下方法注册apt软件源是最佳的方式：

```bash
# 添加GPG Key
$ curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

# 添加K8S软件源
$ sudo add-apt-repository "deb https://apt.kubernetes.io/ kubernetes-xenial main"
```

对于不能访问google.com的机器，就要借助国内的镜像源来安装了。虽然在这些镜像源中我已遇到过不止一次同步不及时的问题了——就是官方源中已经发布了软件的更新版本，而镜像源中还是旧版的，但是总归比没有的强。国内常见用的apt源有阿里云的、中科大的等，使用方式都是一致的，只需修改上面的GPG Key和软件源的URL地址即可。

> 阿里云：
> - GPG Key：http://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg
> - apt源：http://mirrors.aliyun.com/kubernetes/apt
>
> 中科大：
>
> - GPG Key：https://raw.githubusercontent.com/EagleChen/kubernetes_init/master/kube_apt_key.gpg
> - apt源：http://mirrors.ustc.edu.cn/kubernetes/apt

添加源后记得执行一次更新：

```bash
$ sudo apt-get update && apt-get upgrade
```

###### 安装kubelet、kubectl、kubeadm

其实并不需要在每个节点都装上kubeadm，但是，我就缺哪点磁盘空间吗？下面简要列出了这三个工具/组件的作用，现在看不看得懂都没有关系，以后用到它们的机会多得是，日久总会生情的。

- kubeadm: 引导启动Kubernate集群的命令行工具。
- kubelet: 在群集中的所有计算机上运行的组件, 并用来执行如启动pods和containers等操作。
- kubectl: 用于操作运行中的集群的命令行工具。

```bash
$ sudo apt-get install -y kubelet kubeadm kubectl 
```

###### 初始化集群前的准备

在使用kubeadm初始化集群之前，还有一些必须的前置工作要妥善处理：

首先，基于安全性（如在文档中承诺的Secret只会在内存中读写）、利于保证节点同步一致性等原因，Kubernetes在它的文档中明确提到了它**默认不支持Swap分区**，在未关闭Swap分区时，集群将直接无法启动。关闭Swap的命令为：

```bash
$ sudo swapoff -a
```

上面这个命令是一次性的，只在当前这次启动中生效，要彻底关闭Swap分区，需要在文件系统分区表的配置文件中去直接除掉Swap分区。使用vim打开/etc/fstab，注释其中带有swap的行即可。

```bash
$ vim /etc/fstab
```

> **可选操作**
>
> 当然，在服务器上使用的话，关闭Swap影响还是很大的，如果服务器除了Kubernetes还有其他用途的话（除非实在太穷，否则建议不要这样混用；一定要混用的话，宁可把其他服务搬到Kubernetes上）。关闭Swap有可能会对其他服务产生不良的影响，这时需要修改每个节点的kubelet配置，去掉必须关闭Swap的默认限制，具体操作为：
>
> ```bash
> $ echo "KUBELET_EXTRA_ARGS=--fail-swap-on=false" >> /etc/sysconfig/kubelet
> ```

其次，由于Kubernetes与Docker默认的cgroup（root控制组）驱动程序并不一致，Kubernetes默认为systemd，而Docker默认为cgroupfs。

尽管可能绝大多数的Kubernetes都是使用Docker作为容器配合使用的，但这两者并没有什么绝对绑定的依赖关系，Kubenetes对其管理的容器发布了一套名为”容器运行时接口“（Container Runtime Interface，CRI）的API，这套API在设计上，刻意兼容了”容器开放联盟“（Open Container Initiative，OCI）所制定的容器运行时标准，其他符合OCI标准的容器，同样也是可以与Kubernetes配合工作的，常见的有以下四种：

- [CRI-O ](https://github.com/kubernetes-incubator/cri-o)：由Kubernetes自己发布的ORI参考实现
- [rktlet ](https://github.com/kubernetes-incubator/rktlet)：rkt容器运行时
- [Frakti ](https://github.com/kubernetes/frakti)：一种基于Hypervisor的容器运行时
- [Docker CRI shim ](https://github.com/kubernetes/kubernetes/tree/release-1.5/pkg/kubelet/dockershim)：支持Docker直接充当CRI适配器。

在这里我们要修改Docker或者Kubernetes其中一个的cgroup驱动，以便两者统一。根据官方文档《[CRI installation](https://kubernetes.io/docs/setup/cri/)》中的建议，对于使用systemd作为引导系统的Linux的发行版，使用systemd作为Docker的cgroup驱动程序可以服务器节点在资源紧张的情况表现得更为稳定。

> **注解** cgroups是Linux内核提供的一种可以限制单个进程或者多个进程所使用资源的机制，可以对cpu，内存等资源实现精细化的控制。

这里选择修改各个节点上Docker的cgroup驱动为systemd，具体操作为修改/etc/docker/daemon.json文件，加入以下内容即可：

```
{
  "exec-opts": ["native.cgroupdriver=systemd"]
}
```

然后重新启动Docker容器：

```bash
$ systemctl daemon-reload
$ systemctl restart docker
```

###### 初始化Master节点



###### [可选] 让非Root用户可以使用Kubernetes



**安装CNI插件**

CNI即“容器网络接口”，在2016 年，CoreOS发布了CNI规范。2017年5月，CNI被CNCF技术监督委员会投票决定接受为托管项目，从此成为不同容器编排工具（Kubernetes、Mesos、OpenShift）可以共同使用的、解决容器之间网络通讯的统一接口规范。

部署Kubernetes时，我们可以有两种方案使得以后受管理的容器之间进行网络通讯：

- 使用Kubernetes 默认网络
- 使用CNI及其插件

第一种方案，尤其不在GCP或者AWS的云主机上，没有它们的命令行管理工具时，需要大量的手工配置，基本上是反人类的。通常都会采用第二种方案，使用CNI插件来处理容器网络通讯。

Kubernetes支持的CNI插件有：Calico、Cilium、Contiv-VPP、Flannel、Kube-router、Weave Net等六种，每种网络提供了不同的管理特性（如MTU自动检测）、安全特性（如是否支持加密通讯）、网络策略（如Ingress、Egress规则）、传输性能（甚至对TCP、UDP、HTTP、FTP、SCP等不同协议来说也有不同的性能表现）以及主机的性能消耗。后续我们将专门对不同CNI插件进行测试对比，而在环境部署这部分，使用Flannel是最合适的，它是最精简的CNI，没有安全支持，但主机压力小，安装容易，效率也不错。



###### [可选] 移除Master节点上的污点



###### 将其他Node节点加入到K8s集群中
