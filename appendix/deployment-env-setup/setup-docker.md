# 部署 Docker CE 容器环境

本文为 Linux 系统安装 Docker 容器环境的简要说明，主要包括：

1. 安装稳定最新发行版（Stable Release）的命令及含义。
2. 针对国内网络环境的必要镜像加速或者代理设置工作。

若需了解 Docker 安装其他方面的内容，如安装 Nightly/Test 版本、Backporting、软件版权和支持等信息，可参考官方的部署指南：[https://docs.docker.com/install/](https://docs.docker.com/install/)

文中涉及到的 Debian 系和 Redhat 系的包管理工具，主要包括：

- Debian 系：Debian、Ubuntu、Deepin、Mint
- Redhat 系：RHEL、Fedora、CentOS

如用的其他 Linux 发行版，如 Gentoo、Archlinux、OpenSUSE 等，建议自行安装二进制包。

## 移除旧版本 Docker

如果以前已经安装过旧版本的 Docker（可能会被称为 docker，docker.io 或 docker-engine），需先行卸载。

> Debian 系：
>
> ```bash
> $ sudo apt-get remove docker docker-engine docker.io containerd runc docker-ce docker-ce-cli containerd.io
> ```
>
> RedHat 系：
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

## 安装 Docker 依赖工具链及软件源

在 Debian 上主要是为了 apt 能够正确使用 HTTPS 协议，并将 Docker 官方的 GPG Key（GNU Privacy Guard，包的签名机制）和软件源地址注册到软件源中。

在 RHEL 上是为了 devicemapper 获得 yum-config-manager、device-mapper-persistent-data、lvm2 的支持。

> Debian 系：
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
> RedHat 系：
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

> Debian 系：
>
> ```bash
> $ sudo apt-get update
> ```
>
> RedHat 系：
>
> ```bash
> $ sudo yum update
> ```

## 安装 Docker-Engine Community

> Debian 系：
>
> ```bash
> $ sudo apt-get install docker-ce docker-ce-cli containerd.io
> ```
>
> RedHat 系：
>
> ```bash
> $ sudo yum install docker-ce docker-ce-cli containerd.io
> ```

## 确认 Docker 安装是否成功

直接运行官方的 hello-world 镜像测试安装是否成功

```bash
$ sudo docker run hello-world
```

## 配置国内镜像库 <Badge text="可选" type="warning"/>

由于 Docker 官方镜像在国内访问缓慢，官方提供了在国内的镜像库：[https://registry.docker-cn.com](https://registry.docker-cn.com)，以加快访问速度（但其实体验也并不快）。

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
> 1. 必须保证 daemon.json 文件中完全符合 JSON 格式，如果错了，Docker 不会给提示，直接起不来。
> 2. 如果 Docker 是作为 systemd 管理的服务的，daemon.json 文件会处于锁定状态，应先关闭后再修改配置；

这两点出了问题都会导致 Docker 服务直接无法启动，如果出现该情况，可以通过 systemd status 命令检查，看是否有类似如下的错误提示：

```bash
 Drop-In: /etc/systemd/system/docker.service.d
           └─mirror.conf
   Active: inactive (dead) (Result: exit-code) since 五 2017-09-15 13:25:28 CST; 7min ago
     Docs: https://docs.docker.com
 Main PID: 21151 (code=exited, status=1/FAILURE)
```

如果是，修改 daemon.json 后重新启动即可。另外，关闭 systemd 服务的方法是：

```bash
$ sudo systemctl stop docker
$ sudo rm -rf /etc/systemd/system/docker.service.d
```

最后，Docker 的官方国内镜像库的速度只能说比起访问国外好了一丢丢，聊胜于无。国内还有一些公开的镜像库，如微软的、网易的等，但要么是不稳定，要么也是慢。比较靠谱的是阿里云的镜像库，但这个服务并不是公开的，需要使用者先到阿里云去申请开发者账户，再使用加速服务，申请后会得一个类似于“https://yourname.mirror.aliyuncs.com”的私有地址，把它设置到daemon.json中即可使用。

## 为 Docker 设置代理 <Badge text="可选" type="warning"/>

另外一种解决 Docker 镜像下载速度慢的方案就是使用代理，Docker 的代理可以直接读取系统的全局代理，即系统中的 HTTP_PROXY、HTTPS_PROXY 两个环境变量。不过，如果设置这两个变量，其他大量 Linux 下的其他工具也会受到影响，所以建议的方式是给 Docker 服务设置专有的环境变量，我们使用 Systemd 来管理 Docker 服务，那直接给这个服务设置一个额外配置即可，操作如下：

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

设置后可以通过 systemctl 检查一下环境变量，看看是否有设置成功：

```bash
$ systemctl show --property=Environment docker
```

输出：

```bash
Environment=HTTP_PROXY=socks5://192.168.31.125:2012
```

## 开放 Docker 远程服务 <Badge text="可选" type="warning"/>

如果需要在其他机器上管理 Docker——譬如典型的如在 IntelliJ IDEA 这类 IDE 环境中给远程 Docker 部署镜像，那可以开启 Docker 的远程管理端口，这步没有设置任何安全访问措施，请不要在生产环境中进行。

具体做法是修改 Docker 的服务配置：

> Debian 系：
>
> ```bash
> $ sudo vim /lib/systemd/system/docker.service
> ```
>
> RedHat 系：
>
> ```bash
> $ sudo vim /usr/lib/systemd/system/docker.service
> ```

在 ExexStart 后面增加以下参数（2375 端口可以自定义）：

```bash
-H tcp://0.0.0.0:2375 -H unix://var/run/docker.sock
```

譬如，默认安装完 Docker，修改之后完整的 ExexStart 应当如下所示：

```bash
ExecStart=/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock -H tcp://0.0.0.0:2375 -H unix://var/run/docker.sock
```

最后重启 Docker 服务即可：

```bash
#重启docker
$ sudo systemctl daemon-reload
$ sudo systemctl restart docker
```

## 启用 Docker 命令行自动补全功能 <Badge text="可选" type="warning"/>

在控制台输入 docker 命令时可以获得自动补全能力，提高效率。

Docker 自带了 bash 的命令行补全，用其他 shell，如 zsh，则需采用 zsh 的插件或者自行获取补全信息

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
> $ curl -L https://raw.githubusercontent.com/docker/cli/master/contrib/completion/zsh/_docker > ~/.zsh/completion/_docker
>
> $ echo 'fpath=(~/.zsh/completion $fpath)' >> ~/.zshrc
> $ echo 'autoload -Uz compinit && compinit -u' >> ~/.zshrc
> ```

## 将 Docker 设置为开机启动 <Badge text="可选" type="warning"/>

一般使用 systemd 来管理启动状态

```bash
# 设置为开机启动
$ sudo systemctl enable docker

# 立刻启动Docker服务
$ sudo systemctl start docker
```

## 安装 Docker-Compose

在开发和部署微服务应用时，经常要使用 Docker-Compose 来组织多个镜像，对于 Windows 系统它是默认安装的，在 Linux 下需要另外下载一下，下载后直接扔到 bin 目录，加上执行权限即可使用

```bash
# 从GitHub下载
sudo curl -L "https://github.com/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
# 从国内镜像下载
sudo curl -L "https://get.daocloud.io/docker/compose/releases/download/1.25.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
```

## 卸载 Docker

> Debian 系：
>
> ```bash
> $ sudo apt-get purge docker-ce
>
> # 清理Docker容器缓存和自定义配置
> $ sudo rm -rf /var/lib/docker
> ```
>
> RedHat 系：
>
> ```bash
> $ sudo yum remove docker-ce
>
> # 清理Docker容器缓存和自定义配置
> $ sudo rm -rf /var/lib/docker
> ```
