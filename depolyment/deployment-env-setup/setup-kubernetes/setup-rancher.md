# 使用Rancher建立Kubernetes集群

Rancher是在Kubernetes更上层的管理框架，Rancher是图形化的，有着比较傻瓜式的操作，只有少量一两处地方（如导入集群）需要用到Kubernetes命令行。也由于它提供了一系列容器模版、应用商店等的高层功能，使得要在Kubernetes上部署一个新应用，简化到甚至只需要点几下鼠标即可，所以大家都爱使用它。

Rancher还推出了RancherOS（极致精简专为容器定制的Linux，适合边缘计算环境）、K3S（Kubernetes as a Service，5 Less Than K8S，一个大约只有40MB，可以运行在x86和ARM架构上的极小型Kubernetes发行版）这样的概念产品，用以在用户心中暗示、强化比K8S更简单、更易用的主观印象。

不过也由于Rancher入门容易，基础性的应用需求解决起来很方便，也导致了不少人一开始使用它之后，就陷入了先入为主的印象，后期再接触Kubernetes时，就觉得学习曲线特别陡峭，反而限制了对底层问题的进一步深入。

在本文中，笔者以截图为主，展示如何使用Rancher来导入或者创建Kubernetes集群。

## 安装Rancher

前置条件：已经[安装好Docker](../setup-docker.md)。使用Docker执行rancher镜像即可：

```bash
$ sudo docker run -d --restart=unless-stopped -p 80:80 -p 443:443 rancher/rancher
```

## 使用Rancher管理现有Kubernetes集群

前置条件：已经[安装好了Kubernetes集群](setup-kubeadm.md)。使用Rancher的导入功能将其纳入管理。登陆Rancher主界面（首次登陆会要求设置admin密码）之后，点击右上角的Add Cluster，然后有下面几个添加集群的选择：

![](images\rancher-add-cluster.png)

- 要从某台机器中新安装Kubernetes集群选择“From existing nodes (Custom)”
- 要导入某个已经安装好的Kubernetes集群选择“Import an existing cluster”
- 要从各种云服务商的RKE环境中创建，就选择下面那排厂商的按钮，没有的话（譬如国内的阿里云之类的的），请先到Tools->Driver中安装对应云服务厂商的驱动。

这里选择“Import an existing cluster”，然后给集群起个名字以便区分（由于Rancher支持多集群管理，所以要起个名字），之后就看见这个界面：

![](images\rancher-import-cluster.png)

Rancher自动生成了加入集群的命令，这其实是一个运行在Kubernetes中的proxy，在Kubernetes的命令行中执行以上生成的命令。上面那条是怕由于部署的Rancher服务没有申请SSL证书，导致HTTPS域名验证过不去，kubectl下载不下来。如果你的Rancher部署在已经申请了证书的HTTPS地址上那可以用前面的，否则还是直接用curl --insecure命令来绕过HTTPS证书查验吧，就是最下面那条命令：

```bash
$ curl --insecure -sfL https://localhost:8443/v3/import/vgkj5tzphj9vzg6l57krdc9gfc4b4zsfp4l9prrf6sb7z9d2wvbhb5.yaml | kubectl apply -f -
```

多说一句，用上面哪条命令安装的agent只决定了yaml文件是如何下载获得的，对后续其他事情是毫无影响，所以建议都用第二条，别折腾。

执行结果类似如下所示，一堆secret、deployment、daementset创建成功，就代表顺利完成了：

![](images\rancher-import-command.png)

然后回到Rancher网页，点击界面上的“Done”按钮。可以看到集群正处于Pending状态：

![](images\rancher-import-pendding.png)

很快状态就变成了Waiting，然后再变为Active，导入工作顺利完成。

如果一次持续Pending状态，说明安装的agent无法访问到Rancher的机器，可以通过kubectl logs命令查看一下cattle-cluster-agent的日志，通常会看见"XXX is not accessible"，这里XXX是Rancher第一次进入时跟你确认的访问地址，如果你乱填了或者该地址被防火墙、或证书限制卡住而导致agent无法访问，就会一直Pendding。

## 使用Rancher创建Kubernetes集群
