# Table of contents

* [The Fenix Project](README.md)

## 前言 <a id="introduction"></a>

* [阅读约定](introduction/contract.md)

## 快速部署 <a id="quick-depoly"></a>

* [开发环境](quick-depoly/development-env-setup/README.md)
  * [安装基础开发依赖](chapter-2/development-env-setup/base-setup.md)
  * [使用IntelliJ Idea进行开发调试](quick-depoly/development-env-setup/idea-setup.md)
  * [使用Eclipse进行开发调试](quick-depoly/development-env-setup/eclipse-setup.md)
* [部署环境](quick-depoly/deployment-env-setup/README.md)
  * [部署Docker CE容器环境](chapter-2/deployment-env-setup/setup-docker.md)
  * [部署Kubernetes集群](quick-depoly/deployment-env-setup/setup-kubernetes/README.md)
    * [使用Kubeadm部署Kubernetes集群](quick-depoly/deployment-env-setup/setup-kubernetes/setup-kubeadm.md)
    * [使用Rancher建立Kubernetes集群](quick-depoly/deployment-env-setup/setup-kubernetes/setup-rancher.md)
    * [使用Minikube安装Kubernetes集群](quick-depoly/deployment-env-setup/setup-kubernetes/setup-minikube.md)
* [运维环境](chapter-2/operation-env-setup/README.md)
  * [在K8S上部署DevOps](chapter-2/operation-env-setup/devops-setup.md)
  * [在K8S上部署ELK/EFK日志监控](chapter-2/operation-env-setup/elk-setup.md)

## 架构风格 <a id="architecture"></a>

* [业务逻辑](architecture/requirement.md)
* [基于SpringBoot的单体架构](chapter-3/springboot-base-arch.md)
* [基于SpringCloud的微服务架构](chapter-3/springcloud-base-arch.md)
* [基于Kubernetes的微服务架构](architecture/kubernetes-improvement.md)
* [基于GraalVM的微服务化](chapter-3/graalvm-improvement.md)

## 技术实现细节 <a id="technology"></a>

* [参数配置管理](chapter-4/configuration.md)
* [日志与监控](technology/logging.md)
* [安全及认证](technology/untitled.md)
* [服务发现](chapter-4/service-discovery.md)
* [服务注册与消费](chapter-4/service-register-consumer.md)
* [网关与路由](chapter-4/service-gateway.md)
* [链路治理](technology/invokechain-manage/README.md)
  * [流控](chapter-4/invokechain-manage/traffic-control.md)
  * [异常注入](chapter-4/invokechain-manage/exception-inject.md)
  * [链路跟踪](chapter-4/invokechain-manage/invokechain-trace.md)
* [队列与消息总线](chapter-4/message-queue-bus.md)

## 虚拟硬件基础设施 <a id="infrastructure"></a>

* [网络](infrastructure/network/README.md)
  * [K8S的CNI网络](infrastructure/network/kubernetes-cni.md)
  * [K8S的负载均衡](infrastructure/network/kubernetes-lb.md)
* [存储](infrastructure/storage.md)
* [GPU虚拟化](infrastructure/gpu-support.md)
* [硬件资源调度](infrastructure/hardware-schedule.md)

## 项目发布 <a id="release"></a>

* [构建发布脚本](chapter-5/build-script.md)
* [持续集成](chapter-5/continuous-integration.md)
* [灰度发布](chapter-5/gated-launch.md)
* [Untitled](release/untitled.md)

## 测试与性能度量 <a id="quality-assurance"></a>

* [Untitled](quality-assurance/untitled.md)

## 概念与思想 <a id="concepts"></a>

* [Untitled](gai-nian-yu-si-xiang/untitled.md)

