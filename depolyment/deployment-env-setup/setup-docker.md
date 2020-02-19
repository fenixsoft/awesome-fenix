# 部署Docker CE容器环境

本文为Linux系统安装Docker容器环境的简要说明，主要包括：

1. 安装稳定最新发行版（Stable Release）的命令及含义。
2. 针对国内网络环境的必要镜像加速或者代理设置工作。

若需了解Docker安装其他方面的内容，如安装Nightly/Test版本、Backporting、软件版权和支持等信息，可参考官方的部署指南：[https://docs.docker.com/install/](https://docs.docker.com/install/)

文中涉及到的Debian系和Redhat系的包管理工具，主要包括：

* Debian系：Debian、Ubuntu、Deepin、Mint
* Redhat系：RHEL、Fedora、CentOS

如用的其他Linux发行版，如Gentoo、Archlinux、OpenSUSE等，建议自行安装二进制包。

## 移除旧版本Docker

如果以前已经安装过旧版本的Docker（可能会被称为docker，docker.io 或 docker-engine），需先行卸载。

> Debian系：
>
> ```bash
> $ sudo apt-get remove docker docker-engine docker.io containerd runc
> ```
>
> RedHat系：
>
> ```bash
> $ sudo yum remove docker \
>                   docker-client \
>                   docker-client-latest \
>                   docker-common \
>                   docker-latest \
>                   docker-latest-logrotate \
>                   docker-logrotate \
>                   docker-engine
> ```

## 安装Docker依赖工具链及软件源

在Debian上主要是为了apt能够正确使用HTTPS协议，并将Docker官方的GPG Key（GNU Privacy Guard，包的签名机制）和软件源地址注册到软件源中。

在RHEL上是为了devicemapper获得yum-config-manager、device-mapper-persistent-data、lvm2的支持。

> Debian系：
>
> ```bash
> $ sudo apt-get install apt-transport-https \
>                        ca-certificates \
>                        curl \
>                        software-properties-common
>                        
> # 注册Docker官方GPG公钥
> $ sudo curl -fsSL https://download.docker.com/linux/debian/gpg | sudo apt-key add -
>
> # 检查Docker官方GPG公钥指纹是否正确
> $ sudo apt-key fingerprint 0EBFCD88
>
> pub   4096R/0EBFCD88 2017-02-22
>       Key fingerprint = 9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88
> uid                  Docker Release (CE deb) <docker@docker.com>
> sub   4096R/F273FCD8 2017-02-22
>
> # 将Docker地址注册到软件源中
> # 注意$(lsb_release -cs)是返回当前发行版的版本代号，例如Ubuntu 18.04是bionic，19.10是eoan
> # 但在Ubuntu 19.10发布一段时间后，Docker官方并未在源地址中增加eoan目录，导致此命令安装失败，日后在最新的系统上安装Docker，需要注意排查此问题，手动更改版本代号完成安装
> $ sudo add-apt-repository \
>     "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
>     $(lsb_release -cs) \
>     stable"
> ```
>
> RedHat系：
>
> ```bash
> $ sudo yum install -y yum-utils \
>                       device-mapper-persistent-data \
>                       lvm2
>
> # 将Docker地址注册到软件源中
> $ sudo yum-config-manager \
>        --add-repo \
>        https://download.docker.com/linux/centos/docker-ce.repo
> ```

## 更新系统软件仓库

> Debian系：
>
> ```bash
> $ sudo apt-get update
> ```
>
> RedHat系：
>
> ```bash
> $ sudo yum update
> ```

## 安装Docker-Engine Community

> Debian系：
>
> ```bash
> $ sudo apt-get install docker-ce docker-ce-cli containerd.io
> ```
>
> RedHat系：
>
> ```bash
> $ sudo yum install docker-ce docker-ce-cli containerd.io
> ```

## 确认Docker安装是否成功

直接运行官方的hello-world镜像测试安装是否成功

```bash
$ sudo docker run hello-world
```

## \[可选\] 配置国内镜像库

由于Docker官方镜像在国内访问缓慢，官方提供了在国内的镜像库：[https://registry.docker-cn.com](https://registry.docker-cn.com)，以加快访问速度（但其实体验也并不快）。

```bash
# 该配置文件及目录，在Docker安装后并不会自动创建
$ sudo mkdir -p /etc/docker

# 配置加速地址
$ sudo tee /etc/docker/daemon.json <<-'EOF'
{
   "registry-mirrors": ["https://registry.docker-cn.com"]
}
EOF

# 重启服务
$ sudo systemctl daemon-reload
$ sudo systemctl restart docker
```

> **注意**
>
> 以上操作有两点提醒读者重点关注：
>
> 1. 必须保证daemon.json文件中完全符合JSON格式，如果错了，Docker不会给提示，直接起不来。
> 2. 如果Docker是作为systemd管理的服务的，daemon.json文件会处于锁定状态，应先关闭后再修改配置；

这两点出了问题都会导致Docker服务直接无法启动，如果出现该情况，可以通过systemd status命令检查，看是否有类似如下的错误提示：

```bash
 Drop-In: /etc/systemd/system/docker.service.d
           └─mirror.conf
   Active: inactive (dead) (Result: exit-code) since 五 2017-09-15 13:25:28 CST; 7min ago
     Docs: https://docs.docker.com
 Main PID: 21151 (code=exited, status=1/FAILURE)
```

如果是，修改daemon.json后重新启动即可。另，关闭systemd服务的方法是：

```bash
$ sudo systemctl stop docker
$ sudo rm -rf /etc/systemd/system/docker.service.d
```

最后，Docker的官方国内镜像库的速度只能说比起访问国外好了一丢丢，聊胜于无。国内还有一些公开的镜像库，如微软的、网易的等，但要么是不稳定，要么也是慢。比较靠谱的是阿里云的镜像库，但这个服务并不是公开的，需要使用者先到阿里云去申请开发者账户，再使用加速服务，申请后会得一个类似于“[https://yourname.mirror.aliyuncs.com”的私有地址，把它设置到daemon.json中即可使用。](https://yourname.mirror.aliyuncs.com”的私有地址，把它设置到daemon.json中即可使用。)

## \[可选\] 为Docker设置代理

另外一种解决Docker镜像下载速度慢的方案就是使用代理，Docker的代理可以直接读取系统的全局代理，即系统中的HTTP\_PROXY、HTTPS\_PROXY两个环境变量。不过，如果设置这两个变量，其他大量Linux下的其他工具也会受到影响，所以建议的方式是给Docker服务设置专有的环境变量，我们使用Systemd来管理Docker服务，那直接给这个服务设置一个额外配置即可，操作如下：

```bash
sudo mkdir -p /etc/systemd/system/docker.service.d

# 配置代理地址，支持http、https、socks、socks5等协议
$ sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<-'EOF'
[Service]
Environment="HTTP_PROXY=socks5://192.168.31.125:2012"
EOF

#重启docker
$ sudo systemctl restart docker
```

设置后可以通过systemctl检查一下环境变量，看看是否有设置成功：

```bash
$ systemctl show --property=Environment docker
```

输出：

```bash
Environment=HTTP_PROXY=socks5://192.168.31.125:2012
```

## \[可选\] 开放Docker远程服务

如果需要在其他机器上管理Docker——譬如典型的如在IntelliJ IDEA这类IDE环境中给远程Docker部署镜像，那可以开启Docker的远程管理端口，这步没有设置任何安全访问措施，请不要在生产环境中进行。

具体做法是修改Docker的服务配置：

> Debian系：
>
> ```bash
> $ sudo vim /lib/systemd/system/docker.service
> ```
>
> RedHat系：
>
> ```bash
> $ sudo vim /usr/lib/systemd/system/docker.service
> ```

在ExexStart后面增加以下参数（2375端口可以自定义）：

```bash
-H tcp://0.0.0.0:2375 -H unix://var/run/docker.sock
```

譬如，默认安装完Docker，修改之后完整的ExexStart应当如下所示：

```bash
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2375 -H unix://var/run/docker.sock
```
最后重启Docker服务即可：

```bash
#重启docker
$ sudo systemctl daemon-reload
$ sudo systemctl restart docker
```



## \[可选\] 启用Docker命令行自动补全功能

在控制台输入docker命令时可以获得自动补全能力，提高效率。

Docker自带了bash的命令行补全，用其他shell，如zsh，则需采用zsh的插件或者自行获取补全信息

> bash：
>
> ```bash
> $ echo 'source /usr/share/bash-completion/completions/docker' >> ~/.bashrc
> ```
>
> zsh：
>
> ```bash
> $ mkdir -p ~/.zsh/completion
> $ curl -L https://raw.githubusercontent.com/docker/docker/master/contrib/completion/zsh/_docker > ~/.zsh/completion/_docker
>
> $ echo 'fpath=(~/.zsh/completion $fpath)' >> ~/.zshrc
> $ echo 'autoload -Uz compinit && compinit -u' >> ~/.zshrc
> ```

## \[可选\] 将Docker设置为开机启动

一般使用systemd来管理启动状态

```bash
# 设置为开机启动
$ sudo systemctl enable docker

# 立刻启动Docker服务
$ sudo systemctl start docker
```

## 卸载Docker

> Debian系：
>
> ```bash
> $ sudo apt-get purge docker-ce
>
> # 清理Docker容器缓存和自定义配置
> $ sudo rm -rf /var/lib/docker
> ```
>
> RedHat系：
>
> ```bash
> $ sudo yum remove docker-ce
>
> # 清理Docker容器缓存和自定义配置
> $ sudo rm -rf /var/lib/docker
> ```

