# 部署 Prometheus

如果要手动在 Kubernetes 中处理安装 Prometheus 的每一个细节还是挺麻烦的，在官方的[Kube-Prometheus](https://github.com/prometheus-operator/kube-prometheus)项目里提供了明确的操作步骤。不过，如果只是通过 Prometheus Operator 的 Bundle 包安装 Prometheus 则非常简单。

首先从以下地址中获取 Prometheus Operator 的源码：

```bash
$ git clone https://github.com/prometheus-operator/prometheus-operator.git
```

安装里面的`bundle.yaml`，然后就完成了：

```bash
$ kubectl apply -f bundle.yaml
```

卸载时，同样根据`bundle.yaml`删除即可：

```bash
$ kubectl delete -f bundle.yaml
```
