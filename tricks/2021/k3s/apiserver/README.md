# kube-apiserver源码解读

[官方介绍](https://kubernetes.io/zh/docs/reference/command-line-tools-reference/kube-apiserver/)：Kubernetes API 服务器验证并配置 API 对象的数据， 这些对象包括 pods、services、replicationcontrollers 等。 API 服务器为 REST 操作提供服务，并为集群的共享状态提供前端， 所有其他组件都通过该前端进行交互。

## 解析：

kube-apiserver在Kubernetes Control Panel中的作用是管理资源，管理的含义是开放出一系列的[Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)，提供对资源的操作提供认证、授权、CRUD等接口，供Agent和其他组件使用。可以认为是各个模块的数据交互和通信的枢纽。

这些接口的变动最终都会存储到后端的Etcd中（K3S中默认是被Kind代理的SQLIte），kube-apiserver是Kubernetes中直接与Etcd打交道的组件。

在kube-apiserver中，API资源一共有四类，分别是：

- 核心资源组，路径为：`https://master-ip:6443/api/v1/namespaces/$ns/$resource-name`，如nodes、pods、services等
- 具名资源组（Named Group），路径为：`https://master-ip:6443/apis/$group-name/$version/namespaces/$ns/$resource-name`，譬如`/apis/batch/v1/jobs`、`/apis/extendsions/v2alpha1/namespaces/`。具体的API Groups，可以在对应版本的Kubernetes的[API References](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.20/#-strong-api-groups-strong-)页面中查询到。
- 有外部添加的CR[D]资源。
- 用于暴露系统状态的一些固定端点，譬如`/metrics`（度量数据）、`/healthz`（健康数据）、`/ui`（Dashboard）、`/logs`（日志）、`/swaggerapi`（OpenAPI）等

这四类API资源，是以委托模式，通过DelegationTarget接口，由API Extensions Server、Kube API Server、Aggregator Server三个服务器所提供，它们的作用是：

1. **API Extensions Server**包含了对用户自定义扩展资源（CRD/CR）的支持，譬如增加一个CRD，它用到的API Version、Group、Handler、Hook等功能，涉及到一系列的Controller，如Discovery、Naming、NonStructruraSchema、ApiApproval、Finalizing等等。每一个Controller都会在一条goroutine中执行它的Run()方法，具体Controller如下：
   1. `openapiController`：将CRD资源的变化同步至提供的OpenAPI文档，可通过访问 `/openapi/v2`进行查看；
   2. `crdController`：负责将CRD信息注册到apiVersions和apiResources中，两者的信息可通过`$ kubectl api-versions`和`$ kubectl api-resources`查看；
   3. `namingController`：检查CRD对象是否有命名冲突，可在`crd.status.conditions`中查看；
   4. `establishingController`：检查CRD是否处于正常状态，可在`crd.status.conditions`中查看；
   5. `nonStructuralSchemaController`：检查CRD对象结构是否正常，可在`crd.status.conditions`中查看；
   6. `apiApprovalController`：检查CRD是否遵循Kubernetes API声明策略，可在`crd.status.conditions`中查看；
   7. `finalizingController`：类似于finalizes的功能，与CR的删除有关；
2. **Kube API Server**包含了对传统核心资源（Legacy API，就是以`/api`开头的资源），譬如Pod、Event、LimitRange、ResourceQuote等等，以及扩展资源（就是以`/apis`开头的资源，如`/apis/batch`、`/aps/extensions`），譬如Jobs、CronJobs、Namspaces的支持，这些都是在Kubernetes中以编码固定（不像CRD那样通过外部配置扩展）的资源，如何与APIServer交互都是由固定的内部函数来完成的。此外，Kube API Server还负责对请求的通用前置处理，如认证、授权等。
   1. `GenericAPIServer.NewDefaultAPIGroupInfo()`中读取默认的API资源信息。
   2. `GenericAPIServer.InstallAPIGroups()`中注册API资源，即将根据其定义，生成REST Endpoint供外部访问，并加入到DiscoveryManager中，供外部访问。
3. **Aggregator Server**聚合了API Extensions Server的自定义资源和Kube API Server的核心资源，功能类似于一个七层负载均衡，将来自用户的请求拦截转发给其他服务器，并且负责整个APIServer的Discovery功能，与API Extensions Server类似，Aggregator Server中也包含了一系列的Controller，其作用如下：
   1. `apiserviceRegistrationController`：负责APIServices中资源的注册与删除；
   2. `availableConditionController`：维护APIServices的可用状态，包括其引用Service是否可用等；
   3. `autoRegistrationController`：用于保持API中存在的一组特定的APIServices；
   4. `crdRegistrationController`：负责将CRD GroupVersions自动注册到APIServices中；
   5. `openAPIAggregationController`：将APIServices资源的变化同步至提供的OpenAPI文档；

## 源码：

- [K3S启动APIServer的环境准备](env.md)
- [K8S-APIServer启动过程](bootstrap.md)

