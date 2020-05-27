# 部署Kubernetes集群

Kubernetes是一个由Google发起的开源自动化部署，缩放，以及容器化管理应用程序的容器编排系统。

部署Kubernetes曾经是一件比较麻烦的事情，kubelet、Api-Server、etcd、controller-manager等每一个组件都需要自己部署，还要创建自签名证书来保证各个组件之间的网络访问。但程序员大概是最爱偷懒最怕麻烦的群体，随着Kubernetes的后续版本不断改进（如提供了自动生成证书、Api-Server等组件改为默认静态Pod部署方式），使得部署和管理Kubernetes集群正在变得越来越简单。目前主流的方式大致有：

* [使用Kubeadm部署Kubernetes集群](setup-kubeadm.md)
* [使用Rancher部署、管理Kubernetes集群](setup-rancher.md)</br>
  其他如KubeSphere等在Kubernetes基础上构建的工具均归入此类
* [使用Minikube在本地单节点部署Kubernetes集群](setup-minikube.md)</br>
  其他如Microk8s等本地环境的工具均归入此类
* 在Google Kubernetes Engine云原生环境中部署</br>
 其他如AWS、阿里云、腾讯云等提供的Kubernetes云主机均归入此类

以上集中部署方式都有很明显的针对性，个人开发环境以Minikube最简单，生产环境以Rancher最简单，在云原生环境中，自然是使用环境提供的相应工具。不过笔者推荐首次接触Kubernetes的同学最好还是选择Kubeadm来部署，毕竟这是官方提供的集群管理工具，是相对更底层、基础的方式，充分熟悉了之后再接触其他简化的方式会快速融会贯通。 以上部署方式无需全部阅读，根据自己环境的情况选择其一即可。

