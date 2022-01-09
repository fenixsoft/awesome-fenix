# 部署 Elastic Stack

无状态应用在 Kubernetes 上部署和迁移都是很容易做到的，但是有状态应用的迁移相对还是有一定门槛，特别是部署对线上环境需要高可用的集群模式时则会更为麻烦，前面文章介绍过，现在比较好的针对有状态应用的部署方案是[Operator](/immutable-infrastructure/container/application-centric.html#operator与crd)，市面上也的确出现了很多官方、非官方的 Operator，譬如 Prometheus Operator、Etcd Operator 等等，

由于 Elasticsearch 的关系，ELK Stack 属于典型的有状态应用，Elastic.co 官方也推出了基于 Kubernetes Operator 的 Elastic Cloud on Kubernetes（ECK），用户可使用该产品在 Kubernetes 上较为轻松地配置、管理和运行 Elasticsearch 集群。

## Elastic Cloud on Kubernetes

ECK 使用 Kubernetes Operator 模式构建而成，但它的功能并不局限于部署与迁移，下面为 Elastic.co 官方博客上对 ECK 的中文介绍，供你对 ECk 有个基本的了解：

:::quote 官方博客《在 Kubernetes 上运行 Elasticsearch：开启新篇》

`Elastic Cloud on Kubernetes(ECK)`是一个 Elasticsearch Operator，但远不止于此。 ECK 使用 Kubernetes Operator 模式构建而成，需要安装在您的 Kubernetes 集群内，其功能绝不仅限于简化 Kubernetes 上 Elasticsearch 和 Kibana 的部署工作这一项任务。ECK 专注于简化所有后期运行工作，例如：

- 管理和监测多个集群
- 轻松升级至新的版本
- 扩大或缩小集群容量
- 更改集群配置
- 动态调整本地存储的规模（包括 Elastic Local Volume（一款本地存储驱动器））
- 备份

ECK 不仅能自动完成所有运行和集群管理任务，还专注于简化在 Kubernetes 上使用 Elasticsearch 的完整体验。ECK 的愿景是为 Kubernetes 上的 Elastic 产品和解决方案提供 SaaS 般的体验。 在 ECK 上启动的所有 Elasticsearch 集群都默认受到保护，这意味着在最初创建的那一刻便已启用加密并受到默认强密码的保护。

> 从 6.8 和 7.1 版本开始，Elasticsearch 核心安全功能（TLS 加密、基于角色的访问控制，以及文件和原生身份验证）会免费提供。

通过 ECK 部署的所有集群都包括强大的基础（免费）级功能，例如可实现密集存储的冻结索引、Kibana Spaces、Canvas、Elastic Maps，等等。您甚至可以使用 Elastic Logs 和 Elastic Infrastructure 应用监测 Kubernetes 日志和基础设施。您可以获得在 Kubernetes 上使用 Elastic Stack 完整功能的体验。

ECK 内构建了 Elastic Local Volume，这是一个适用于 Kubernetes 的集成式存储驱动器。ECK 中还融入了很多最佳实践，例如在缩小规模之前对节点进行 drain 操作，在扩大规模的时候对分片进行再平衡，等等。从确保在配置变动过程中不会丢失数据，到确保在规模调整过程中实现零中断。

:::right

—— [Anurag Gupta](https://www.elastic.co/cn/blog/author/anurag-gupta)，[Elasticsearch on Kubernetes: A New Chapter Begins](https://www.elastic.co/cn/blog/introducing-elastic-cloud-on-kubernetes-the-elasticsearch-operator-and-beyond)

:::

## 安装 ECK

由于 Elasticsearch 是相对重量级的应用，建议你的 Kubernetes 每个节点至少有 4 至 8 GB 的可用内存。ECK 支持的最低软件版本如下所示：

> - kubectl 1.11+
> - Kubernetes 1.12+ or OpenShift 3.11+
> - Google Kubernetes Engine (GKE), Azure Kubernetes Service (AKS), and Amazon Elastic Kubernetes Service (EKS)
> - Elasticsearch, Kibana, APM Server: 6.8+, 7.1+
> - Enterprise Search: 7.7+
> - Beats: 7.0+

首先在集群中安装 ECK 对应的 Operator 资源对象：

```bash
$ kubectl apply -f https://download.elastic.co/downloads/eck/1.2.1/all-in-one.yaml
```

安装成功后，会自动创建一个`elastic-system`的名称空间以及一个 Operator 的 Pod：

```bash
$ kubectl get pods -n elastic-system
NAME                             READY   STATUS    RESTARTS   AGE
elastic-operator-0               1/1     Running   1          15h
```

你可以通过以下命令来查看 Operator 的工作日志：

```bash
$ kubectl -n elastic-system logs -f statefulset.apps/elastic-operator
```

## 部署 Elasticsearch 集群

有 ECK Operator 的帮助，你可以直接使用类型为`Elasticsearch`的自定义资源来部署 Elasticsearch 集群，以下命令部署一套节点个数为 1，版本为 7.9.2 的 Elasticsearch 集群：

```bash
$ cat <<EOF | kubectl apply -f -
apiVersion: elasticsearch.k8s.elastic.co/v1
kind: Elasticsearch
metadata:
  name: quickstart
spec:
  version: 7.9.2
  nodeSets:
  - name: default
    count: 1
    config:
      node.master: true
      node.data: true
      node.ingest: true
      node.store.allow_mmap: false
EOF
```

该命令执行完毕后，Pod、Service 均已自动生成，你可以使用一下命令验证：

```bash
$ kubectl get elasticsearch
NAME          HEALTH    NODES     VERSION   PHASE         AGE
quickstart    green     1         7.9.2     Ready         1m

$ kubectl get service quickstart-es-http
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
quickstart-es-http   ClusterIP   10.15.251.145   <none>        9200/TCP   34m
```

你只要获取访问凭证，就可以通过 HTTP 访问到 Elasticsearch 服务，获取访问凭证的操作如下：

```bash
PASSWORD=$(kubectl get secret quickstart-es-elastic-user -o go-template='{{.data.elastic | base64decode}}')
```

通过 HTTP 访问 Elasticsearch 服务的操作如下：

```
$ curl -u "elastic:$PASSWORD" -k "https://quickstart-es-http:9200"
```

如果需要在外部访问，通过 Kubernetes 的端口转发即可实现：

```bash
$ kubectl port-forward service/quickstart-es-http 9200

# 在另一个Console中：
$ curl -u "elastic:$PASSWORD" -k "https://localhost:9200"

{
  "name" : "quickstart-es-default-0",
  "cluster_name" : "quickstart",
  "cluster_uuid" : "XqWg0xIiRmmEBg4NMhnYPg",
  "version" : {...},
  "tagline" : "You Know, for Search"
}
```

## 部署 Kibana

与部署 Elasticsearch 集群类似，使用类型为`Kibana`的自定义资源即可快速部署 Kibana 实例，命令如下所示：

```bash
$ cat <<EOF | kubectl apply -f -
apiVersion: kibana.k8s.elastic.co/v1
kind: Kibana
metadata:
  name: quickstart
spec:
  version: 7.9.2
  count: 1
  elasticsearchRef:
    name: quickstart
EOF
```

你可以通过集群 ClusterIP 及 5601 端口来访问 Kibana，或者进行端口转发到外部：

```bash
$ kubectl port-forward service/quickstart-kb-http 5601
```

当你从浏览器登录 Kibana 时候需要凭证，通过如下方式获取：

```bash
$ kubectl get secret quickstart-es-elastic-user -o=jsonpath='{.data.elastic}' | base64 --decode; echo
```
