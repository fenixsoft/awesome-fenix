# Table of contents

* [The Fenix Project](README.md)

## 前言 <a id="introduction"></a>

* [关于作者](introduction/about-me.md)
* [什么是“The Fenix Project”？](introduction/about-the-fenix-project.md)

## 快速部署 <a id="depolyment"></a>

* [开发环境](depolyment/development-env-setup/README.md)
  * [安装基础开发依赖](depolyment/development-env-setup/base-setup.md)
  * [使用IntelliJ Idea进行开发调试](depolyment/development-env-setup/idea-setup.md)
  * [使用Eclipse进行开发调试](depolyment/development-env-setup/eclipse-setup.md)
* [部署环境](depolyment/deployment-env-setup/README.md)
  * [部署Docker CE容器环境](depolyment/deployment-env-setup/setup-docker.md)
  * [部署Kubernetes集群](depolyment/deployment-env-setup/setup-kubernetes/README.md)
    * [使用Kubeadm部署Kubernetes集群](depolyment/deployment-env-setup/setup-kubernetes/setup-kubeadm.md)
    * [使用Rancher建立Kubernetes集群](depolyment/deployment-env-setup/setup-kubernetes/setup-rancher.md)
    * [使用Minikube安装Kubernetes集群](depolyment/deployment-env-setup/setup-kubernetes/setup-minikube.md)
* [运维环境](depolyment/operation-env-setup/README.md)
  * [在K8S上部署DevOps](depolyment/operation-env-setup/devops-setup.md)
  * [在K8S上部署ELK/EFK日志监控](depolyment/operation-env-setup/elk-setup.md)

## 架构风格的演变 <a id="architecture"></a>

* [服务变迁史](architecture/architect-history.md)
* [单体架构](architecture/monolithic-architecture/README.md)
  * [基于SpringBoot的单体架构](architecture/monolithic-architecture/springboot-base-arch.md)
  * [基于J2EE的单体架构](architecture/monolithic-architecture/j2ee-base-arch.md)
* [微服务架构](architecture/microservices-architecture/README.md)
  * [SpringCloud时代的微服务](architecture/microservices-architecture/springcloud-base-arch.md)
  * [Kubernetes时代的微服务](architecture/microservices-architecture/kubernetes-base-arch.md)
  * [后Kubernetes时代的微服务](architecture/microservices-architecture/servicemesh-lstio-arch.md)
* [无服务架构](architecture/serverless-architecture/README.md)
  * [基于Knative的无服务](architecture/serverless-architecture/serverless-arch-knative.md)
  * [基于Kubeless的无服务](architecture/serverless-architecture/serverless-arch-kubeless.md)

## 微服务核心技术 <a id="technology"></a>

* [服务发现](technology/service-discovery.md)
* [负载均衡](technology/load-balancing.md)
* [链路治理](technology/invokechain-manage/README.md)
  * [流控](technology/invokechain-manage/traffic-control.md)
  * [降级](technology/invokechain-manage/service-downgrade.md)
  * [异常注入](technology/invokechain-manage/exception-inject.md)
  * [链路跟踪](technology/invokechain-manage/invokechain-trace.md)
* [安全、认证及授权](technology/security.md)
* [日志、监控与预警](technology/logging/README.md)
  * [网关与路由](technology/logging/service-gateway.md)
* [配置中心](technology/configuration.md)
* [队列与消息总线](technology/message-queue-bus.md)

## 不可变的基础设施 <a id="infrastructure"></a>

* [网络](infrastructure/network/README.md)
  * [K8S的CNI网络](infrastructure/network/kubernetes-cni.md)
  * [K8S的负载均衡](infrastructure/network/kubernetes-lb.md)
* [共享存储](infrastructure/storage.md)
* [GPU虚拟化](infrastructure/gpu-support.md)
* [硬件资源调度](infrastructure/hardware-schedule.md)

## 独立专题 <a id="monographic"></a>

* [GraalVM：微服务时代的Java](monographic/graalvm-improvement.md)
* [分布式与一致性](monographic/distributed-transaction.md)

## 项目发布 <a id="release"></a>

* [构建发布脚本](release/build-script.md)
* [持续集成](release/continuous-integration.md)
* [灰度发布](release/gated-launch.md)

