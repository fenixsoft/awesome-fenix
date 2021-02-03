# K8S-APIServer启动过程

启动入口：`k8s.io/kubernetes/cmd/kube-apiserver/app/server.go::Run()`，内部调用了两个方法：
1. `CreateServerChain()`，名字中 “Server Chain”包含了API Extensions Server、Kube API Server、Aggregator Server三个服务器的资源配置及路由创建。

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

2. 在API Extensions Server、Kube API Server、Aggregator Server三个服务器完成Controller注册和启动之后，会调用`APIAggregator.PrepareRun()`，启动整个delegation链的运作，这步主要动作是调用`delegationTarget.PrepareRun()`和注册好Healths\Lives\Readys三个探针Endpoint

3. 执行`preparedAPIAggregator.Run()`，启动一个HTTP服务器，对外提供API访问服务。



