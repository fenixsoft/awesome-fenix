# Into Kubernetes

## Content

- [编译K3s](./build.md)
- 组件研究
  - [kube-apiserver](./apiserver)
  - node-agent
  - kubectl

## K3s

K3S是一个由Rancher维护的轻量级Kubernetes发行版，K3S并不是什么单词的缩写，它的意思是K与S之间有3个字母，共计5个字母，意味与10个字母长的K8S的一半。K3S主要用于小规模集群环境，如开发、持续集成、物联网、边缘计算等领域。特点是轻量、便捷、小型化，具体体现为：

1. 整个产品的所有组件，均以一个单独二进制程序包的形式存在，而且容量不到100 MB（1.20版实际为53 MB）。与原版Kubernetes将系统拆分为api-server、manager等多个Static Pod相比，部署、启动、重启、调试都相当便捷。这点也是推荐使用K3S来作为Kubernetes源码研究入门的重要考量因素。
2. 增加了SQLIte3的存储支持，并默认以SQLIte3代替Etcd作为控制平面的数据存储。K3S最初的目标并不支持高可用集群（控制平面以多个Master节点构成，现在K3S已经支持高可用部署了），对于单节点来说Etcd并没有价值，使用SQLIte3进一步降低了Kubernetes的技术栈门槛。
3. 最小化的操作系统和网络依赖，操作系统方面，只要求完整的Linux Kernel和cgroup支持，对具体发行版和其他第三方前置依赖没有更多的要求。网络方面，内置了应用最多的Flannel VXLAN作为默认的CNI网络，且简化了诸多网络操作，如worker无需专门想Kubernetes控制平面通过WebSocket Tunnel暴露kubelet API。
4. 内置常用组件，K3S在裁剪K3S非默认功能的同时，并非一味追求最小提及，它将易用性摆在小型化更高的优先级上，内置了[Flannel VXLAN](https://github.com/coreos/flannel) 、[CoreDNS](https://coredns.io/)、[Traefik](https://containo.us/traefik/)、[Klipper-lb](https://github.com/rancher/klipper-lb)、[Helm-controller](https://github.com/k3s-io/helm-controller)等一系列常用的组件，甚至内置了一批用于提升运维便捷性的常用主机工具：[Host utilities](https://github.com/k3s-io/k3s-root)（iptables/nftables, ebtables, ethtool, socat……）
