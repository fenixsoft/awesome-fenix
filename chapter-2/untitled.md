# 依赖环境准备

## 一、安装Docker CE容器环境

​		本文为Linux系统安装Docker容器环境的简要说明，主要包括：

1. 安装稳定最新发行版（Stable Release）的命令执行过程及含义。

2. 针对国内网络环境的必要镜像加速或者代理设置工作。

​		若需了解Docker安装其他方面的内容，如安装Nightly/Test版本、Backporting、软件版权和支持等信息，可参考官方的部署指南：[https://docs.docker.com/install/](https://docs.docker.com/install/)

###### 更新系统软件仓库

> Debian系：
>
> ```bash
> $ sudo apt-get update
> ```
> 
> RedHat系
> ```bash
> $ sudo apt-get update
> ```

###### 安装Docker依赖工具:


> Debian系：
>
> ```bash
> $ sudo apt-get install \
>     apt-transport-https \
>     ca-certificates \
>     curl \
>     software-properties-common
> ```
> RedHat系
> 
> ```bash
> $ sudo yum install -y yum-utils \
>     device-mapper-persistent-data \
>     lvm2
>```



 如果以前已经安装过旧版本的Docker（可能会被称为docker，docker.io 或 docker-engine），需先行卸载

```bash
# Ain't no code for that yet, sorry
echo 'You got to trust me on this, I saved the world'
```

```

```