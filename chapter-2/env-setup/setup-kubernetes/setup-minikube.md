# 使用Minikube安装Kubernetes集群

Minikube是Kubernetes官方提供的专门针对本地单节点集群的Kubernetes集群管理工具。针对本地环境对Kubernetes使用有一定的简化和针对性的补强。这里简要介绍其安装过程

#### 安装Minikube

Minikube是一个单文件的二进制包，安装十分简单，在已经完成[Docker安装](../setup-docker.md)的前提下，使用以下命令可以下载并安装最新版的Minikube。

```bash
$ curl -Lo minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/
```

#### 安装Kubectl工具

Minikube中很多提供了许多子命令以代替Kubectl的功能，安装Minikube时并不会一并安装Kubectl。但是Kubectl作为集群管理的命令行，要了解Kubernetes是无论如何绕不过去的，通过以下命令可以独立安装Kubectl工具。

```bash
$ curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl && chmod +x kubectl && sudo mv kubectl /usr/local/bin/
```

#### 启动Kubernetes集群

有了Minikube，通过start子命令就可以一键部署和启动Kubernetes集群了，具体命令如下：

```bash
$ minikube start --iso-url=https://kubernetes.oss-cn-hangzhou.aliyuncs.com/minikube/iso/minikube-v1.6.0.iso
                 --registry-mirror=https://registry.docker-cn.com
                 --image-mirror-country=cn 
                 --image-repository=registry.cn-hangzhou.aliyuncs.com/google_containers
                 --vm-driver=none
                 --memory=4096  
```

以上命令中，明确要求Minikube从指定的地址下载虚拟机镜像、Kubernetes各个服务Pod的Docker镜像，并指定了使用Docker官方节点作为国内的镜像加速服务。

“vm-drvier”参数是指Minikube所采用的虚拟机，根据不同操作系统，不同的虚拟机可以有以下选项：

| 操作系统 | 支持虚拟机        | 参数值     |
| -------- | ----------------- | ---------- |
| Windows  | Hyper-V           | hyperv     |
| Windows  | VirtualBox        | virtualbox |
| Linux    | KVM               | kvm2       |
| Linux    | VirtualBox        | virtualbox |
| MacOS    | HyperKit          | hyperkit   |
| MacOS    | VirtualBox        | virtualbox |
| MacOS    | Parallels Desktop | parallels  |
| MacOS    | VMware Fusion     | vmware     |

特别需要提一下的是如果读者使用的并非物理机器，而是云主机环境——现在流行将其成为“裸金属”（Bare Metal）服务器，那在上面很可能是无法再部署虚拟机环境的，这时候应该将vm-drvier参数设为none。也可以使用以下命令设置虚拟机驱动的默认值：

```bash
$ minikube config set vm-driver none
```

至此，整个Kubernetes就一键启动完毕了。其他工作，如命令行的自动补全，可参考使用[Kubeadm安装Kubernetes集群](setup-kubeadm.md)中相关内容。