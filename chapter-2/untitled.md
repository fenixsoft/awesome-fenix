# 依赖环境准备

## 一、安装Docker CE容器环境

        本文为Linux系统安装Docker容器环境的简要说明，记录了安装稳定最新发行版（Stable Release）的命令执行过程及含义。若需了解Docker安装其他方面的内容，如安装Nightly/Test版本、Backporting、软件版权和支持等信息，可参考官方的部署指南：[https://docs.docker.com/install/](https://docs.docker.com/install/)

1 更新仓库

安装Docker依赖工具:

{% tabs %}
{% tab title="Debian" %}
```bash
$ sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
```
{% endtab %}

{% tab title="Redhat" %}
```bash
$ sudo yum install -y yum-utils \
    device-mapper-persistent-data \
    lvm2
```
{% endtab %}
{% endtabs %}

{% hint style="info" %}
 如果以前已经安装过旧版本的Docker（可能会被称为docker，docker.io 或 docker-engine），需先行卸载
{% endhint %}

Once you're strong enough, save the world:

{% code title="hello.sh" %}
```bash
# Ain't no code for that yet, sorry
echo 'You got to trust me on this, I saved the world'
```
{% endcode %}



